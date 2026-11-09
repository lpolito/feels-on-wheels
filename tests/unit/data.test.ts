import { describe, expect, test, vi } from 'vitest';
import { DataError, loadData, nodeRef, validateLocale, validateWheel } from '../../src/data/load';
import { wheelSources } from '../../src/data/wheels/index';
import type { Wheel, WheelNode } from '../../src/data/types';
import { label, setLocale, t } from '../../src/i18n';

const { wheel, wheels, feelings, locale } = loadData();
const body = wheels.find((w) => w.id === 'body')!;
const ids = () => ({ sensations: new Set(Object.keys(locale.sensations)), areas: new Set(Object.keys(locale.areas)) });

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
    expect(wheel.children.map((n) => nodeRef(n).id)).toEqual([
      'fearful', 'angry', 'disgusted', 'sad', 'happy', 'surprised', 'bad',
    ]);
  });

  test('every node feeling exists in feelings.json', () => {
    walk(wheel.children, 0, (n) => expect(feelings[nodeRef(n).id], nodeRef(n).id).toBeDefined());
  });

  test('only depth-0 nodes declare hue and every core has one', () => {
    walk(wheel.children, 0, (n, d) => {
      if (d === 0) expect(n.hue, nodeRef(n).id).toBeTruthy();
      else expect(n.hue, nodeRef(n).id).toBeUndefined();
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
    walk(wheel.children, 0, (n) => uses.set(nodeRef(n).id, (uses.get(nodeRef(n).id) ?? 0) + 1));
    for (const id of ['overwhelmed', 'embarrassed', 'inferior', 'disappointed']) {
      expect(uses.get(id), id).toBe(2);
    }
  });
});

describe('validation', () => {
  test('validateWheel throws DataError on unknown feeling id', () => {
    const bad = structuredClone(wheel);
    bad.children[0]!.feeling = 'nope';
    expect(() => validateWheel(bad, feelings, ids())).toThrow(DataError);
  });

  test('validateWheel throws DataError on rings not ascending/contiguous', () => {
    const bad = structuredClone(wheel);
    bad.rings = [{ inner: 0.12, outer: 0.32 }, { inner: 0.4, outer: 0.62 }, { inner: 0.62, outer: 1 }];
    expect(() => validateWheel(bad, feelings, ids())).toThrow(DataError);
    const bad2 = structuredClone(wheel);
    bad2.rings = [{ inner: 0.32, outer: 0.12 }, { inner: 0.12, outer: 0.62 }, { inner: 0.62, outer: 1 }];
    expect(() => validateWheel(bad2, feelings, ids())).toThrow(DataError);
  });

  test('every feeling and every sensation id used has a locale label', () => {
    for (const id of Object.keys(feelings)) {
      expect(locale.feelings[id]?.label, id).toBeTruthy();
      for (const s of feelings[id]!.sensations) expect(locale.sensations[s], s).toBeTruthy();
    }
    const broken = structuredClone(locale);
    delete broken.feelings['angry'];
    expect(() => validateLocale(broken, feelings, wheels)).toThrow(DataError);
  });
});

const AREAS: [string, string[]][] = [
  ['head', ['headache', 'foggy-head', 'tired-eyes', 'wide-eyes', 'raised-eyebrows', 'tearful']],
  ['face', ['hot-face', 'blushing', 'scrunched-face', 'clenched-jaw', 'smiling']],
  ['chest', ['racing-heart', 'tight-chest', 'hollow-chest', 'warm-chest']],
  ['breath', ['shallow-breath', 'deep-breath', 'gasp', 'lump-in-throat']],
  ['stomach', ['knot-in-stomach', 'nausea', 'butterflies']],
  ['arms', ['tense-shoulders', 'heavy-limbs', 'clenched-fists', 'sweaty-palms', 'cold-hands', 'trembling']],
  ['whole-body', ['restless', 'fidgety', 'frozen', 'low-energy', 'numbness', 'light-body', 'buzzing', 'relaxed-muscles']],
  ['posture', ['slumped', 'open-posture', 'turning-away', 'shrinking']],
];

describe('body wheel data', () => {
  test('body wheel has 8 areas and 40 sensations, in spec §3.2 order', () => {
    expect(body.children.map((n) => nodeRef(n))).toEqual(AREAS.map(([id]) => ({ kind: 'area', id })));
    body.children.forEach((a, i) => {
      expect((a.children ?? []).map((n) => nodeRef(n)), AREAS[i]![0]).toEqual(AREAS[i]![1].map((id) => ({ kind: 'sensation', id })));
    });
    expect(body.children.flatMap((a) => a.children ?? []).length).toBe(40);
  });

  test('body wheel: every sensation has 2 or 3 feeling children, each a known feeling', () => {
    for (const s of body.children.flatMap((a) => a.children ?? [])) {
      const kids = s.children ?? [];
      expect(kids.length, nodeRef(s).id).toBeGreaterThanOrEqual(2);
      expect(kids.length, nodeRef(s).id).toBeLessThanOrEqual(3);
      for (const k of kids) {
        expect(nodeRef(k).kind).toBe('feeling');
        expect(feelings[nodeRef(k).id], nodeRef(k).id).toBeDefined();
        expect(k.children).toBeUndefined();
      }
    }
  });

  test('the wheel list is core then body; each suggests the other', () => {
    expect(wheels.map((w) => w.id)).toEqual(['core', 'body']);
    expect(loadData().suggests).toEqual({ core: 'body', body: 'core' });
    expect(loadData().wheel).toBe(loadData().wheels[0]);
  });
});

