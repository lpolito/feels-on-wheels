export type FeelingId = string;
export type SensationId = string;
export type Strength = 'strong' | 'medium' | 'light';

export interface Feeling {
  sensations: SensationId[];
  strength?: Strength;
  emoji?: string;
}
export type FeelingsDict = Record<FeelingId, Feeling>;

export interface RingSpec { inner: number; outer: number }
export interface WheelNode { feeling: FeelingId; hue?: string; children?: WheelNode[] }
export interface Wheel { id: string; rings: RingSpec[]; children: WheelNode[] }

export interface Locale {
  meta: { lang: string; dir: 'ltr' | 'rtl' };
  ui: Record<string, string>;
  feelings: Record<FeelingId, { label: string; definition: string }>;
  sensations: Record<SensationId, string>;
}
