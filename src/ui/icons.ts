const SVG = 'http://www.w3.org/2000/svg';

function icon(paths: string[], className: string): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', className);
  for (const d of paths) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

/** A circled "i": the About page (going-public spec §8.4). */
export function infoIcon(className = 'fw-icon'): SVGSVGElement {
  return icon(['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 11v6M12 7.5v.01'], className);
}

/** An arrow rising from a tray: share. */
export function shareIcon(className = 'fw-icon'): SVGSVGElement {
  return icon(
    ['M12 3v12M8 7l4-4 4 4', 'M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17.5 10H16'],
    className,
  );
}
