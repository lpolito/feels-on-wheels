/**
 * EXPLORATION ONLY (WebGL prototype, not production code). A WebGL2 drop-in for createWheelRenderer: cell geometry
 * is uploaded once per wheel in polar coordinates and placed by the camera in the vertex shader; labels come from an
 * R8 texture atlas filled by a CPU 2D canvas, drawn as instanced quads also placed on the GPU. Per frame the CPU only
 * re-fits visible labels (as the 2D renderer does), writes a small instance buffer and a per-cell color texture.
 *
 * Label sizes while zooming, chosen by `globalThis.__glLabels`:
 *  - 'rerender': every label at its exact size (rounded to 0.5 px), as the 2D sprite cache does;
 *  - 'scale': each label rendered once at the size first seen, then scaled (re-rendered only past 2× / 0.5×);
 *  - 'hybrid' (default): scale while a label's size is changing (re-render past 1.5×, at most BUDGET per frame),
 *    and re-render at the exact size once it holds still for a frame.
 */
import { wheelCellLabel } from '../i18n';
import type { Layout } from '../model/layout';
import { inWindow, TAU, viewWindow, type ViewWindow } from '../model/geometry';
import type { FillTable, Palette } from './colors';
import { fitLabel, type Measure } from './labels';
import { LIFT_RADIAL_PX, LIFT_SIDE_PX, OUTLINE_INNER_PX, OUTLINE_PX } from './selection';
import type { Frame, WheelRenderer } from './wheel';

const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const fontOf = (px: number, bold: boolean): string => `${bold ? 800 : 600} ${px}px ${FONT_STACK}`;
const LABEL_PAD = 6;
const MEASURE_PX = 100;
const TRACK_REF = 'Hamburgefonstiv';
const LINE_HEIGHT = 1.15;
const GAP_PX = 1.5;
const GAP_PX_MORE = 2.5;
const LIFT_LABEL = 1.15;
const FOCUS_RING_PX = 3;
const FOCUS_GAP_PX = 2;
const PULSE_FROM = 0.96;
const FIT_TOLERANCE = 1;
const ARC_STEP = 0.01;
const ATLAS = 4096;
const SPRITE_PAD = 2;
const SPRITE_HEIGHT = 1.4;
const STEP = 0.5;
const BUDGET = 12;

const easeOut = (t: number): number => 1 - (1 - t) ** 3;

const CELL_VS = `#version 300 es
precision highp float;
in vec2 a_polar; in vec2 a_side; in float a_seg;
uniform vec2 u_res; uniform vec2 u_center; uniform float u_R; uniform float u_rot; uniform float u_inset;
uniform sampler2D u_colors; uniform int u_solid; uniform vec4 u_solidColor;
out vec4 v_color;
void main() {
  float a = a_polar.y + u_rot;
  vec2 dir = vec2(cos(a), sin(a));
  vec2 perp = vec2(-dir.y, dir.x);
  float r = max(a_polar.x * u_R + a_side.x * u_inset, 0.0);
  vec2 p = u_center + r * dir + a_side.y * u_inset * perp;
  vec2 clip = p / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_color = u_solid == 1 ? u_solidColor : texelFetch(u_colors, ivec2(int(a_seg + 0.5), 0), 0);
}`;
const COLOR_FS = `#version 300 es
precision mediump float;
in vec4 v_color; out vec4 o;
void main() { o = v_color; }`;

const LABEL_VS = `#version 300 es
precision highp float;
in vec2 a_corner; in vec4 a_inst; in vec4 a_uv; in vec4 a_color;
uniform vec2 u_res; uniform vec2 u_center; uniform float u_R; uniform float u_rot;
out vec2 v_uv; out vec4 v_color;
void main() {
  float a = a_inst.y + u_rot;
  float n = mod(a, 6.28318530718);
  float rot = (n > 1.57079632679 && n < 4.71238898038) ? a + 3.14159265359 : a;
  vec2 c = u_center + a_inst.x * u_R * vec2(cos(a), sin(a));
  vec2 l = a_corner * a_inst.zw;
  vec2 p = c + vec2(l.x * cos(rot) - l.y * sin(rot), l.x * sin(rot) + l.y * cos(rot));
  vec2 clip = p / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_uv = mix(a_uv.xy, a_uv.zw, a_corner + 0.5);
  v_color = a_color;
}`;
const LABEL_FS = `#version 300 es
precision mediump float;
uniform sampler2D u_atlas;
in vec2 v_uv; in vec4 v_color; out vec4 o;
void main() { float c = texture(u_atlas, v_uv).r * v_color.a; o = vec4(v_color.rgb * c, c); }`;

