import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { buildFillTable, contrast, fitWhite, inkFor, mix, shade, type Palette } from '../../src/render/colors';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!]));
}

function palette(vars: Record<string, string>): Palette {
  const hues = Object.fromEntries(Object.entries(vars).filter(([k]) => k.startsWith('hue-')).map(([k, v]) => [k.slice(4), v]));
  return { bg: vars['bg']!, fg: vars['fg']!, gap: vars['gap']!, focus: vars['focus']!, outline: vars['outline']!, surface: vars['surface']!, hues };
}

const themes = [
  ['light', palette(block(':root {'))],
  ['dark', palette(block(':root[data-theme="dark"]'))],
] as const;

const FEELING_HUES = ['angry', 'bad', 'disgusted', 'fearful', 'happy', 'sad', 'surprised'];
const AREA_HUES = ['head', 'face', 'chest', 'breath', 'stomach', 'arms', 'whole-body', 'posture'];

type Lab = [number, number, number];
/** sRGB hex → OKLab (Björn Ottosson's matrices, as in colors.ts shade()). */
function oklab(hex: string): Lab {
  const n = Number.parseInt(hex.slice(1), 16);
  const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(lin) as Lab;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const q = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q,
  ];
}
const dist = (a: Lab, b: Lab): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('color math', () => {
  test('contrast of white on black is 21', () => {
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 6);
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 6);
    expect(contrast('#777777', '#777777')).toBeCloseTo(1, 6);
  });

  test('accepts the 3-digit hex the CSS minifier emits', () => {
    expect(mix('#fff', '#000', 0.5)).toBe('#808080');
    expect(contrast('#fff', '#000')).toBeCloseTo(21, 6);
    expect(shade('#FFF', 0)).toBe('#ffffff');
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
  test('tokens.css defines the seven feeling hues and eight area hues in both themes', () => {
    const all = [...FEELING_HUES, ...AREA_HUES].sort();
    for (const [, p] of themes) expect(Object.keys(p.hues).sort()).toEqual(all);
    // The system-dark block matches the manual dark block.
    const sysDark = palette(block(':root:not([data-theme="light"]) {'));
    expect(sysDark.hues).toEqual(themes[1][1].hues);
  });

  test('area hues are distinct: ≥ 0.055 OKLab from every other hue, after fitting for white labels', () => {
    for (const [theme, p] of themes) {
      const fitted = Object.fromEntries(Object.entries(p.hues).map(([h, v]) => [h, oklab(fitWhite(v))]));
      for (const area of AREA_HUES) {
        for (const other of Object.keys(fitted)) {
          if (other === area) continue;
          expect(dist(fitted[area]!, fitted[other]!), `${theme} ${area} vs ${other}`).toBeGreaterThanOrEqual(0.055);
        }
      }
    }
  });

  test('every area core-ring fill is ≥ 0.055 OKLab from every feeling fill at every ring (spec v2.1 §7.2)', () => {
    for (const [theme, p] of themes) {
      for (const area of AREA_HUES) {
        const a = oklab(shade(fitWhite(p.hues[area]!), -0.07));
        for (const f of FEELING_HUES) {
          for (const dL of [-0.07, -0.035, 0]) {
            expect(dist(a, oklab(shade(fitWhite(p.hues[f]!), dL))), `${theme} ${area} vs ${f} ${dL}`).toBeGreaterThanOrEqual(0.055);
          }
        }
      }
    }
  });

  test('area tokens are the v2 values at 1.2x chroma (spec v2.1 §7.2)', () => {
    const [, light] = themes[0]!;
    const [, dark] = themes[1]!;
    expect(light.hues['head']!.toLowerCase()).toBe('#821538');
    expect(dark.hues['head']!.toLowerCase()).toBe('#b0435e');
    expect(light.hues['stomach']!.toLowerCase()).toBe('#0179a3');
    expect(dark.hues['whole-body']!.toLowerCase()).toBe('#b05ba6');
  });

  test('for both themes, every hue × ring: lit label is white at ≥ 4.5, faded label ≥ 3', () => {
    for (const [theme, p] of themes) {
      const table = buildFillTable(p, 3, theme);
      for (const hue of Object.keys(p.hues)) {
        for (let ring = 0; ring < 3; ring++) {
          const where = `${theme} ${hue} ring ${ring}`;
          expect(table.label(hue, ring, true), where).toBe('#ffffff');
          expect(contrast(table.label(hue, ring, true), table.fill(hue, ring, true)), where).toBeGreaterThanOrEqual(4.5);
          expect(contrast(table.label(hue, ring, false), table.fill(hue, ring, false)), where).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  test('moreContrast: faded label is white at ≥ 4.5 for every hue × ring × theme', () => {
    for (const [theme, p] of themes) {
      const table = buildFillTable(p, 3, theme, { moreContrast: true });
      for (const hue of Object.keys(p.hues)) {
        for (let ring = 0; ring < 3; ring++) {
          const where = `${theme} ${hue} ${ring}`;
          expect(table.label(hue, ring, false), where).toBe('#ffffff');
          expect(contrast(table.label(hue, ring, false), table.fill(hue, ring, false)), where).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  test('fitWhite darkens happy orange just enough for 4.8:1', () => {
    const c = contrast('#ffffff', fitWhite('#D9730D'));
    expect(c).toBeGreaterThanOrEqual(4.8);
    expect(c).toBeLessThan(5.2);
  });

  test('ring 0 fill is darker than ring 2 fill', () => {
    for (const [theme, p] of themes) {
      const table = buildFillTable(p, 3, theme);
      for (const hue of Object.keys(p.hues)) {
        expect(contrast('#ffffff', table.fill(hue, 0, true)), `${theme} ${hue}`)
          .toBeGreaterThan(contrast('#ffffff', table.fill(hue, 2, true)));
      }
    }
  });

  test("forced palette: fill 'Canvas', label 'CanvasText'/'GrayText'", () => {
    const forced: Palette = { bg: 'Canvas', fg: 'CanvasText', gap: 'CanvasText', focus: 'Highlight', outline: 'Highlight', surface: 'Canvas', forced: true, hues: { angry: 'Canvas' } };
    const table = buildFillTable(forced, 3, 'light');
    expect(table.fill('angry', 1, true)).toBe('Canvas');
    expect(table.label('angry', 1, true)).toBe('CanvasText');
    expect(table.label('angry', 1, false)).toBe('GrayText');
  });

  test('fill and label return the same string instance on repeat calls (no per-call allocation)', () => {
    const table = buildFillTable(themes[0][1], 3, 'light');
    expect(table.fill('angry', 1, false)).toBe(table.fill('angry', 1, false));
    expect(table.fill('angry', 0, true)).not.toBe(table.fill('angry', 0, false));
  });
});

describe('card ink', () => {
  test('inkFor reaches ≥ 4.5:1 on --surface for every hue in both themes', () => {
    for (const [theme, p] of themes) {
      expect(p.surface, theme).toMatch(/^#[0-9a-f]{6}$/i);
      for (const [hue, base] of Object.entries(p.hues)) {
        const ink = inkFor(base, theme, p.surface);
        expect(contrast(ink, p.surface), `${theme} ${hue}`).toBeGreaterThanOrEqual(4.5);
        // Still on a hovered row's faint tint of itself.
        expect(contrast(ink, mix(p.surface, ink, 0.08)), `${theme} ${hue} row`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test('inkFor darkens in light and lightens in dark, and keeps a base that already passes', () => {
    const surface = '#f6f5f8';
    const light = inkFor('#e8933a', 'light', surface);
    expect(contrast(light, '#000000')).toBeLessThan(contrast('#e8933a', '#000000'));
    const dark = inkFor('#3b3470', 'dark', '#1e1c22');
    expect(contrast(dark, '#ffffff')).toBeLessThan(contrast('#3b3470', '#ffffff'));
    expect(inkFor('#1c1b1f', 'light', surface)).toBe('#1c1b1f');
  });
});
