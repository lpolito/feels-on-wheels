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

  test('sensation vocabulary is 30–50 ids and every id is used at least once', () => {
    const vocab = Object.keys(locale.sensations);
    expect(vocab.length).toBeGreaterThanOrEqual(30);
    expect(vocab.length).toBeLessThanOrEqual(50);
    const used = new Set(Object.values(feelings).flatMap((f) => f.sensations));
    for (const s of vocab) expect(used.has(s), `unused sensation ${s}`).toBe(true);
  });
});

describe('body wheel content', () => {
  test('racing heart leads to scared, mad and excited', () => {
    expect(feelingsUnder('racing-heart')).toEqual(['scared', 'mad', 'excited']);
  });

  test('smiling includes happy', () => {
    expect(feelingsUnder('smiling')).toContain('happy');
  });
});

describe('going public (spec 2026-11-09)', () => {
  test('page strings exist and are not empty', () => {
    const page = (en as unknown as { page: Record<string, string | undefined> }).page;
    expect(page.name).toBe('Feels on Wheels');
    expect(page.shortName).toBe('Feels');
    expect(page.title).toBe('Feels on Wheels: name what you feel');
    expect(page.description?.length).toBeGreaterThanOrEqual(100);
    expect(page.description?.length).toBeLessThanOrEqual(160);
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

  test('site config has a URL ending in /', () => {
    expect(site.url).toMatch(/^https:\/\/.+\/$/);
    expect(site.indexable).toBe(false);
  });
});
