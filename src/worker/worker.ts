import type { PageStrings } from '../../build/site.ts';
import { site } from '../../site.config.ts';
import { loadData } from '../data/load.ts';
// Only the Worker reads `page`; the app's JS never bundles it (src/data/load.ts).
import { page, titles } from '../data/locales/en.json';
import { routeTable } from '../state/url.ts';
import { handle, type AssetsBinding, type WorkerContext } from './handler.ts';

/**
 * The Worker's entry (wrangler.jsonc `main`, URL redesign spec §5). Cloudflare runs it only for paths with no file;
 * the context is built once per isolate, from the same data and strings the build uses.
 */
const data = loadData();
const ctx: WorkerContext = {
  table: routeTable(data.wheels),
  locale: data.locale,
  site,
  strings: { ...(page as Omit<PageStrings, 'titles'>), titles },
};

export default {
  fetch(req: Request, env: { ASSETS: AssetsBinding }): Promise<Response> {
    return handle(req, env.ASSETS, ctx);
  },
};
