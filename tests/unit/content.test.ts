import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';

const { feelings, locale } = loadData();

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
