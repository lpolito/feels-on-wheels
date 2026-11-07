// The test-only hook main.ts exposes in `vite build --mode test`, plus the perf probes.
export {};

declare global {
  interface Window {
    __fw: {
      segmentScreenPoint(path: string): { x: number; y: number };
      state(): { selected: number | null; focused: number | null; view: { mode: string; ring?: number }; interacted: boolean };
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
