import { describe, expect, test } from 'vitest';
import { fitLabel, labelRotation, type Measure } from '../../src/render/labels';

const measure: Measure = (text, px) => text.length * px * 0.6;

describe('labelRotation', () => {
  test('never yields an upside-down label', () => {
    for (let deg = 0; deg < 360; deg++) {
      for (const base of [0, 2 * Math.PI * 7, -2 * Math.PI * 3]) {
        const a = base + (deg * Math.PI) / 180;
        const c = Math.cos(labelRotation(a));
        if (deg === 90 || deg === 270) expect(Math.abs(c)).toBeLessThan(1e-9);
        else expect(c, `${deg}°`).toBeGreaterThan(0);
      }
    }
  });

  test('right half is untouched, left half is flipped by π', () => {
    expect(labelRotation(0.3)).toBe(0.3);
    expect(labelRotation(Math.PI)).toBeCloseTo(2 * Math.PI, 12);
  });
});

describe('fitLabel', () => {
  const sizes = { min: 12, max: 24 };

  test('returns one line at the height-derived size when it fits', () => {
    expect(fitLabel('Mad', measure, { width: 200, height: 40 }, sizes)).toEqual({ lines: ['Mad'], px: 22 });
  });

  test('shrinks to fit the width before wrapping', () => {
    const r = fitLabel('Frustrated', measure, { width: 110, height: 40 }, sizes)!;
    expect(r.lines).toEqual(['Frustrated']);
    expect(measure('Frustrated', r.px)).toBeLessThanOrEqual(110);
    expect(r.px).toBeGreaterThanOrEqual(12);
  });

  test('wraps "Out of Control" to 2 lines in a narrow, tall box', () => {
    const r = fitLabel('Out of Control', measure, { width: 75, height: 60 }, sizes)!;
    expect(r.lines).toEqual(['Out of', 'Control']);
    for (const l of r.lines) expect(measure(l, r.px)).toBeLessThanOrEqual(75);
    expect(2 * 1.15 * r.px).toBeLessThanOrEqual(60);
  });

  test('returns null when it cannot fit at the minimum size', () => {
    expect(fitLabel('Disillusioned', measure, { width: 50, height: 40 }, sizes)).toBeNull();
    expect(fitLabel('Mad', measure, { width: 200, height: 10 }, sizes)).toBeNull();
  });

  test('large text settings: long labels wrap or shrink, never truncated', () => {
    const big = { min: 18, max: 36 }; // root font 24px → sizes scaled by 24/16
    for (const word of ['Out of Control', 'Disillusioned', 'Disrespected', 'Insignificant']) {
      const r = fitLabel(word, measure, { width: 170, height: 72 }, big);
      expect(r, word).not.toBeNull();
      expect(r!.lines.join(' ')).toBe(word);
      for (const l of r!.lines) expect(measure(l, r!.px)).toBeLessThanOrEqual(170);
      expect(r!.px).toBeGreaterThanOrEqual(18);
    }
  });
});
