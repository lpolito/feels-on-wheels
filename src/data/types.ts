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

/** Per-wheel text (spec v2 §4.1). `hintTitle` heads the message (spec v2.2 §5); `hint` contains "{link}", where `hintLink` goes. */
export interface WheelText { switch: string; name: string; hintTitle: string; hint: string; hintLink: string; /** Spoken name when `switch` is short, e.g. one emoji (spec v2.1 §4.2). */ switchName?: string }

/** Page titles and meta descriptions (spec 2026-11-13 §6). `route` and the two cell descriptions have `{name}`, `{sensation}`, `{area}`. */
export interface Titles {
  home: string; homeDescription: string; about: string; aboutDescription: string;
  route: string; notFound: string; sensationDescription: string; areaDescription: string;
  /** Every wheel but the first. */
  wheelDescriptions: Record<string, string>;
}

export interface Locale {
  meta: { lang: string; dir: 'ltr' | 'rtl' };
  ui: Record<string, string>;
  /**
   * Core feelings also have `kind`, the sentence naming a feeling as theirs with "{link}" where `kindLink` goes ("A
   * {link} feeling.", "happy"): spec v2.2 §4.4.
   */
  feelings: Record<FeelingId, { label: string; definition: string; kind?: string; kindLink?: string }>;
  sensations: Record<SensationId, string>;
  areas: Record<AreaId, string>;
  wheels: Record<string, WheelText>;
  titles: Titles;
}
