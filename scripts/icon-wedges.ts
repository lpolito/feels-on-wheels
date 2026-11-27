// The app icon and the lucaspolito.dev icon, drawn from the feelings wheel (opinionated wheel spec §4). Used by
// scripts/make-icons.mjs, which writes the files, and by tests/unit/icons.test.ts, which checks they're current.
import { nodeRef } from '../src/data/load';
import type { Wheel, WheelNode } from '../src/data/types';
import { contrast } from '../src/render/colors';

export interface Wedge { hue: string; id: string; start: number; end: number }

const leaves = (n: WheelNode): number => (n.children ? n.children.reduce((s, c) => s + leaves(c), 0) : 1);

/** One wedge per core, in wheel order, in degrees clockwise from 12 o'clock, each sized by its outer words. */
export function iconWedges(wheel: Wheel): Wedge[] {
  const total = wheel.children.reduce((s, c) => s + leaves(c), 0);
  let at = 0;
  return wheel.children.map((c) => {
    const start = at;
    at += (360 * leaves(c)) / total;
    return { hue: c.hue!, id: nodeRef(c).id, start, end: at };
  });
}

const C = 256;
const point = (r: number, deg: number): string => {
  const a = (deg * Math.PI) / 180;
  return `${(C + r * Math.sin(a)).toFixed(2)} ${(C - r * Math.cos(a)).toFixed(2)}`;
};
const xy = (r: number, deg: number): string => {
  const [x, y] = point(r, deg).split(' ');
  return `x2="${x}" y2="${y}"`;
};

/** The app icon: wedges from radius 78 to 240, white spokes, and the inner ring line. `colors` maps hue to hex. */
export function appIconSvg(wedges: Wedge[], colors: Record<string, string>): string {
  const paths = wedges.map((w) => {
    const big = w.end - w.start > 180 ? 1 : 0;
    return `<path fill="${colors[w.hue]!.toUpperCase()}" d="M${point(240, w.start)} A240 240 0 ${big} 1 ${point(240, w.end)} L${point(78, w.end)} A78 78 0 ${big} 0 ${point(78, w.start)}Z"/>`;
  });
  const spokes = wedges.map((w) => {
    const [x1, y1] = point(78, w.start).split(' ');
    const [x2, y2] = point(240, w.start).split(' ');
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${paths.join('')}<g stroke="#fff" stroke-width="8">${spokes.join('')}</g><circle cx="256" cy="256" r="148.8" fill="none" stroke="#fff" stroke-width="6" stroke-opacity=".55"/></svg>\n`;
}

const deg = (d: number): string => `${Number(d.toFixed(1))}°`;
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** The silhouette for lucaspolito.dev, used there as a CSS mask: the wheel with its hole, core ring and spokes. */
export function siteIconSvg(wedges: Wedge[]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Feels on Wheels' silhouette, for use as a CSS mask on lucaspolito.dev: the app icon's wheel with its
       hole, core ring and ${words[wedges.length]} spokes at the real wedge boundaries (${wedges.map((w) => deg(w.start)).join(', ')}).
       Drawn by scripts/make-icons.mjs. -->
  <defs>
    <mask id="m">
      <circle cx="256" cy="256" r="240" fill="#fff"/>
      <circle cx="256" cy="256" r="78" fill="#000"/>
      <g stroke="#000" stroke-width="20">
${wedges.map((w) => `        <line x1="256" y1="256" ${xy(250, w.start)}/>`).join('\n')}
      </g>
      <circle cx="256" cy="256" r="148.8" fill="none" stroke="#000" stroke-width="16"/>
    </mask>
  </defs>
  <rect width="512" height="512" mask="url(#m)"/>
</svg>
`;
}

/** lucaspolito.dev's page background, which every color must clear by its 3:1 rule. */
export const SITE_BACKGROUND = '#121214';

/** Each wedge's contrast on the site's background. */
export const siteContrasts = (wedges: Wedge[], colors: Record<string, string>): number[] =>
  wedges.map((w) => contrast(colors[w.hue]!, SITE_BACKGROUND));

/** The CSS for lucaspolito.dev: gray at rest, the wedges' colors on hover, focus or tap. `names` maps id to label. */
export function siteIconCss(wedges: Wedge[], colors: Record<string, string>, names: Record<string, string>): string {
  const ratios = siteContrasts(wedges, colors);
  const list = wedges.map((w, i) => `${names[w.id]} ${colors[w.hue]!.toUpperCase()} ${ratios[i]!.toFixed(2)}`);
  const half = Math.ceil(list.length / 2);
  const stops = wedges.map((w) => `      ${colors[w.hue]!.toLowerCase()} ${Number(w.start.toFixed(1))}deg ${Number(w.end.toFixed(1))}deg`);
  return `/*
 * Feels on Wheels link icon for lucaspolito.dev (going-public spec §9). Drawn by scripts/make-icons.mjs.
 * Add after the .icon-linkedin rule in css/styles.css. It reuses the site's .icon mask and ::after color layer:
 * gray at rest like the other icons; on hover, focus or tap it takes the wheel's ${words[wedges.length]} core-feeling colors
 * (the app's dark-theme hues) and spins once, settling.
 *
 * Contrast on --background ${SITE_BACKGROUND}, all above the site's 3:1 rule:
 *   ${list.slice(0, half).join(' · ')}
 *   ${list.slice(half).join(' · ')}
 */
.icon-feels {
  --icon: url("../icons/feels-on-wheels.svg");
  transition: rotate 0s;

  /* The colors sit exactly on the silhouette's wedges, so no gradient offset or tilt. */
  &::after {
    inset: 0;
    rotate: 0deg;
    background-size: auto;
    animation: none;
    background-image: conic-gradient(
${stops.join(',\n')}
    );
  }
}

/* One prize-wheel spin that settles. Leaving snaps back without animating, so it can spin again next time. */
@media (hover: hover) {
  a:hover .icon-feels {
    rotate: 360deg;
    transition: rotate 1.1s cubic-bezier(0.2, 0.8, 0.25, 1);
  }
}

a:active .icon-feels,
a:focus-visible .icon-feels {
  rotate: 360deg;
  transition: rotate 1.1s cubic-bezier(0.2, 0.8, 0.25, 1);
}

@media (prefers-reduced-motion: reduce) {
  a:is(:hover, :active, :focus-visible) .icon-feels {
    rotate: 0deg;
    transition: none;
  }
}

/* Forced colors: the site's .icon rule shows the silhouette in LinkText; no color layer. */
@media (forced-colors: active) {
  .icon-feels::after {
    display: none;
  }
}
`;
}
