export type FeelingId = string;
export type SensationId = string;
export type AreaId = string;
export type Strength = 'strong' | 'medium' | 'light';

export interface Feeling {
  sensations: SensationId[];
  strength?: Strength;
  emoji?: string;
}
export type FeelingsDict = Record<FeelingId, Feeling>;

/** What a wheel cell names (spec v2 §7.1). */
export type NodeKind = 'feeling' | 'sensation' | 'area';
export interface NodeRef { kind: NodeKind; id: string }

export interface RingSpec { inner: number; outer: number }
/** Exactly one of feeling / sensation / area (checked by validateWheel). */
export interface WheelNode { feeling?: FeelingId; sensation?: SensationId; area?: AreaId; hue?: string; children?: WheelNode[] }
export interface Wheel { id: string; rings: RingSpec[]; children: WheelNode[] }

/** Per-wheel text (spec v2 §4.1). `hint` contains "{link}", where `hintLink` goes. */
export interface WheelText { switch: string; name: string; hint: string; hintLink: string }

export interface Locale {
  meta: { lang: string; dir: 'ltr' | 'rtl' };
  ui: Record<string, string>;
  feelings: Record<FeelingId, { label: string; definition: string }>;
  sensations: Record<SensationId, string>;
  areas: Record<AreaId, string>;
  wheels: Record<string, WheelText>;
}
