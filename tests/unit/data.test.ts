import { describe, expect, test, vi } from 'vitest';
import { DataError, loadData, validateLocale, validateWheel } from '../../src/data/load';
import type { Wheel, WheelNode } from '../../src/data/types';
import { label, setLocale, t } from '../../src/i18n';

const { wheel, feelings, locale } = loadData();

function walk(nodes: WheelNode[], depth: number, visit: (n: WheelNode, d: number) => void): void {
  for (const n of nodes) {
    visit(n, depth);
    if (n.children) walk(n.children, depth + 1, visit);
  }
}

function countByDepth(w: Wheel): number[] {
  const counts = [0, 0, 0];
  walk(w.children, 0, (_n, d) => { counts[d] = (counts[d] ?? 0) + 1; });
  return counts;
}

describe('core wheel data', () => {
  test('core wheel has 7 core, 41 middle, 82 outer positions', () => {
    expect(countByDepth(wheel)).toEqual([7, 41, 82]);
  });

  test('core order starts Fearful, Angry, Disgusted, Sad, Happy, Surprised, Bad', () => {
    expect(wheel.children.map((n) => n.feeling)).toEqual([
      'fearful', 'angry', 'disgusted', 'sad', 'happy', 'surprised', 'bad',
    ]);
  });

  test('every node feeling exists in feelings.json', () => {
    walk(wheel.children, 0, (n) => expect(feelings[n.feeling], n.feeling).toBeDefined());
  });

  test('only depth-0 nodes declare hue and every core has one', () => {
    walk(wheel.children, 0, (n, d) => {
      if (d === 0) expect(n.hue, n.feeling).toBeTruthy();
      else expect(n.hue, n.feeling).toBeUndefined();
    });
  });

  test('labels: Judgmental (not Judgemental), Optimistic without leading space', () => {
    setLocale(locale);
    expect(label('judgmental')).toBe('Judgmental');
    expect(label('optimistic')).toBe('Optimistic');
    const all = Object.values(locale.feelings).map((f) => f.label);
    expect(all).not.toContain('Judgemental');
    for (const l of all) expect(l).toBe(l.trim());
  });

  test('duplicate words share one feeling id', () => {
    const uses = new Map<string, number>();
    walk(wheel.children, 0, (n) => uses.set(n.feeling, (uses.get(n.feeling) ?? 0) + 1));
    for (const id of ['overwhelmed', 'embarrassed', 'inferior', 'disappointed']) {
      expect(uses.get(id), id).toBe(2);
    }
  });
});

describe('validation', () => {
  test('validateWheel throws DataError on unknown feeling id', () => {
    const bad = structuredClone(wheel);
    bad.children[0]!.feeling = 'nope';
    expect(() => validateWheel(bad, feelings)).toThrow(DataError);
  });

  test('validateWheel throws DataError on rings not ascending/contiguous', () => {
    const bad = structuredClone(wheel);
    bad.rings = [{ inner: 0.12, outer: 0.32 }, { inner: 0.4, outer: 0.62 }, { inner: 0.62, outer: 1 }];
    expect(() => validateWheel(bad, feelings)).toThrow(DataError);
    const bad2 = structuredClone(wheel);
    bad2.rings = [{ inner: 0.32, outer: 0.12 }, { inner: 0.12, outer: 0.62 }, { inner: 0.62, outer: 1 }];
    expect(() => validateWheel(bad2, feelings)).toThrow(DataError);
  });

  test('every feeling and every sensation id used has a locale label', () => {
    for (const id of Object.keys(feelings)) {
      expect(locale.feelings[id]?.label, id).toBeTruthy();
      for (const s of feelings[id]!.sensations) expect(locale.sensations[s], s).toBeTruthy();
    }
    const broken = structuredClone(locale);
    delete broken.feelings['angry'];
    expect(() => validateLocale(broken, feelings, wheel)).toThrow(DataError);
  });
});

describe('i18n', () => {
  test('t replaces {name} vars and returns key for missing', () => {
    setLocale(locale);
    expect(t('inPath', { label: 'Hostile', path: 'Angry, Aggressive' })).toBe('Hostile. In Angry, Aggressive.');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(t('definitely.missing')).toBe('definitely.missing');
    expect(warn).toHaveBeenCalledTimes(1);
    t('definitely.missing');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
