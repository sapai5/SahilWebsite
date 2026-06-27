"use client";

import { dyno } from "@sparkjsdev/spark";

/**
 * "Point cloud → render" reveal, à la the World Labs Marble viewer.
 *
 * Returns a Spark object modifier (a dyno graph injected into the splat
 * generation pipeline) plus a `reveal` uniform you drive from 0 → 1.
 *
 * At reveal = 0 every Gaussian's kernel is scaled down to a tiny dot (so the
 * scene reads as a sparse point cloud); as reveal climbs to 1 each splat
 * "blooms" up to its full size. A per-splat hash staggers the bloom so the
 * world materialises in rather than popping uniformly.
 *
 * Drive it by setting `reveal.value` each frame and flagging the mesh's
 * `generatorDirty = true` so Spark re-runs the generator with the new value.
 */
export function makeRevealModifier() {
    const reveal = dyno.dynoFloat(0); // 0 = points, 1 = fully rendered

    const ZERO = dyno.dynoConst("float", 0);
    const ONE = dyno.dynoConst("float", 1);
    const MIN_SCALE = dyno.dynoConst("float", 0.08); // kernel size at "point" stage
    const GLOW_EXTRA = dyno.dynoConst("float", 1.8); // color boost while still points
    const STAGGER = dyno.dynoConst("float", 0.45); // how spread out the per-splat bloom is
    const INV_SPAN = dyno.dynoConst("float", 1 / (1 - 0.45)); // normalises the bloom window

    const modifier = dyno.dynoBlock(
        { gsplat: dyno.Gsplat },
        { gsplat: dyno.Gsplat },
        ({ gsplat }) => {
            const g = gsplat!;
            const { scales, center, rgb } = dyno.splitGsplat(g).outputs;

            // Per-splat 0..1 seed → each splat starts blooming at a different time.
            const seed = dyno.hashFloat(center);
            const local = dyno.mul(
                dyno.sub(reveal, dyno.mul(seed, STAGGER)),
                INV_SPAN,
            );
            const t = dyno.clamp(local, ZERO, ONE);
            const ease = dyno.smoothstep(ZERO, ONE, t);

            // Scale the Gaussian kernel from MIN_SCALE (dot) up to full size.
            const factor = dyno.mix(MIN_SCALE, ONE, ease);
            const newScales = dyno.mul(scales, factor);

            // Glow: boost the colour while it's still a point cloud, easing back
            // to the baked colour as the world builds in.
            const pointiness = dyno.sub(ONE, ease);
            const glowMul = dyno.add(ONE, dyno.mul(pointiness, GLOW_EXTRA));
            const newRgb = dyno.mul(rgb, glowMul);

            return {
                gsplat: dyno.combineGsplat({ gsplat: g, scales: newScales, rgb: newRgb }),
            };
        },
    );

    return { reveal, modifier };
}
