import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import en from '../../src/data/locales/en.json';
import { site } from '../../site.config';

const { feelings, locale, wheels } = loadData();
const feelingsUnder = (sensation: string): string[] =>
  wheels.find((w) => w.id === 'body')!.children.flatMap((a) => a.children ?? [])
    .find((s) => s.sensation === sensation)!.children!.map((f) => f.feeling!);

describe('v1 content', () => {
  test('every feeling has a non-empty definition of 1–2 sentences', () => {
    for (const id of Object.keys(feelings)) {
      const def = locale.feelings[id]?.definition ?? '';
      expect(def.trim(), id).not.toBe('');
      const sentences = def.split(/[.!?](?:\s|$)/).filter((s) => s.trim() !== '');
      expect(sentences.length, `${id}: ${def}`).toBeLessThanOrEqual(2);
      expect(def.length, `${id}: ${def}`).toBeLessThanOrEqual(220);
    }
  });

  test('every feeling has 2–4 sensations, all present in en.sensations', () => {
    for (const [id, f] of Object.entries(feelings)) {
      expect(f.sensations.length, id).toBeGreaterThanOrEqual(2);
      expect(f.sensations.length, id).toBeLessThanOrEqual(4);
      expect(new Set(f.sensations).size, `${id} has duplicate sensations`).toBe(f.sensations.length);
      for (const s of f.sensations) expect(locale.sensations[s], `${id} → ${s}`).toBeTruthy();
    }
  });

  test('sensation vocabulary is 40–60 ids and every id is used at least once', () => {
    const vocab = Object.keys(locale.sensations);
    expect(vocab.length).toBeGreaterThanOrEqual(40);
    expect(vocab.length).toBeLessThanOrEqual(60);
    const used = new Set(Object.values(feelings).flatMap((f) => f.sensations));
    for (const s of vocab) expect(used.has(s), `unused sensation ${s}`).toBe(true);
  });
});

describe('body wheel content', () => {
  test('racing heart leads to scared, mad and excited', () => {
    expect(feelingsUnder('racing-heart')).toEqual(['scared', 'mad', 'excited']);
  });

  test('urges are bare verbs on the wheel and read as wanting on cards', () => {
    expect(locale.sensations['hide']).toBe('Hide');
    expect(locale.sensationPhrases['hide']).toBe('Wanting to hide');
    expect(locale.sensations['fix-things']).toBe('Fix things');
    expect(locale.sensationPhrases['queasy']).toBe('Feeling queasy');
  });

  test('want to lash out offers hurt, which anger often covers', () => {
    expect(feelingsUnder('lash-out')).toEqual(['furious', 'provoked', 'hurt']);
  });

  test('want to cry leaves out sad', () => {
    expect(feelingsUnder('cry')).toEqual(['frustrated', 'overwhelmed', 'thankful']);
  });

  test('nothing much could be content, peaceful, or apathetic', () => {
    expect(feelingsUnder('nothing-much')).toEqual(['content', 'peaceful', 'apathetic']);
    expect(locale.sensations['nothing-much']).toBe('Nothing much');
    expect(locale.sensationPhrases['nothing-much']).toBe('Not feeling much');
  });

  test('the happy-only sensations stay for You might notice, off the body wheel', () => {
    const onWheel = new Set(wheels.find((w) => w.id === 'body')!.children.flatMap((a) => a.children ?? []).map((s) => s.sensation));
    for (const s of ['warm-chest', 'light-body', 'relaxed', 'feeling-tall']) {
      expect(locale.sensations[s], s).toBeTruthy();
      expect(onWheel.has(s), s).toBe(false);
    }
    expect(feelings['joyful']!.sensations).toContain('light-body');
  });

  test('no sensation is happy and nothing else', () => {
    const happy = new Set<string>();
    const walk = (n: { feeling?: string; children?: { feeling?: string; children?: unknown[] }[] }, inHappy: boolean) => {
      for (const c of n.children ?? []) { const h = inHappy || c.feeling === 'happy'; if (h) happy.add(c.feeling!); walk(c as never, h); }
    };
    walk(wheels.find((w) => w.id === 'core')! as never, false);
    for (const s of wheels.find((w) => w.id === 'body')!.children.flatMap((a) => a.children ?? [])) {
      const fs = (s.children ?? []).map((f) => f.feeling!);
      expect(fs.every((f) => happy.has(f)), `${s.sensation}: ${fs.join(', ')}`).toBe(false);
    }
  });
});

describe('going public (spec 2026-11-09)', () => {
  test('page strings exist and are not empty', () => {
    const page = (en as unknown as { page: Record<string, string | undefined> }).page;
    expect(page.name).toBe('Feels on Wheels');
    expect(page.shortName).toBe('Feels on Wheels');
    const { titles } = en;
    expect(titles.home).toBe('Feels on Wheels: find the word for what you feel');
    expect(titles.homeDescription.length).toBeGreaterThanOrEqual(100);
    expect(titles.homeDescription.length).toBeLessThanOrEqual(160);
    for (const w of loadData().wheels.slice(1)) {
      const d = (titles.wheelDescriptions as Record<string, string>)[w.id];
      expect(d, `wheelDescriptions.${w.id}`).toBeTruthy();
      expect(d!.length).toBeGreaterThanOrEqual(50);
      expect(d!.length).toBeLessThanOrEqual(160);
    }
    expect(page.imageAlt?.trim()).toBeTruthy();
    expect(page.noscript?.trim()).toBeTruthy();
  });

  test('the lockfile carries the package name', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string };
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as { name: string; packages: Record<string, { name?: string }> };
    expect(pkg.name).toBe('feels-on-wheels');
    expect(lock.name).toBe(pkg.name);
    expect(lock.packages['']?.name).toBe(pkg.name);
  });

  test('the site lives at feelsonwheels.app and is not indexed yet', () => {
    expect(site.url).toBe('https://feelsonwheels.app/');
    expect(site.indexable).toBe(false);
  });

  test("wrangler serves dist/ with Cloudflare's default HTML handling, and the Worker only for paths with no file (URL redesign spec §5)", () => {
    const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8').replace(/^\s*\/\/.*$/gm, '')) as Record<string, unknown>;
    expect(config['name']).toBe('feels-on-wheels');
    expect(config['main']).toBe('./src/worker/worker.ts');
    expect(config['assets']).toEqual({ directory: './dist/', binding: 'ASSETS', html_handling: 'auto-trailing-slash', not_found_handling: 'none' });
  });

  test('wrangler has a previews block, which Workers Builds needs for pull request previews (`wrangler preview`)', () => {
    const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8').replace(/^\s*\/\/.*$/gm, '')) as Record<string, unknown>;
    expect(config['previews']).toEqual({});
  });
});

describe('link previews (share and preview spec)', () => {
  test("the preview image's alt text quotes the tagline the image shows, and names the wheel and wedge", () => {
    const tagline = en.titles.home.slice(en.titles.home.indexOf(': ') + 2);
    const shown = tagline.charAt(0).toUpperCase() + tagline.slice(1);
    expect(en.page.imageAlt).toContain(shown);
    expect(en.page.imageAlt).toContain('{wheel}');
    expect(en.page.imageAlt).toContain('{wedge}');
  });
});
