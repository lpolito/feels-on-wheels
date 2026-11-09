// The test-only hook main.ts exposes in `vite build --mode test`, plus the perf probes.
export {};

interface FwState { selected: number | null; opened: boolean; view: { mode: string; ring?: number } }

declare global {
  interface Window {
    __fw: {
      segmentScreenPoint(path: string): { x: number; y: number };
      state(): FwState;
      camera(): { scale: number; rotation: number; cx: number; cy: number };
      viewport(): { width: number; height: number; radius: number };
      moving(): boolean;
      pathOf(i: number | null): string | null;
      offCenter(path: string): number;
      drawTimes(): number[];
      /** v2: the current wheel's id. */
      wheel(): string;
      /** v2 leak probe: layouts and stores still alive (WeakRefs). */
      liveWheels(): number;
      /** v2.1: labels drawn per ring in the last frame. */
      labelsByRing(): number[];
    };
    __rafCount: number;
    __probe: number[];
    gc?: () => void;
  }
}
