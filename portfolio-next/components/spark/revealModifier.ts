"use client";

import * as THREE from "three";
import { dyno } from "@sparkjsdev/spark";

/**
 * "Point cloud → render" reveal, à la the World Labs Marble viewer.
 *
 * Returns a Spark object modifier (a dyno graph injected into the splat
 * generation pipeline) plus a `reveal` uniform you drive from 0 → 1 and a
 * `camPos` uniform you set to the camera's position in the splat's local space.
 *
 * The reveal is a coherent **wavefront measured as distance from the camera**,
 * so it expands outward from the viewer and uses the splats themselves as the
 * depth map — nearest geometry materialises first and the front hugs whatever
 * is actually there (it follows the world's contour instead of cutting a flat
 * plane or a circle centred on the world origin). A glowing blue leading edge
 * ("the line") rides the front. Driving `reveal` back down recedes the front,
 * dissolving the world from far → near back into points.
 *
 * Drive it by setting `reveal.value` (and `camPos.value` once) each frame and
 * flagging the mesh's `generatorDirty = true` so Spark re-runs the generator.
 *
 * Tuning:
 *  • REVEAL_NEAR  — distance from the camera (object space) where the reveal
 *                   begins. ~0 starts right at the viewer.
 *  • REVEAL_SPAN  — distance over which the world reveals. Roughly the scene's
 *                   depth as seen from the start; raise if the far end never
 *                   sweeps in.
 *  • EDGE         — width of the soft moving band (0..1 of the sweep). Smaller =
 *                   crisper line; larger = softer dissolve.
 *  • TINT         — colour of the reveal glow (currently blue).
 */
export function makeRevealModifier() {
    const reveal = dyno.dynoFloat(0); // 0 = points, 1 = fully rendered
    const camPos = dyno.dynoVec3(new THREE.Vector3(0, 0, 0)); // camera in local space

    const ZERO = dyno.dynoConst("float", 0);
    const ONE = dyno.dynoConst("float", 1);
    const MIN_SCALE = dyno.dynoConst("float", 0.1); // kernel size at "point" stage
    const FRONT_GLOW = dyno.dynoConst("float", 2.2); // glow strength on the leading edge

    // Saturation + glow for the point-cloud stage so the splats read as vivid,
    // luminous colour (especially on a black background), easing back to the
    // baked colour as they resolve. TINT_LINE is the colour added at the front.
    const SAT = dyno.dynoConst("float", 3.6); // very high vibrance while points
    const POINT_GLOW = dyno.dynoConst("float", 1.7); // brightness lift on near points
    const DEPTH_DIM = dyno.dynoConst("float", 0.4); // far-point brightness fraction (depth cue)
    const TINT_LINE = dyno.dynoConst("vec3", new THREE.Vector3(0.18, 0.42, 1.0));
    // Rec. 601 luma weights — used to kill glow on bright splats so the bright
    // sun / sky doesn't get an edge line or bloom. SKY_KILL steepens that cutoff.
    const LUMA = dyno.dynoConst("vec3", new THREE.Vector3(0.299, 0.587, 0.114));
    const SKY_KILL = dyno.dynoConst("float", 2.5);

    // Distance-from-camera sweep. REVEAL_NEAR = 0, REVEAL_SPAN = 60, EDGE = 0.1
    // are baked as reciprocals where useful so the shader multiplies, not divides.
    const REVEAL_NEAR = dyno.dynoConst("float", 0.0);
    const INV_SPAN = dyno.dynoConst("float", 1 / 60.0); // 1 / REVEAL_SPAN
    const INV_EDGE = dyno.dynoConst("float", 1 / 0.1); // 1 / EDGE
    const ONE_PLUS_EDGE = dyno.dynoConst("float", 1 + 0.1); // 1 + EDGE
    const FOUR = dyno.dynoConst("float", 4);
    // Glow fades out completely by ~60% through the reveal so the back half of
    // the animation has no line or bloom.
    const GLOW_FADE_START = dyno.dynoConst("float", 0.45);
    const GLOW_FADE_END = dyno.dynoConst("float", 0.6);

    const modifier = dyno.dynoBlock(
        { gsplat: dyno.Gsplat },
        { gsplat: dyno.Gsplat },
        ({ gsplat }) => {
            const g = gsplat!;
            const { scales, center, rgb } = dyno.splitGsplat(g).outputs;

            // Distance from the camera, normalised 0 (near) → 1 (far). Using the
            // splat positions as the map means the front follows the geometry
            // that's actually in front of the viewer (its contour).
            const dist = dyno.distance(center, camPos);
            const normDepth = dyno.clamp(
                dyno.mul(dyno.sub(dist, REVEAL_NEAR), INV_SPAN),
                ZERO,
                ONE,
            );

            // The front sweeps from 0 to (1 + EDGE) so that, by reveal = 1, even
            // the farthest splat (normDepth = 1) is fully past the band.
            const front = dyno.mul(reveal, ONE_PLUS_EDGE);
            const t = dyno.clamp(
                dyno.mul(dyno.sub(front, normDepth), INV_EDGE),
                ZERO,
                ONE,
            );
            const ease = dyno.smoothstep(ZERO, ONE, t);

            // Scale the Gaussian kernel from MIN_SCALE (dot) up to full size.
            const factor = dyno.mix(MIN_SCALE, ONE, ease);
            const newScales = dyno.mul(scales, factor);

            // Leading-edge band: a hump peaking at the front, squared to tighten
            // it into a crisp line.
            const pointiness = dyno.sub(ONE, ease);
            const band = dyno.mul(dyno.mul(pointiness, ease), FOUR);
            const line = dyno.mul(band, band); // sharper peak

            // Colour: high vibrance + a brightness glow while still points, dimmed
            // with depth (near = bright, far = dim) so the cloud reads volumetric
            // on black. Eases back to the baked colour as it resolves.
            const lum = dyno.dot(rgb, LUMA);
            const saturated = dyno.mix(dyno.vec3(lum), rgb, SAT);
            const depthDim = dyno.mix(ONE, DEPTH_DIM, normDepth);
            const glowed = dyno.mul(saturated, dyno.mul(POINT_GLOW, depthDim));
            const tintedRgb = dyno.mix(rgb, glowed, pointiness);
            // Blue edge line, added at the front but killed on bright splats
            // (high luma → the sky/sun) so they get no line or bloom, and faded
            // out over the last ~15% of the reveal.
            const dark = dyno.clamp(dyno.sub(ONE, dyno.mul(lum, SKY_KILL)), ZERO, ONE);
            const glowFade = dyno.sub(ONE, dyno.smoothstep(GLOW_FADE_START, GLOW_FADE_END, reveal));
            const edge = dyno.mul(
                TINT_LINE,
                dyno.mul(dyno.mul(dyno.mul(line, FRONT_GLOW), dark), glowFade),
            );
            const newRgb = dyno.add(tintedRgb, edge);

            return {
                gsplat: dyno.combineGsplat({ gsplat: g, scales: newScales, rgb: newRgb }),
            };
        },
    );

    return { reveal, camPos, modifier };
}
