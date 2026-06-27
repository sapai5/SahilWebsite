"use client";

import { extend } from "@react-three/fiber";
import { SparkRenderer as SparkSparkRenderer } from "@sparkjsdev/spark";

/**
 * React Three Fiber wrapper for Spark's SparkRenderer.
 *
 * `extend(Class)` registers the THREE class with R3F's reconciler and returns a
 * JSX component whose `args` prop maps to the class constructor arguments.
 *
 *   <SparkRenderer args={[{ renderer }]} />
 */
export const SparkRenderer = extend(SparkSparkRenderer);
