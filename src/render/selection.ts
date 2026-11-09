/**
 * Sizes of the selection treatments (spec §4.2), in CSS px. The renderer draws with them and the camera frames the
 * opened cell with them, so they live in one place.
 */

/** The selection outline's stroke width; half of it falls outside the cell's edge. */
export const OUTLINE_PX = 4;
/** The gap-colored line just inside the outline. */
export const OUTLINE_INNER_PX = 2;
/** The outline's reach past the cell's edge. */
export const OUTLINE_OUTSIDE_PX = OUTLINE_PX / 2;
/** How far the opened cell is lifted past its ring, inward and outward. */
export const LIFT_RADIAL_PX = 10;
/** How far the opened cell is widened on each side. */
export const LIFT_SIDE_PX = 2;