/** Selection effects drawn analytically per pixel on a scissored full-screen triangle: sector fill, shadow, outline, focus ring. */
const FX_VS = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;
const FX_FS = `#version 300 es
precision highp float;
uniform vec2 u_c; uniform float u_r0; uniform float u_r1; uniform float u_a0; uniform float u_a1;
uniform int u_mode; uniform vec4 u_col; uniform vec4 u_col2; uniform float u_dpr; uniform float u_hdev;
uniform vec2 u_pc; uniform float u_pulse;
out vec4 o;
const float PI = 3.14159265359;
float sdSector(vec2 p) {
  vec2 d = p - u_c; float r = length(d); float ang = atan(d.y, d.x);
  float mid = (u_a0 + u_a1) * 0.5; float half_ = (u_a1 - u_a0) * 0.5;
  float da = mod(ang - mid + PI, 2.0 * PI) - PI;
  float dr = max(u_r0 - r, r - u_r1);
  float dA = r * sin(clamp(abs(da) - half_, -PI * 0.5, PI * 0.5));
  return max(dr, dA);
}
float band(float x, float lo, float hi) { return clamp((x - lo) * u_dpr + 0.5, 0.0, 1.0) * clamp((hi - x) * u_dpr + 0.5, 0.0, 1.0); }
void main() {
  vec2 frag = vec2(gl_FragCoord.x, u_hdev - gl_FragCoord.y) / u_dpr;
  vec2 p = u_pc + (frag - u_pc) / u_pulse;
  if (u_mode == 3) {
    float a = band(length(p - u_c), u_r0 - u_r1 * 0.5, u_r0 + u_r1 * 0.5);
    o = vec4(u_col.rgb * a, a); return;
  }
  if (u_mode == 1) {
    float sd = sdSector(p - vec2(0.0, ${3}.0));
    float a = 0.35 * (1.0 - smoothstep(-12.0, 12.0, sd));
    o = vec4(0.0, 0.0, 0.0, a); return;
  }
  float sd = sdSector(p);
  if (u_mode == 0) { float a = clamp(0.5 - sd * u_dpr, 0.0, 1.0); o = vec4(u_col.rgb * a, a); return; }
  float ink = band(sd, -${OUTLINE_PX / 2}.0, ${OUTLINE_PX / 2}.0);
  float gap = band(sd, -${OUTLINE_PX / 2 + OUTLINE_INNER_PX}.0, -${OUTLINE_PX / 2}.0);
  o = vec4(u_col.rgb * ink + u_col2.rgb * gap, ink + gap);
}`;

interface Entry { key: string; u0: number; v0: number; u1: number; v1: number; w: number; h: number; q: number }
interface LabelCache { w: number; h: number; min: number; max: number; wrapAt: number; result: { lines: string[]; px: number } | null }
type RGBA = [number, number, number, number];

interface Shared {
  gl: WebGL2RenderingContext;
  cellProg: WebGLProgram; labelProg: WebGLProgram; fxProg: WebGLProgram;
  atlas: WebGLTexture; colors: WebGLTexture;
  quad: WebGLBuffer; fxTri: WebGLBuffer; inst: WebGLBuffer;
  dispose: (() => void) | null;
}
const shared = new WeakMap<HTMLCanvasElement, Shared>();

function program(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
  return p;
}

function setup(canvas: HTMLCanvasElement): Shared | null {
  const have = shared.get(canvas);
  if (have) return have;
  const dbg = globalThis as { __glAA?: boolean; __glSkip?: string };
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: dbg.__glAA ?? import.meta.env.VITE_GL_AA !== '0', premultipliedAlpha: true, depth: false, stencil: false });
  if (!gl) return null;
  const atlas = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, atlas);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, ATLAS, ATLAS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const colors = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, colors);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const quad = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
  const fxTri = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, fxTri);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const s: Shared = {
    gl, atlas, colors, quad, fxTri, inst: gl.createBuffer()!, dispose: null,
    cellProg: program(gl, CELL_VS, COLOR_FS), labelProg: program(gl, LABEL_VS, LABEL_FS), fxProg: program(gl, FX_VS, FX_FS),
  };
  shared.set(canvas, s);
  return s;
}

/** Atlas entries, shared by every wheel on the canvas. Shelf-packed; cleared whole when full. */
interface Atlas { entries: Map<string, Entry>; shelves: { y: number; h: number; x: number }[]; nextY: number; dpr: number; resets: number; generation: number }
const atlases = new WeakMap<HTMLCanvasElement, Atlas>();