describe('validateWheel: node kinds', () => {
  const cases: [string, (w: typeof body) => void][] = [
    ['no kind', (w) => { delete w.children[0]!.area; }],
    ['two kinds', (w) => { w.children[0]!.feeling = 'angry'; }],
    ['unknown area', (w) => { w.children[0]!.area = 'elbow'; }],
    ['unknown sensation', (w) => { w.children[0]!.children![0]!.sensation = 'itchy'; }],
    ['unknown feeling', (w) => { w.children[0]!.children![0]!.children![0]!.feeling = 'nope'; }],
    ['hue off the centre', (w) => { w.children[0]!.children![0]!.hue = 'head'; }],
    ['centre without hue', (w) => { delete w.children[0]!.hue; }],
  ];
  for (const [name, mutate] of cases) {
    test(`validateWheel rejects ${name}`, () => {
      const bad = structuredClone(body);
      mutate(bad);
      expect(() => validateWheel(bad, feelings, ids())).toThrow(DataError);
    });
  }

  test('the real body wheel validates', () => {
    expect(() => validateWheel(structuredClone(body), feelings, ids())).not.toThrow();
  });
});

describe('loadData and validateLocale: wheels', () => {
  test('loadData rejects duplicate wheel ids', () => {
    expect(() => loadData([wheelSources[0]!, { ...wheelSources[0]!, suggests: 'core' }])).toThrow(DataError);
  });

  test('validateLocale rejects a missing wheels entry', () => {
    const broken = structuredClone(locale);
    delete broken.wheels['body'];
    expect(() => validateLocale(broken, feelings, wheels)).toThrow(DataError);
    const partial = structuredClone(locale);
    partial.wheels['body'] = { ...partial.wheels['body']!, hintLink: '' };
    expect(() => validateLocale(partial, feelings, wheels)).toThrow(DataError);
  });

  test('every core feeling has kind with one {link} and a kindLink (spec v2.2 §4.4)', () => {
    for (const n of wheel.children) {
      const f = locale.feelings[n.feeling!]!;
      expect(f.kind, n.feeling).toMatch(/^[^{]*\{link\}[^{]*$/);
      expect(f.kindLink, n.feeling).toBeTruthy();
    }
  });

  test('each wheel\'s message has its question as hintTitle (spec v2.2 §5)', () => {
    expect(locale.wheels['core']!.hintTitle).toBe('How are you feeling?');
    expect(locale.wheels['body']!.hintTitle).toBe('What do you notice in your body?');
    expect(locale.wheels['core']!.hint).toBe('Tap or spin to explore, or {link}.');
    expect(locale.wheels['body']!.hint).toBe('Tap or spin to explore, or {link}.');
    const partial = structuredClone(locale);
    partial.wheels['body'] = { ...partial.wheels['body']!, hintTitle: '' };
    expect(() => validateLocale(partial, feelings, wheels)).toThrow(/hintTitle/);
  });

  test('angry takes "An", happy takes "A"', () => {
    expect(locale.feelings['angry']!.kind).toBe('An {link} feeling.');
    expect(locale.feelings['happy']!.kind).toBe('A {link} feeling.');
    expect(locale.feelings['happy']!.kindLink).toBe('happy');
  });

  test('validateLocale rejects a core feeling without kind, kindLink or exactly one {link}', () => {
    const noKind = structuredClone(locale);
    delete noKind.feelings['fearful']!.kind;
    expect(() => validateLocale(noKind, feelings, wheels)).toThrow(/fearful.*kind/);
    const noLink = structuredClone(locale);
    noLink.feelings['fearful']!.kindLink = '';
    expect(() => validateLocale(noLink, feelings, wheels)).toThrow(/fearful.*kindLink/);
    const twice = structuredClone(locale);
    twice.feelings['fearful']!.kind = 'A {link} {link} feeling.';
    expect(() => validateLocale(twice, feelings, wheels)).toThrow(/fearful.*kind/);
  });

  test('validateLocale accepts switchName and rejects an empty one', () => {
    const named = structuredClone(locale);
    named.wheels['body'] = { ...named.wheels['body']!, switchName: 'Body sensations' };
    expect(() => validateLocale(named, feelings, wheels)).not.toThrow();
    const empty = structuredClone(locale);
    empty.wheels['body'] = { ...empty.wheels['body']!, switchName: '' };
    expect(() => validateLocale(empty, feelings, wheels)).toThrow(/switchName/);
  });

  test('validateLocale rejects a missing area label', () => {
    const broken = structuredClone(locale);
    delete broken.areas['chest'];
    expect(() => validateLocale(broken, feelings, wheels)).toThrow(DataError);
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
