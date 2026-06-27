"use client";

import { extend } from "@react-three/fiber";
import { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";

/**
 * React Three Fiber wrapper for Spark's SplatMesh.
 *
 *   <SplatMesh args={[{ url: "/worlds/hero/world.spz", onLoad, onProgress }]} />
 *
 * The `args` prop maps to the SplatMesh constructor options object. Standard
 * Object3D props (position / rotation / quaternion / scale) work as expected.
 */
export const SplatMesh = extend(SparkSplatMesh);
