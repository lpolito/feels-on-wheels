import { nodeRef } from '../data/node';
import type { FeelingId, NodeRef, Wheel, WheelNode } from '../data/types';

/** Slash-joined node ids from the centre outward, e.g. 'angry/aggressive/hostile' or 'chest/racing-heart/scared'. Unique per position. */
export type Path = string;

export interface Segment {
  index: number;
  path: Path;
  /** What the cell names (spec v2 §7.2). */
  node: NodeRef;
  ring: number;
  /** Wheel-space radians in [0, 2π]; 0 = 3 o'clock, clockwise. */
  start: number;
  end: number;
  mid: number;
  /** -1 for core segments. */
  parent: number;
  children: number[];
  hue: string;
  leafCount: number;
}

export interface Ring {
  index: number;
  inner: number;
  outer: number;
  /** Segment indices ordered by start angle. */
  segments: number[];
  /** starts[k] is the start angle of segments[k]; for binary search. */
  starts: Float64Array;
}

export interface Layout {
  wheelId: string;
  segments: Segment[];
  rings: Ring[];
  byPath: Map<Path, number>;
}

const TAU = Math.PI * 2;

function leaves(n: WheelNode): number {
  return n.children ? n.children.reduce((sum, c) => sum + leaves(c), 0) : 1;
}

/** A feeling's first position on a wheel, and that position's hue (spec v2 §5.1). */
export interface Home { path: Path; hue: string }

/** First position of each feeling in a wheel's depth-first order. Built from the first wheel. */
export function homes(core: Layout): Map<FeelingId, Home> {
  const out = new Map<FeelingId, Home>();
  // Segments are pushed in depth-first order, so the first one seen is the first position.
  for (const s of core.segments) {
    if (s.node.kind === 'feeling' && !out.has(s.node.id)) out.set(s.node.id, { path: s.path, hue: s.hue });
  }
  return out;
}

/** Without `home`, hues inherit from the centre node. With it, feeling nodes take home.get(id).hue (spec v2 §5.1). */
export function buildLayout(wheel: Wheel, home?: Map<FeelingId, Home>): Layout {
  const segments: Segment[] = [];
  const ringMembers: number[][] = wheel.rings.map(() => []);
  const total = wheel.children.reduce((sum, n) => sum + leaves(n), 0);

  const place = (nodes: WheelNode[], ring: number, start: number, parent: number, prefix: string, hue: string): void => {
    let cursor = start;
    for (const node of nodes) {
      const leafCount = leaves(node);
      const width = (leafCount / total) * TAU;
      const index = segments.length;
      const ref = nodeRef(node);
      const path = prefix ? `${prefix}/${ref.id}` : ref.id;
      const own = ref.kind === 'feeling' ? home?.get(ref.id)?.hue : undefined;
      const segHue = node.hue ?? own ?? hue;
      segments.push({
        index, path, node: ref, ring,
        start: cursor, end: cursor + width, mid: cursor + width / 2,
        parent, children: [], hue: segHue, leafCount,
      });
      ringMembers[ring]!.push(index);
      if (parent >= 0) segments[parent]!.children.push(index);
      if (node.children) place(node.children, ring + 1, cursor, index, path, segHue);
      cursor += width;
    }
  };
  place(wheel.children, 0, 0, -1, '', '');

  // Snap each ring's final end to exactly 2π so the rings close without float drift.
  for (const members of ringMembers) {
    const last = members[members.length - 1];
    if (last !== undefined) {
      const s = segments[last]!;
      s.end = TAU;
      s.mid = (s.start + s.end) / 2;
    }
  }

  const rings: Ring[] = wheel.rings.map((spec, index) => {
    const members = ringMembers[index]!;
    return {
      index, inner: spec.inner, outer: spec.outer, segments: members,
      starts: Float64Array.from(members, (i) => segments[i]!.start),
    };
  });

  return { wheelId: wheel.id, segments, rings, byPath: new Map(segments.map((s) => [s.path, s.index])) };
}

/** 1 for segments that stay lit: the selection, its ancestors and its descendants. All 1 when nothing is selected. */
export function litMask(layout: Layout, selected: number | null, out?: Uint8Array): Uint8Array {
  const mask = out ?? new Uint8Array(layout.segments.length);
  if (selected === null) {
    mask.fill(1);
    return mask;
  }
  mask.fill(0);
  for (let i = selected; i >= 0; i = layout.segments[i]!.parent) mask[i] = 1;
  const stack = [...layout.segments[selected]!.children];
  while (stack.length > 0) {
    const i = stack.pop()!;
    mask[i] = 1;
    stack.push(...layout.segments[i]!.children);
  }
  return mask;
}

export function siblings(layout: Layout, i: number): number[] {
  const s = layout.segments[i]!;
  const pool = s.parent >= 0 ? layout.segments[s.parent]!.children : layout.rings[0]!.segments;
  return pool.filter((j) => j !== i);
}

export function ringNeighbor(layout: Layout, i: number, delta: 1 | -1): number {
  const members = layout.rings[layout.segments[i]!.ring]!.segments;
  const k = members.indexOf(i);
  return members[(k + delta + members.length) % members.length]!;
}
