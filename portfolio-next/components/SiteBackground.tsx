"use client";

import DepthField from "./DepthField";

/** Persistent glass backdrop shared across all routes:
 *  blurred Marble world panorama + parallax depth orbs the glass refracts. */
export default function SiteBackground() {
  return (
    <>
      <div className="lg-worldbg" aria-hidden="true" />
      <DepthField />
    </>
  );
}
