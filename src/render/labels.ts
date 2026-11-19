import { normAngle } from '../model/geometry';

/** Radial label rotation, flipped by π on the left half so text never reads upside down. */
export function labelRotation(screenAngle: number): number {
  const n = normAngle(screenAngle);
  return n > Math.PI / 2 && n < (3 * Math.PI) / 2 ? screenAngle + Math.PI : screenAngle;
}

export type Measure = (text: string, px: number) => number;

const HEIGHT_RATIO = 0.55;
const LINE_HEIGHT = 1.15;
const STEP = 0.5;

/** Largest px ≤ start that makes every line fit `width`, or null if that is below `min`. */
function shrinkToFit(lines: string[], measure: Measure, width: number, start: number, min: number): number | null {
  if (start < min) return null;
  const widest = Math.max(...lines.map((l) => measure(l, start)));
  // Measurement is ~linear in px; estimate, then step down to correct for hinting.
  let px = Math.min(start, Math.floor(((start * width) / widest) / STEP) * STEP);
  while (px >= min && lines.some((l) => measure(l, px) > width)) px -= STEP;
  return px >= min ? px : null;
}

/**
 * One line, shrinking to `wrapAt`; then two lines split at the space nearest the middle, also down to `wrapAt`; never
 * truncates. Below `wrapAt` (known issues, round two: labels never disappear), the larger of one line and two lines,
 * down to `min`. `wrapAt` defaults to `min`.
 */
export function fitLabel(
  text: string, measure: Measure, box: { width: number; height: number },
  size: { min: number; max: number; wrapAt?: number },
): { lines: string[]; px: number } | null {
  const wrapAt = Math.max(size.wrapAt ?? size.min, size.min);
  const ideal = Math.min(size.max, HEIGHT_RATIO * box.height);
  const twoLines = twoLinesOf(text);
  const twoStart = Math.min(ideal, box.height / (2 * LINE_HEIGHT));
  const one = shrinkToFit([text], measure, box.width, ideal, wrapAt);
  if (one !== null) return { lines: [text], px: one };
  const two = twoLines && shrinkToFit(twoLines, measure, box.width, twoStart, wrapAt);
  if (twoLines && two !== null) return { lines: twoLines, px: two };
  if (wrapAt <= size.min) return null;
  const small = shrinkToFit([text], measure, box.width, Math.min(ideal, wrapAt), size.min);
  const smallTwo = twoLines ? shrinkToFit(twoLines, measure, box.width, Math.min(twoStart, wrapAt), size.min) : null;
  if (twoLines && smallTwo !== null && (small === null || smallTwo > small)) return { lines: twoLines, px: smallTwo };
  return small === null ? null : { lines: [text], px: small };
}

/** The two lines a label splits into at the space nearest its middle, or null for one word. */
function twoLinesOf(text: string): string[] | null {
  const spaces = [...text.matchAll(/ /g)].map((m) => m.index);
  if (spaces.length === 0) return null;
  const middle = text.length / 2;
  const split = spaces.reduce((best, i) => (Math.abs(i - middle) < Math.abs(best - middle) ? i : best));
  return [text.slice(0, split), text.slice(split + 1)];
}
