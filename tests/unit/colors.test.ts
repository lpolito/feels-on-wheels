import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { buildFillTable, contrast, mix, shade, type Palette } from '../../src/render/colors';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!]));
}

function palette(vars: Record<string, string>): Palette {
  const hues = Object.fromEntries(Object.entries(vars).filter(([k]) => k.startsWith('hue-')).map(([k, v]) => [k.slice(4), v]));
  return { bg: vars['bg']!, fg: vars['fg']!, gap: vars['gap']!, focus: vars['focus']!, hues };
}

const themes = [
  ['light', palette(block(':root {'))],
  ['dark', palette(block(':root[data-theme="dark"]'))],
] as const;

describe('color math', () => {
  test('contrast of white on black is 21', () => {
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 6);
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 6);
    expect(contrast('#777777', '#777777')).toBeCloseTo(1, 6);
  });

  test('mix interpolates in sRGB', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#ff0000', '#0000ff', 0)).toBe('#ff0000');
  });

  test('shade moves OKLCH lightness and stays a valid hex', () => {
    const lighter = shade('#c62835', 0.12);
    const darker = shade('#c62835', -0.1);
    expect(lighter).toMatch(/^#[0-9a-f]{6}$/);
    expect(contrast(lighter, '#ffffff')).toBeLessThan(contrast('#c62835', '#ffffff'));
    expect(contrast(darker, '#ffffff')).toBeGreaterThan(contrast('#c62835', '#ffffff'));
    expect(shade('#c62835', 0)).toBe('#c62835');
  });
});

describe('palette contrast floors', () => {
  test('tokens.css defines all seven hues in both themes', () => {
    for (const [, p] of themes) {
      expect(Object.keys(p.hues).sort()).toEqual(['angry', 'bad', 'disgusted', 'fearful', 'happy', 'sad', 'surprised']);
    }
  });

  test('for both themes, every hue × ring: lit label ≥ 4.5 and faded label ≥ 3 against its fill', () => {
    for (const [theme, p] of themes) {
      const table = buildFillTable(p, 3, theme);
      for (const hue of Object.keys(p.hues)) {
        for (let ring = 0; ring < 3; ring++) {
          const where = `${theme} ${hue} ring ${ring}`;
          expect(contrast(table.label(hue, ring, true), table.fill(hue, ring, true)), where).toBeGreaterThanOrEqual(4.5);
          expect(contrast(table.label(hue, ring, false), table.fill(hue, ring, false)), where).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  test('moreContrast: faded label contrast ≥ 4.5 for every hue × ring × theme', () => {
    for (const [theme, p] of themes) {
      const table = buildFillTable(p, 3, theme, { moreContrast: true });
      for (const hue of Object.keys(p.hues)) {
        for (let ring = 0; ring < 3; ring++) {
          expect(contrast(table.label(hue, ring, false), table.fill(hue, ring, false)), `${theme} ${hue} ${ring}`)
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  test('fill and label return the same string instance on repeat calls (no per-call allocation)', () => {
    const table = buildFillTable(themes[0][1], 3, 'light');
    expect(table.fill('angry', 1, false)).toBe(table.fill('angry', 1, false));
    expect(table.fill('angry', 0, true)).not.toBe(table.fill('angry', 0, false));
  });
});
