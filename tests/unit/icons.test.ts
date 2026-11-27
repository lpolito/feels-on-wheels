import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { appIconSvg, iconWedges, siteIconCss, siteIconSvg } from '../../scripts/icon-wedges';

const { wheel, locale } = loadData();
const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const css = read('src/styles/tokens.css');
/** The `--hue-<name>` values in the first block after `selector`. */
function hues(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--hue-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!.toLowerCase()]));
}

describe('icons drawn from the wheel (opinionated wheel spec §4)', () => {
  const wedges = iconWedges(wheel);

  test('one wedge per core, in wheel order, from 12 o\'clock clockwise, sized by outer words', () => {
    expect(wedges.map((w) => w.hue)).toEqual(['happy', 'angry', 'love', 'sad', 'bad', 'scared']);
    expect(wedges[0]!.start).toBe(0);
    expect(wedges.at(-1)!.end).toBeCloseTo(360, 9);
    wedges.slice(1).forEach((w, i) => expect(w.start).toBeCloseTo(wedges[i]!.end, 9));
    expect(wedges[0]!.end - wedges[0]!.start).toBeCloseTo((360 * 30) / 111, 6);
  });

  test('public/icons/icon.svg is the app icon drawn in the light theme\'s colors', () => {
    const svg = read('public/icons/icon.svg');
    expect(svg).toBe(appIconSvg(wedges, hues(':root {')));
    expect(svg.match(/<path /g)).toHaveLength(6);
    expect(svg.match(/<line /g)).toHaveLength(6);
    expect([...svg.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]!.toLowerCase()))
      .toEqual(wedges.map((w) => hues(':root {')[w.hue]));
  });

  test('the lucaspolito.dev silhouette has six spokes at the wedges\' edges', () => {
    const svg = read('docs/website-icon/feels-on-wheels.svg');
    expect(svg).toBe(siteIconSvg(wedges));
    expect(svg.match(/<line /g)).toHaveLength(6);
  });

  test('the lucaspolito.dev CSS colors the wedges in the dark theme\'s colors', () => {
    const file = read('docs/website-icon/feels-on-wheels.css');
    const dark = hues(':root[data-theme="dark"]');
    expect(file).toBe(siteIconCss(wedges, dark, Object.fromEntries(wedges.map((w) => [w.id, locale.feelings[w.id]!.label]))));
    const stops = [...file.matchAll(/(#[0-9a-f]{6}) ([\d.]+)deg ([\d.]+)deg/g)].map((m) => [m[1], Number(m[2]), Number(m[3])]);
    expect(stops).toEqual(wedges.map((w) => [dark[w.hue], Number(w.start.toFixed(1)), Number(w.end.toFixed(1))]));
  });
});
