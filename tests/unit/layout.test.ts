import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout, homes, litMask, ringNeighbor, siblings } from '../../src/model/layout';

const { wheel, wheels } = loadData();
const layout = buildLayout(wheel);
const bodyLayout = buildLayout(wheels[1]!, homes(layout));
const bodyHue = (p: string): string => bodyLayout.segments[bodyLayout.byPath.get(p)!]!.hue;
const TAU = Math.PI * 2;
const idx = (path: string): number => {
  const i = layout.byPath.get(path);
  if (i === undefined) throw new Error(`no segment ${path}`);
  return i;
};
const lit = (m: Uint8Array): string[] =>
  layout.segments.filter((s) => m[s.index] === 1).map((s) => s.path).sort();

describe('shadeRing (spec v2.1 §7.1)', () => {
  test('shadeRing: body outer feelings shade as the core ring; feelings wheel cells shade as their own ring', () => {
    for (const s of layout.segments) expect(s.shadeRing, s.path).toBe(s.ring);
    for (const s of bodyLayout.segments) expect(s.shadeRing, s.path).toBe(s.node.kind === 'feeling' ? 0 : s.ring);
    expect(bodyLayout.segments.some((s) => s.node.kind === 'feeling')).toBe(true);
  });
});

describe('buildLayout', () => {
  test('segment angles in each ring tile [0, 2π) with no gaps', () => {
    for (const ring of layout.rings) {
      let prevEnd = 0;
      let total = 0;
      ring.segments.forEach((i, k) => {
        const s = layout.segments[i]!;
        expect(s.start).toBeCloseTo(prevEnd, 9);
        expect(ring.starts[k]).toBe(s.start);
        expect(s.mid).toBeCloseTo((s.start + s.end) / 2, 12);
        total += s.end - s.start;
        prevEnd = s.end;
      });
      expect(total).toBeCloseTo(TAU, 9);
      expect(prevEnd).toBeCloseTo(TAU, 9);
    }
  });

  test('segment width is proportional to leafCount', () => {
    const angry = layout.segments[idx('angry')]!;
    expect(angry.leafCount).toBe(16);
    expect(angry.end - angry.start).toBeCloseTo((16 / 82) * TAU, 12);
    expect(layout.segments.filter((s) => s.ring === 2).every((s) => s.leafCount === 1)).toBe(true);
  });

  test('children lie within the parent angle range', () => {
    for (const s of layout.segments) {
      for (const c of s.children) {
        const child = layout.segments[c]!;
        expect(child.parent).toBe(s.index);
        expect(child.ring).toBe(s.ring + 1);
        expect(child.start).toBeGreaterThanOrEqual(s.start - 1e-12);
        expect(child.end).toBeLessThanOrEqual(s.end + 1e-12);
      }
    }
  });

  test('paths are unique and byPath round-trips', () => {
    expect(layout.segments).toHaveLength(130);
    expect(layout.byPath.size).toBe(130);
    for (const s of layout.segments) expect(layout.byPath.get(s.path)).toBe(s.index);
    expect(layout.segments[idx('angry/aggressive/hostile')]!.node).toEqual({ kind: 'feeling', id: 'hostile' });
    expect(layout.segments[idx('angry/aggressive/hostile')]!.hue).toBe('angry');
    expect(layout.segments[idx('angry')]!.parent).toBe(-1);
    expect(layout.wheelId).toBe('core');
  });

  test('rings carry their radii', () => {
    expect(layout.rings.map((r) => [r.inner, r.outer])).toEqual([[0.12, 0.32], [0.32, 0.62], [0.62, 1]]);
  });
});

