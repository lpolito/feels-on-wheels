/**
 * The only place the app's public address lives (going-public spec §3.2). The build reads it for every absolute
 * URL: canonical, preview tags, JSON-LD, robots.txt and the sitemap. The app itself only uses relative URLs.
 */
export interface SiteConfig {
  /** The app's public URL, ending in "/". */
  url: string;
  /** false until the app is on its own domain: pages say noindex. */
  indexable: boolean;
  repo: string;
  author: { name: string; url: string };
}

export const site: SiteConfig = {
  url: 'https://lpolito.github.io/feels-on-wheels/',
  indexable: false,
  repo: 'https://github.com/lpolito/feels-on-wheels',
  author: { name: 'Lucas Polito', url: 'https://lucaspolito.dev/' },
};
