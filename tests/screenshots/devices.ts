/**
 * Screenshots spec, "Sizes: real devices". iPhone and Pixel sizes are Playwright's (the part of the screen the page
 * gets, after the browser's bars); iPad mini, iPad Air and iPad Pro 13" aren't in Playwright's list, so they use the
 * full screen in CSS pixels.
 */
export interface Device { name: string; width: number; height: number; touch: boolean }

const both = (name: string, width: number, height: number, sideways: [number, number] = [height, width]): Device[] => [
  { name: `${name} upright`, width, height, touch: true },
  { name: `${name} sideways`, width: sideways[0], height: sideways[1], touch: true },
];

export const DEVICES: Device[] = [
  ...both('iPhone SE (3rd gen)', 375, 667),
  ...both('iPhone 15', 393, 659, [734, 343]),
  ...both('iPhone 15 Pro Max', 430, 739, [814, 380]),
  ...both('Pixel 7', 412, 839, [863, 360]),
  ...both('iPad mini', 744, 1133),
  ...both('iPad Air 11"', 820, 1180),
  ...both('iPad Pro 13"', 1032, 1376),
  ...both('Galaxy Tab S9', 640, 1024),
  { name: 'iPad Air 11" half of Split View', width: 590, height: 820, touch: true },
  { name: 'Laptop', width: 1440, height: 900, touch: false },
  { name: 'Desktop', width: 1920, height: 1080, touch: false },
];

/** A screen to capture. `only`: the devices it's captured on, when not all of them. */
export interface Screen { name: string; path: string; only?: string[] }

/** About and not found change little between sizes (spec, "Screens"). */
const FEW = ['iPhone 15 upright', 'iPad Air 11" upright', 'Laptop'];

export const SCREENS: Screen[] = [
  { name: 'feelings wheel', path: '/' },
  { name: 'body wheel', path: '/body' },
  { name: 'core feeling opened', path: '/angry' },
  { name: 'deeper feeling opened', path: '/happy/playful' },
  { name: 'body area opened', path: '/body/chest' },
  { name: 'sensation opened', path: '/body/chest/tight-chest' },
  { name: 'about', path: '/about', only: FEW },
  { name: 'not found', path: '/happy/plaful', only: FEW },
];
