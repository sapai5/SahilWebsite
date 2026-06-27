/*
 * generate-world.mjs
 * ──────────────────────────────────────────────────────────────────────────
 * Build-time generator for a World Labs Marble world. It calls the Marble
 * World API, waits for generation to finish (~5 min), and downloads the
 * resulting Gaussian-splat (.spz) + panorama + thumbnail into
 * public/worlds/<slug>/ so the site can serve them statically.
 *
 * Generation costs credits and is slow, so this is intended to be run
 * manually / in CI — NOT on every page load.
 *
 * Usage:
 *   WLT_API_KEY=xxx node scripts/generate-world.mjs \
 *     --prompt "A vast misty canyon at golden hour, cinematic, explorable" \
 *     --slug hero \
 *     --model marble-1.1 \
 *     [--image https://example.com/photo.jpg] \
 *     [--tier full_res]   # one of: 100k | 500k | full_res
 *
 * After it finishes, point the hero at the downloaded world:
 *   NEXT_PUBLIC_HERO_WORLD_URL=/worlds/<slug>/world.spz
 * ──────────────────────────────────────────────────────────────────────────
 */

import { writeFile, mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = "https://api.worldlabs.ai/marble/v1";
const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 15 * 60_000; // 15 minutes

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

/* ── arg parsing ──────────────────────────────────────────────────── */
function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith("--")) {
            const key = a.slice(2);
            const next = argv[i + 1];
            if (next && !next.startsWith("--")) {
                args[key] = next;
                i++;
            } else {
                args[key] = true;
            }
        }
    }
    return args;
}

const args = parseArgs(process.argv);
const API_KEY = process.env.WLT_API_KEY;
const PROMPT =
    args.prompt ||
    "A vast, serene alien landscape at golden hour — sweeping terrain, soft volumetric light, distant mountains, cinematic and explorable";
const SLUG = args.slug || "hero";
const MODEL = args.model || "marble-1.1";
const IMAGE = args.image || null;
const TIER = args.tier || "full_res"; // 100k | 500k | full_res

if (!API_KEY) {
    console.error(
        "✗ Missing WLT_API_KEY. Get one at https://platform.worldlabs.ai/api-keys\n" +
        "  Then: WLT_API_KEY=xxx node scripts/generate-world.mjs --prompt \"...\"",
    );
    process.exit(1);
}

/* ── api helpers ──────────────────────────────────────────────────── */
function headers() {
    return { "Content-Type": "application/json", "WLT-Api-Key": API_KEY };
}

function buildWorldPrompt() {
    if (IMAGE) {
        return {
            type: "image",
            image_prompt: { source: "uri", uri: IMAGE },
            text_prompt: args.prompt || undefined,
        };
    }
    return { type: "text", text_prompt: PROMPT };
}

async function generate() {
    const body = {
        display_name: `portfolio-${SLUG}`,
        model: MODEL,
        world_prompt: buildWorldPrompt(),
    };
    const res = await fetch(`${API_BASE}/worlds:generate`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(`generate failed: ${res.status} ${await res.text()}`);
    }
    return res.json();
}

async function poll(operationId) {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
        const res = await fetch(`${API_BASE}/operations/${operationId}`, {
            headers: headers(),
        });
        if (!res.ok) {
            throw new Error(`poll failed: ${res.status} ${await res.text()}`);
        }
        const op = await res.json();
        const status = op?.metadata?.progress?.status ?? "IN_PROGRESS";
        process.stdout.write(`  …status: ${status}\r`);
        if (op.done) {
            if (op.error) throw new Error(`generation error: ${JSON.stringify(op.error)}`);
            return op.response;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    throw new Error("timed out waiting for world generation");
}

async function download(url, dest) {
    const res = await fetch(url);
    if (!res.ok || !res.body) {
        throw new Error(`download failed (${res.status}) for ${url}`);
    }
    await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

/* ── main ─────────────────────────────────────────────────────────── */
async function main() {
    const outDir = join(PUBLIC_DIR, "worlds", SLUG);
    await mkdir(outDir, { recursive: true });

    console.log(`▶ Generating Marble world "${SLUG}" with ${MODEL}`);
    console.log(`  prompt: ${IMAGE ? `image=${IMAGE}` : PROMPT}`);

    const op = await generate();
    const operationId = op.operation_id;
    console.log(`  operation: ${operationId} (this usually takes ~5 minutes)`);

    const world = await poll(operationId);
    console.log("\n✓ World generated");

    const assets = world?.assets ?? {};
    const spzUrl = assets?.splats?.spz_urls?.[TIER] ?? assets?.splats?.spz_urls?.["500k"];
    if (!spzUrl) {
        throw new Error(`no splat URL found in response: ${JSON.stringify(assets)}`);
    }

    console.log(`  downloading splats (${TIER})…`);
    await download(spzUrl, join(outDir, "world.spz"));

    if (assets?.imagery?.pano_url) {
        console.log("  downloading panorama…");
        await download(assets.imagery.pano_url, join(outDir, "pano.jpg")).catch((e) =>
            console.warn(`  (pano skipped: ${e.message})`),
        );
    }
    if (assets?.thumbnail_url) {
        console.log("  downloading thumbnail…");
        await download(assets.thumbnail_url, join(outDir, "thumbnail.jpg")).catch((e) =>
            console.warn(`  (thumbnail skipped: ${e.message})`),
        );
    }
    if (assets?.mesh?.collider_mesh_url) {
        console.log("  downloading collider mesh…");
        await download(assets.mesh.collider_mesh_url, join(outDir, "collider.glb")).catch(
            (e) => console.warn(`  (collider skipped: ${e.message})`),
        );
    }

    // Save metadata (world id, marble viewer url, caption) for reference.
    await writeFile(
        join(outDir, "world.json"),
        JSON.stringify(
            {
                id: world.id,
                world_marble_url: world.world_marble_url,
                caption: assets.caption ?? null,
                model: MODEL,
                tier: TIER,
                generated_at: new Date().toISOString(),
            },
            null,
            2,
        ),
    );

    console.log(`\n✅ Done → public/worlds/${SLUG}/world.spz`);
    if (world.world_marble_url) console.log(`   View in Marble: ${world.world_marble_url}`);
    console.log(`\nNext: set NEXT_PUBLIC_HERO_WORLD_URL=/worlds/${SLUG}/world.spz and restart dev.`);
}

main().catch((err) => {
    console.error(`\n✗ ${err.message}`);
    process.exit(1);
});
