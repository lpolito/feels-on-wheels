// The test-only hook main.ts exposes in `vite build --mode test`, plus the perf probes.
export {};

interface FwState { selected: number | null; opened: boolean; view: { mode: string; ring?: number }; hinted: boolean }

declare global {
  interface Window {
    __fw: {
      segmentScreenPoint(path: string): { x: number; y: number };
      state(): FwState;
      camera(): { scale: number; rotation: number; cx: number; cy: number };
      moving(): boolean;
      pathOf(i: number | null): string | null;
      offCenter(path: string): number;
      drawTimes(): number[];
    };
    __rafCount: number;
    __probe: number[];
    gc?: () => void;
  }
}
