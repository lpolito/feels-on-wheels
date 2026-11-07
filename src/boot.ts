// Imported first by main.ts: the locale must be active before any custom element module
// evaluates, because elements upgrade (and render their labels) as soon as they are defined.
import { loadData } from './data/load';
import { setLocale } from './i18n';

export const data = loadData();
setLocale(data.locale);