describe('litMask', () => {
  test('litMask(selected=aggressive) lights exactly angry, aggressive, provoked, hostile', () => {
    expect(lit(litMask(layout, idx('angry/aggressive')))).toEqual(
      ['angry', 'angry/aggressive', 'angry/aggressive/hostile', 'angry/aggressive/provoked'],
    );
  });

  test('litMask(selected=angry) lights all 25 Angry segments', () => {
    const paths = lit(litMask(layout, idx('angry')));
    expect(paths).toHaveLength(25);
    expect(paths.every((p) => p.startsWith('angry'))).toBe(true);
  });

  test('litMask(selected=hostile) lights only the path', () => {
    expect(lit(litMask(layout, idx('angry/aggressive/hostile')))).toEqual(
      ['angry', 'angry/aggressive', 'angry/aggressive/hostile'],
    );
  });

  test('litMask(null) lights all, and reuses out', () => {
    const out = new Uint8Array(130);
    const m = litMask(layout, null, out);
    expect(m).toBe(out);
    expect(lit(m)).toHaveLength(130);
    litMask(layout, idx('sad'), out);
    expect(lit(out)).toHaveLength(19);
  });
});

describe('neighbors', () => {
  test('ringNeighbor wraps last→first', () => {
    const outer = layout.rings[2]!.segments;
    expect(ringNeighbor(layout, outer[outer.length - 1]!, 1)).toBe(outer[0]);
    expect(ringNeighbor(layout, outer[0]!, -1)).toBe(outer[outer.length - 1]);
    expect(ringNeighbor(layout, idx('angry'), 1)).toBe(idx('disgusted'));
  });

  test('siblings excludes self', () => {
    expect(siblings(layout, idx('angry/aggressive/hostile'))).toEqual([idx('angry/aggressive/provoked')]);
    expect(siblings(layout, idx('angry'))).toHaveLength(6);
  });
});

describe('nodes, homes and the hue rule (v2 §5.1)', () => {
  test("core wheel: every feeling has its home's hue, except the second places of repeated feelings", () => {
    const h = homes(layout);
    const second = new Set(['bad/stressed/overwhelmed', 'sad/depressed/inferior', 'sad/hurt/embarrassed', 'sad/hurt/disappointed']);
    for (const s of layout.segments) {
      if (second.has(s.path)) expect(s.hue, s.path).not.toBe(h.get(s.node.id)!.hue);
      else expect(s.hue, s.path).toBe(h.get(s.node.id)!.hue);
    }
  });

  test('body wheel: areas and sensations take the area hue, feelings their core hue', () => {
    expect(bodyHue('chest')).toBe('chest');
    expect(bodyHue('chest/racing-heart')).toBe('chest');
    expect(bodyHue('chest/racing-heart/scared')).toBe('fearful');
    expect(bodyHue('chest/racing-heart/mad')).toBe('angry');
    expect(bodyHue('chest/racing-heart/excited')).toBe('surprised');
  });

  test('homes uses the first position for repeated feelings', () => {
    const h = homes(layout);
    expect(h.get('overwhelmed')).toEqual({ path: 'fearful/anxious/overwhelmed', hue: 'fearful' });
    expect(h.get('inferior')).toEqual({ path: 'fearful/insecure/inferior', hue: 'fearful' });
    expect(h.get('embarrassed')).toEqual({ path: 'disgusted/disapproving/embarrassed', hue: 'disgusted' });
    expect(h.get('disappointed')).toEqual({ path: 'disgusted/disappointed', hue: 'disgusted' });
    expect(h.get('scared')).toEqual({ path: 'fearful/scared', hue: 'fearful' });
  });

  test('body paths join node ids', () => {
    const i = bodyLayout.byPath.get('chest/racing-heart/scared');
    expect(i).toBeDefined();
    expect(bodyLayout.segments[i!]!.node).toEqual({ kind: 'feeling', id: 'scared' });
    expect(bodyLayout.segments[bodyLayout.byPath.get('chest')!]!.node).toEqual({ kind: 'area', id: 'chest' });
    expect(bodyLayout.segments[bodyLayout.byPath.get('chest/racing-heart')!]!.node).toEqual({ kind: 'sensation', id: 'racing-heart' });
    expect(bodyLayout.wheelId).toBe('body');
  });
});
