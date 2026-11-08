import type { NodeKind, NodeRef, WheelNode } from './types';

export const KINDS: readonly NodeKind[] = ['feeling', 'sensation', 'area'];

/** The node's kind and id. Assumes a validated node (exactly one kind). */
export function nodeRef(n: WheelNode): NodeRef {
  for (const kind of KINDS) {
    const id = n[kind];
    if (typeof id === 'string') return { kind, id };
  }
  throw new Error('wheel node without a kind');
}