/** Null when WebGL2 isn't available: the caller falls back to the 2D renderer. */
export function createGlWheelRenderer(canvas: HTMLCanvasElement, layout: Layout): WheelRenderer | null {
  const sh = setup(canvas);
  if (!sh) return null;
  sh.dispose?.();
  const { gl } = sh;
  const count = (n: number): void => { (globalThis as unknown as Record<string, number>).__glCalls = ((globalThis as unknown as Record<string, number>).__glCalls ?? 0) + n; };
  const count_ = count;
  const mode = ((globalThis as { __glLabels?: string }).__glLabels ?? import.meta.env.VITE_GL_LABELS ?? 'hybrid') as 'hybrid' | 'scale' | 'rerender';
  let atlas = atlases.get(canvas);
  if (!atlas) {
    atlas = { entries: new Map(), shelves: [], nextY: 0, dpr: 1, resets: 0, generation: 0 };
    atlases.set(canvas, atlas);
  }
  const A = atlas;

  // ── Static cell geometry: per vertex (r, θ) in wheel space, (radial, angular) inset signs, segment index.
  const verts: number[] = [];
  const idx: number[] = [];
  for (const s of layout.segments) {
    const ring = layout.rings[s.ring]!;
    const steps = Math.max(2, Math.ceil((s.end - s.start) / ARC_STEP));
    const base = verts.length / 5;
    for (let k = 0; k <= steps; k++) {
      const th = s.start + ((s.end - s.start) * k) / steps;
      const side = k === 0 ? 1 : k === steps ? -1 : 0;
      verts.push(ring.inner, th, 1, side, s.index, ring.outer, th, -1, side, s.index);
      if (k > 0) {
        const a = base + 2 * (k - 1);
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
  }
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  const ibo = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  const big = verts.length / 5 > 65535;
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, big ? new Uint32Array(idx) : new Uint16Array(idx), gl.STATIC_DRAW);
  const cp = sh.cellProg;
  const attr = (p: WebGLProgram, name: string, size: number, stride: number, off: number, divisor = 0): void => {
    const loc = gl.getAttribLocation(p, name);
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off);
    gl.vertexAttribDivisor(loc, divisor);
  };
  attr(cp, 'a_polar', 2, 20, 0);
  attr(cp, 'a_side', 2, 20, 8);
  attr(cp, 'a_seg', 1, 20, 16);
  const indexCount = idx.length;

  // Labels: one VAO over the shared quad and instance buffers.
  const INST = 12;
  const lvao = gl.createVertexArray()!;
  gl.bindVertexArray(lvao);
  gl.bindBuffer(gl.ARRAY_BUFFER, sh.quad);
  attr(sh.labelProg, 'a_corner', 2, 8, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, sh.inst);
  attr(sh.labelProg, 'a_inst', 4, INST * 4, 0, 1);
  attr(sh.labelProg, 'a_uv', 4, INST * 4, 16, 1);
  attr(sh.labelProg, 'a_color', 4, INST * 4, 32, 1);
  const fvao = gl.createVertexArray()!;
  gl.bindVertexArray(fvao);
  gl.bindBuffer(gl.ARRAY_BUFFER, sh.fxTri);
  attr(sh.fxProg, 'a_pos', 2, 8, 0);
  gl.bindVertexArray(null);
  sh.dispose = () => {
    gl.deleteBuffer(vbo); gl.deleteBuffer(ibo);
    gl.deleteVertexArray(vao); gl.deleteVertexArray(lvao); gl.deleteVertexArray(fvao);
  };

  const uni = new Map<string, WebGLUniformLocation | null>();
  const u = (p: WebGLProgram, name: string): WebGLUniformLocation | null => {
    const key = `${name}|${p === sh.cellProg ? 0 : p === sh.labelProg ? 1 : 2}`;
    if (!uni.has(key)) uni.set(key, gl.getUniformLocation(p, name));
    return uni.get(key)!;
  };

  // ── Colors: any CSS color (system colors included) resolved through a 1×1 canvas.
  const probe = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true })!;
  const rgbaCache = new Map<string, RGBA>();
  const rgba = (css: string): RGBA => {
    let c = rgbaCache.get(css);
    if (!c) {
      if (/^#[0-9a-f]{6}$/i.test(css)) {
        const n = Number.parseInt(css.slice(1), 16);
        c = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
      } else {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = css;
        probe.fillRect(0, 0, 1, 1);
        const d = probe.getImageData(0, 0, 1, 1).data;
        c = [d[0]!, d[1]!, d[2]!, d[3]!];
      }
      rgbaCache.set(css, c);
    }
    return c;
  };
  const N = layout.segments.length;
  const colorData = new Uint8Array(N * 4 * 2);
  const colorPrev = new Uint8Array(N * 4 * 2);
  let colorsSized = -1;

  // ── Label fitting, as the 2D renderer does (measurement on a 2D context of its own).
  const mctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d')!;
  const texts = layout.segments.map((s) => wheelCellLabel(s.node));
  const labelCache: (LabelCache | null)[] = layout.segments.map(() => null);
  const widthAt100 = [new Map<string, number>(), new Map<string, number>()];
  const trackAt = [new Map<number, number>(), new Map<number, number>()];
  const at100 = (text: string, bold: boolean): number => {
    const cache = widthAt100[bold ? 1 : 0]!;
    let w = cache.get(text);
    if (w === undefined) {
      mctx.font = fontOf(MEASURE_PX, bold);
      w = mctx.measureText(text).width;
      cache.set(text, w);
    }
    return w;
  };
  const track = (px: number, bold: boolean): number => {
    const size = Math.round(px * 4) / 4;
    const cache = trackAt[bold ? 1 : 0]!;
    let t = cache.get(size);
    if (t === undefined) {
      mctx.font = fontOf(size, bold);
      t = (mctx.measureText(TRACK_REF).width - (at100(TRACK_REF, bold) * size) / MEASURE_PX) / TRACK_REF.length;
      cache.set(size, t);
    }
    return t;
  };
  const measure: Measure = (text, px) => (at100(text, false) * px) / MEASURE_PX + text.length * track(px, false);
  const boldAt = new Map<string, number>();
  const measureBold: Measure = (text, px) => {
    const key = `${px}|${text}`;
    let w = boldAt.get(key);
    if (w === undefined) {
      if (boldAt.size >= 4000) boldAt.clear();
      mctx.font = fontOf(px, true);
      w = mctx.measureText(text).width;
      boldAt.set(key, w);
    }
    return w;
  };
  const stats = {
    segmentsDrawn: 0, labelsDrawn: 0, labelFits: 0, labelsByRing: layout.rings.map(() => 0), focusRing: false, focusOutline: false,
    uploads: 0, atlasResets: 0, uploadsTotal: 0,
  };
  function fitted(i: number, w: number, h: number, min: number, max: number, wrapAt: number): LabelCache['result'] {
    const c = labelCache[i];
    if (c && Math.abs(c.w - w) <= FIT_TOLERANCE && Math.abs(c.h - h) <= FIT_TOLERANCE && c.min === min && c.max === max && c.wrapAt === wrapAt) return c.result;
    stats.labelFits++;
    const result = fitLabel(texts[i]!, measure, { width: w, height: h }, { min, max, wrapAt });
    labelCache[i] = { w, h, min, max, wrapAt, result };
    return result;
  }
  let openedFit: (LabelCache & { i: number }) | null = null;
  function openedLabel(i: number, w: number, h: number, fit: { lines: string[]; px: number }): { lines: string[]; px: number } {
    const min = fit.px;
    const max = fit.px * LIFT_LABEL;
    const c = openedFit;
    if (c && c.i === i && Math.abs(c.w - w) <= FIT_TOLERANCE && Math.abs(c.h - h) <= FIT_TOLERANCE && c.min === min && c.max === max) return c.result ?? fit;
    const result = fitLabel(texts[i]!, measureBold, { width: w, height: h }, { min, max });
    openedFit = { i, w, h, min, max, wrapAt: min, result };
    return result ?? fit;
  }

  // ── Atlas rendering: text drawn white on black in a CPU canvas, its red channel uploaded into the R8 atlas.
  const stage = Object.assign(document.createElement('canvas'), { width: 1024, height: 256 }).getContext('2d', { willReadFrequently: true })!;
  let red = new Uint8Array(1024 * 256);
  function resetAtlas(): void {
    A.entries.clear();
    A.shelves.length = 0;
    A.nextY = 0;
    A.resets++;
    A.generation++;
    stats.atlasResets++;
  }
  function alloc(w: number, h: number): { x: number; y: number } | null {
    const gw = w + 1;
    const gh = h + 1;
    for (const s of A.shelves) {
      if (s.h >= gh && s.h <= gh * 1.3 + 4 && s.x + gw <= ATLAS) {
        const at = { x: s.x, y: s.y };
        s.x += gw;
        return at;
      }
    }
    const sh_ = Math.ceil(gh / 8) * 8;
    if (A.nextY + sh_ > ATLAS || gw > ATLAS) return null;
    const s = { y: A.nextY, h: sh_, x: gw };
    A.shelves.push(s);
    A.nextY += sh_;
    return { x: 0, y: s.y };
  }
  /** Renders and uploads one label block; null when the atlas is full. */
  function render(key: string, lines: string[], q: number, bold: boolean): Entry | null {
    const dpr = A.dpr;
    stage.font = fontOf(q, bold);
    const widest = Math.max(...lines.map((l) => stage.measureText(l).width));
    const lineGap = q * LINE_HEIGHT;
    const wCss = widest + 2 * SPRITE_PAD;
    const hCss = (lines.length - 1) * lineGap + q * SPRITE_HEIGHT + 2 * SPRITE_PAD;
    const W = Math.max(1, Math.ceil(wCss * dpr));
    const H = Math.max(1, Math.ceil(hCss * dpr));
    const at = alloc(W, H);
    if (!at) return null;
    const c = stage.canvas;
    if (c.width < W || c.height < H) {
      c.width = Math.max(c.width, W);
      c.height = Math.max(c.height, H);
      red = new Uint8Array(c.width * c.height);
    }
    stage.setTransform(1, 0, 0, 1, 0, 0);
    stage.fillStyle = '#000';
    stage.fillRect(0, 0, W, H);
    stage.setTransform(dpr, 0, 0, dpr, 0, 0);
    stage.font = fontOf(q, bold);
    stage.fillStyle = '#fff';
    stage.textAlign = 'center';
    stage.textBaseline = 'middle';
    const top = -((lines.length - 1) * lineGap) / 2;
    for (let l = 0; l < lines.length; l++) stage.fillText(lines[l]!, W / dpr / 2, H / dpr / 2 + top + l * lineGap);
    const px = stage.getImageData(0, 0, W, H).data;
    for (let k = 0, n = W * H; k < n; k++) red[k] = px[k * 4]!;
    gl.bindTexture(gl.TEXTURE_2D, sh!.atlas);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, at.x, at.y, W, H, gl.RED, gl.UNSIGNED_BYTE, red, 0);
    stats.uploads++;
    stats.uploadsTotal++;
    (globalThis as unknown as Record<string, number>).__renders = ((globalThis as unknown as Record<string, number>).__renders ?? 0) + 1;
    (globalThis as unknown as Record<string, number>).__uploadBytes = ((globalThis as unknown as Record<string, number>).__uploadBytes ?? 0) + W * H;
    const e: Entry = { key, u0: at.x / ATLAS, v0: at.y / ATLAS, u1: (at.x + W) / ATLAS, v1: (at.y + H) / ATLAS, w: W / dpr, h: H / dpr, q };
    A.entries.set(key, e);
    return e;
  }
  /** Per segment: the entry last drawn for it, and its last px (to tell a changing size from a settled one). */
  const current: (Entry | null)[] = layout.segments.map(() => null);
  const lastPx = new Float64Array(N);
  let gen = A.generation;
  let budget = 0;
  let refinePending = false;
  function entryFor(i: number, lines: string[], px: number, bold: boolean): Entry | null {
    const q = Math.max(STEP, Math.round(px / STEP) * STEP);
    const base = `${bold ? 1 : 0}|${lines.join('\n')}`;
    const key = `${base}|${q}`;
    const exact = A.entries.get(key);
    const have = current[i] && current[i]!.key.startsWith(`${base}|`) && A.entries.has(current[i]!.key) ? current[i] : null;
    const settled = lastPx[i] === px;
    lastPx[i] = px;
    let e: Entry | null = exact ?? null;
    if (!e && have && mode !== 'rerender') {
      const ratio = px / have.q;
      if (mode === 'scale') e = ratio <= 2 && ratio >= 0.5 ? have : null;
      else if (!settled && ratio <= 1.5 && ratio >= 1 / 1.5) { e = have; refinePending = true; }
      else if (budget <= 0) { e = have; refinePending = true; }
    }
    if (!e) {
      if (have) budget--;
      e = render(key, lines, q, bold);
      if (!e) return null;
    }
    current[i] = e;
    return e;
  }

  const win: ViewWindow = { rMin: 0, rMax: 0, full: true, from: 0, to: 0 };
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let table: FillTable | null = null;
  let palette: Palette | null = null;
  let inst = new Float32Array(INST * 256);
  let last: Frame | null = null;
  let raf = 0;

  function fx(mode_: number, c: { cx: number; cy: number }, r0: number, r1: number, a0: number, a1: number, col: RGBA, col2: RGBA,
    pc: { x: number; y: number }, pulse: number, box: [number, number, number, number]): void {
    const p = sh!.fxProg;
    gl.useProgram(p);
    gl.bindVertexArray(fvao);
    gl.uniform2f(u(p, 'u_c'), c.cx, c.cy);
    gl.uniform1f(u(p, 'u_r0'), r0);
    gl.uniform1f(u(p, 'u_r1'), r1);
    gl.uniform1f(u(p, 'u_a0'), a0);
    gl.uniform1f(u(p, 'u_a1'), a1);
    gl.uniform1i(u(p, 'u_mode'), mode_);
    gl.uniform4f(u(p, 'u_col'), col[0] / 255, col[1] / 255, col[2] / 255, 1);
    gl.uniform4f(u(p, 'u_col2'), col2[0] / 255, col2[1] / 255, col2[2] / 255, 1);
    gl.uniform1f(u(p, 'u_dpr'), dpr);
    gl.uniform1f(u(p, 'u_hdev'), canvas.height);
    gl.uniform2f(u(p, 'u_pc'), pc.x, pc.y);
    gl.uniform1f(u(p, 'u_pulse'), pulse);
    const [x0, y0, x1, y1] = box;
    const sx = Math.max(0, Math.floor(x0 * dpr));
    const sy = Math.max(0, Math.floor((cssH - y1) * dpr));
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(sx, sy, Math.max(0, Math.ceil((x1 - x0) * dpr)), Math.max(0, Math.ceil((y1 - y0) * dpr)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    count(1);
    gl.disable(gl.SCISSOR_TEST);
  }
  /** Screen bounding box of a sector, padded. */
  function sectorBox(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, pad: number): [number, number, number, number] {
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    for (let k = 0; k <= 16; k++) {
      const a = a0 + ((a1 - a0) * k) / 16;
      for (const r of [r0, r1]) {
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
    return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
  }

  const renderer: WheelRenderer & { stats: typeof stats } = {
    stats,
    resize(w, h, ratio) {
      cssW = w;
      cssH = h;
      dpr = ratio;
      if (A.dpr !== ratio) {
        A.dpr = ratio;
        resetAtlas();
      }
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
    },
    setColors(t, p) {
      table = t;
      palette = p;
      rgbaCache.clear();
    },
    draw(f) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      last = f;
      stats.segmentsDrawn = 0; stats.labelsDrawn = 0; stats.labelFits = 0; stats.uploads = 0;
      stats.labelsByRing.fill(0); stats.focusRing = false; stats.focusOutline = false;
      if (!table || !palette) return;
      if (gen !== A.generation) { current.fill(null); gen = A.generation; }
      const { cam, vp } = f;
      const R = vp.radius * cam.scale;
      const rot = ((cam.rotation % TAU) + TAU) % TAU;
      const k = f.remPx / 16;
      const wrapAt = (ring: number): number => (f.mode !== 'ring' ? 8 : f.ring !== null && ring > f.ring ? 10 : 12) * k;
      const floor = 1 * k;
      const maxPx = Math.floor(Math.min(Math.max(16 * k * cam.scale, 16 * k), 24 * k) * 2) / 2;
      const lifted = f.opened ? f.selected : null;
      viewWindow(cam, vp, win);

      // Per-cell fill (with the fade) and label colors.
      for (const s of layout.segments) {
        const now = f.lit[s.index] === 1;
        const before = f.prevLit[s.index] === 1;
        const a = rgba(table.fill(s.hue, s.ring, now));
        const o = s.index * 4;
        if (now !== before && f.fadeT < 1) {
          const b = rgba(table.fill(s.hue, s.ring, before));
          for (let c = 0; c < 3; c++) colorData[o + c] = Math.round(b[c]! + (a[c]! - b[c]!) * f.fadeT);
        } else {
          colorData[o] = a[0]; colorData[o + 1] = a[1]; colorData[o + 2] = a[2];
        }
        colorData[o + 3] = 255;
        const l = rgba(table.label(s.hue, s.ring, f.fadeT >= 0.5 ? now : before));
        const lo = (N + s.index) * 4;
        colorData[lo] = l[0]; colorData[lo + 1] = l[1]; colorData[lo + 2] = l[2]; colorData[lo + 3] = l[3];
        if (inWindow(s, layout.rings[s.ring]!, win)) stats.segmentsDrawn++;
      }
      let changed = colorsSized !== N;
      for (let c = 0; c < colorData.length && !changed; c++) changed = colorData[c] !== colorPrev[c];
      if (changed) {
        gl.bindTexture(gl.TEXTURE_2D, sh!.colors);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
        if (colorsSized !== N) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, colorData);
        else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, 2, gl.RGBA, gl.UNSIGNED_BYTE, colorData);
        colorsSized = N;
        colorPrev.set(colorData);
      }

      // Labels: fit on the CPU, place on the GPU.
      budget = BUDGET;
      refinePending = false;
      let n = 0;
      const push = (rMidUnit: number, theta: number, e: Entry, scale: number, col: RGBA): void => {
        if ((n + 1) * INST > inst.length) {
          const grown = new Float32Array(inst.length * 2);
          grown.set(inst);
          inst = grown;
        }
        const o = n * INST;
        inst[o] = rMidUnit; inst[o + 1] = theta; inst[o + 2] = e.w * scale; inst[o + 3] = e.h * scale;
        inst[o + 4] = e.u0; inst[o + 5] = e.v0; inst[o + 6] = e.u1; inst[o + 7] = e.v1;
        inst[o + 8] = col[0] / 255; inst[o + 9] = col[1] / 255; inst[o + 10] = col[2] / 255; inst[o + 11] = col[3] / 255;
        n++;
      };
      for (let attempt = 0; attempt < 2; attempt++) {
        n = 0;
        let full = false;
        for (const s of layout.segments) {
          const ring = layout.rings[s.ring]!;
          if (s.index === lifted || !inWindow(s, ring, win)) continue;
          const rMid = ((ring.inner + ring.outer) / 2) * R;
          const angle = s.mid + cam.rotation;
          const x = cam.cx + rMid * Math.cos(angle);
          const y = cam.cy + rMid * Math.sin(angle);
          if (x < -rMid || y < -rMid || x > cssW + rMid || y > cssH + rMid) continue;
          const fit = fitted(s.index, (ring.outer - ring.inner) * R - 2 * LABEL_PAD, (s.end - s.start) * rMid, floor, maxPx, wrapAt(s.ring));
          if (!fit) continue;
          const e = entryFor(s.index, fit.lines, fit.px, false);
          if (!e) { full = true; break; }
          push((ring.inner + ring.outer) / 2, s.mid, e, fit.px / e.q, [255, 255, 255, 255]);
          // Label color from the per-cell table.
          const lo = (N + s.index) * 4;
          const o = (n - 1) * INST;
          inst[o + 8] = colorData[lo]! / 255; inst[o + 9] = colorData[lo + 1]! / 255; inst[o + 10] = colorData[lo + 2]! / 255; inst[o + 11] = colorData[lo + 3]! / 255;
          stats.labelsDrawn++;
          stats.labelsByRing[s.ring]!++;
        }
        if (!full) break;
        resetAtlas();
        current.fill(null);
        gen = A.generation;
      }
      const normalLabels = n;

      // Opened label (bold), appended after the normal ones and drawn last.
      let openedInfo: { x: number; y: number; p: number; r0: number; r1: number; a0: number; a1: number } | null = null;
      const sel = f.selected !== null ? layout.segments[f.selected]! : null;
      const selVisible = sel !== null && inWindow(sel, layout.rings[sel.ring]!, win);
      if (sel && selVisible && f.opened) {
        const ring = layout.rings[sel.ring]!;
        const r0 = Math.max(0, ring.inner * R - LIFT_RADIAL_PX);
        const r1 = ring.outer * R + LIFT_RADIAL_PX;
        const rMid = ((ring.inner + ring.outer) / 2) * R;
        const side = LIFT_SIDE_PX / Math.max(rMid, 1);
        const p = PULSE_FROM + (1 - PULSE_FROM) * easeOut(Math.min(Math.max(f.pulseT, 0), 1));
        const angle = sel.mid + cam.rotation;
        const x = cam.cx + rMid * Math.cos(angle);
        const y = cam.cy + rMid * Math.sin(angle);
        openedInfo = { x, y, p, r0, r1, a0: sel.start + cam.rotation - side, a1: sel.end + cam.rotation + side };
        const fit = fitted(sel.index, (ring.outer - ring.inner) * R - 2 * LABEL_PAD, (sel.end - sel.start) * rMid, floor, maxPx, wrapAt(sel.ring));
        if (fit) {
          const lab = openedLabel(sel.index, r1 - r0 - 2 * (LABEL_PAD + OUTLINE_INNER_PX), (sel.end - sel.start + 2 * side) * rMid, fit);
          const e = entryFor(sel.index, lab.lines, lab.px, true);
          if (e) {
            push((ring.inner + ring.outer) / 2, sel.mid, e, (lab.px / e.q) * p, rgba(table.label(sel.hue, sel.ring, true)));
            stats.labelsDrawn++;
            stats.labelsByRing[sel.ring]!++;
          }
        }
      }

      // ── GL draw.
      gl.viewport(0, 0, canvas.width, canvas.height);
      const bg = rgba(palette.bg);
      gl.clearColor(bg[0] / 255, bg[1] / 255, bg[2] / 255, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const skip = (globalThis as { __glSkip?: string }).__glSkip ?? '';
      if (skip === 'all') { gl.bindVertexArray(null); return; }
      gl.disable(gl.BLEND);
      const cp_ = sh!.cellProg;
      gl.useProgram(cp_);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sh!.colors);
      gl.uniform1i(u(cp_, 'u_colors'), 0);
      gl.uniform2f(u(cp_, 'u_res'), cssW, cssH);
      gl.uniform2f(u(cp_, 'u_center'), cam.cx, cam.cy);
      gl.uniform1f(u(cp_, 'u_R'), R);
      gl.uniform1f(u(cp_, 'u_rot'), rot);
      const gap = rgba(palette.gap);
      const gapW = f.moreContrast ? GAP_PX_MORE : GAP_PX;
      // The gap color under every cell, reaching half a gap past its edges; then each cell, half a gap inside them.
      gl.uniform1i(u(cp_, 'u_solid'), 1);
      gl.uniform4f(u(cp_, 'u_solidColor'), gap[0] / 255, gap[1] / 255, gap[2] / 255, 1);
      gl.uniform1f(u(cp_, 'u_inset'), -gapW / 2);
      if (!skip.includes('cells')) gl.drawElements(gl.TRIANGLES, indexCount, big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
      count(1);
      gl.uniform1i(u(cp_, 'u_solid'), 0);
      gl.uniform1f(u(cp_, 'u_inset'), gapW / 2);
      if (!skip.includes('cells')) gl.drawElements(gl.TRIANGLES, indexCount, big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
      count(1);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const lp = sh!.labelProg;
      gl.bindBuffer(gl.ARRAY_BUFFER, sh!.inst);
      gl.bufferData(gl.ARRAY_BUFFER, inst.subarray(0, n * INST), gl.STREAM_DRAW);
      const drawLabels = (from: number, count: number): void => {
        if (count <= 0) return;
        gl.useProgram(lp);
        gl.bindVertexArray(lvao);
        gl.bindBuffer(gl.ARRAY_BUFFER, sh!.inst);
        for (const [name, off] of [['a_inst', 0], ['a_uv', 16], ['a_color', 32]] as const) {
          const loc = gl.getAttribLocation(lp, name);
          gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, INST * 4, from * INST * 4 + off);
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sh!.atlas);
        gl.uniform1i(u(lp, 'u_atlas'), 0);
        gl.uniform2f(u(lp, 'u_res'), cssW, cssH);
        gl.uniform2f(u(lp, 'u_center'), cam.cx, cam.cy);
        gl.uniform1f(u(lp, 'u_R'), R);
        gl.uniform1f(u(lp, 'u_rot'), rot);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
        count_(1);
      };
      if (!skip.includes('labels')) drawLabels(0, normalLabels);

      const outer = layout.rings[layout.rings.length - 1]!.outer;
      const center = { x: cam.cx, y: cam.cy };
      if (f.keyboardFocus && f.selected === null) {
        const rc = R * outer + FOCUS_GAP_PX + FOCUS_RING_PX / 2;
        fx(3, cam, rc, FOCUS_RING_PX, 0, TAU, rgba(palette.focus), gap, center, 1, [cam.cx - rc - 4, cam.cy - rc - 4, cam.cx + rc + 4, cam.cy + rc + 4]);
        stats.focusRing = true;
      }
      if (sel && selVisible) {
        const ink = rgba(f.keyboardFocus ? palette.focus : palette.outline);
        stats.focusOutline = f.keyboardFocus;
        const ring = layout.rings[sel.ring]!;
        if (!openedInfo) {
          const a0 = sel.start + cam.rotation;
          const a1 = sel.end + cam.rotation;
          fx(2, cam, ring.inner * R, ring.outer * R, a0, a1, ink, gap, center, 1, sectorBox(cam.cx, cam.cy, ring.inner * R, ring.outer * R, a0, a1, 6));
        } else {
          const o = openedInfo;
          const box = sectorBox(cam.cx, cam.cy, o.r0, o.r1, o.a0, o.a1, 20);
          const pc = { x: o.x, y: o.y };
          fx(1, cam, o.r0, o.r1, o.a0, o.a1, ink, gap, pc, o.p, box);
          fx(0, cam, o.r0, o.r1, o.a0, o.a1, rgba(table.fill(sel.hue, sel.ring, true)), gap, pc, o.p, box);
          fx(2, cam, o.r0, o.r1, o.a0, o.a1, ink, gap, pc, o.p, box);
          drawLabels(normalLabels, n - normalLabels);
        }
      }
      (globalThis as unknown as Record<string, number>).__draws = ((globalThis as unknown as Record<string, number>).__draws ?? 0) + stats.labelsDrawn;
      gl.bindVertexArray(null);
      // Hybrid: labels drawn scaled this frame get their exact size on a later one.
      // Two frames on, so it never lands in a frame the app draws anyway (a draw cancels it).
      if (refinePending && mode === 'hybrid') raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => { raf = 0; if (last) renderer.draw(last); }); });
    },
  };
  (globalThis as { __glStats?: unknown }).__glStats = () => ({ ...stats, atlasEntries: A.entries.size, atlasRows: A.nextY, resets: A.resets });
  return renderer;
}
