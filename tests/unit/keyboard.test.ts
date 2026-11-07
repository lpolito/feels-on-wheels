import { expect, test } from 'vitest';
import { keyToAction } from '../../src/input/keyboard';

test('keyToAction maps the spec §3.5 keys', () => {
  expect(keyToAction('ArrowUp')).toEqual({ type: 'step', delta: -1 });
  expect(keyToAction('ArrowDown')).toEqual({ type: 'step', delta: 1 });
  expect(keyToAction('ArrowRight')).toEqual({ type: 'toChild' });
  expect(keyToAction('ArrowLeft')).toEqual({ type: 'toParent' });
  expect(keyToAction('Escape')).toEqual({ type: 'escape' });
  for (const k of ['Enter', ' ', '+', '=']) expect(keyToAction(k), k).toEqual({ type: 'activate' });
  expect(keyToAction('-')).toEqual({ type: 'stepOut' });
  expect(keyToAction('a')).toBeNull();
  expect(keyToAction('Tab')).toBeNull();
});
