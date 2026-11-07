import { expect, test } from 'vitest';
import { keyToAction } from '../../src/input/keyboard';

test('keyToAction maps the spec §4.5 keys', () => {
  expect(keyToAction('ArrowUp')).toEqual({ type: 'step', delta: -1 });
  expect(keyToAction('ArrowDown')).toEqual({ type: 'step', delta: 1 });
  expect(keyToAction('ArrowRight')).toEqual({ type: 'toChild' });
  expect(keyToAction('ArrowLeft')).toEqual({ type: 'toParent' });
  expect(keyToAction('Escape')).toEqual({ type: 'escape' });
  expect(keyToAction('+')).toEqual({ type: 'zoomToggle' });
  expect(keyToAction('=')).toEqual({ type: 'zoomToggle' });
  expect(keyToAction('-')).toEqual({ type: 'zoomOut' });
  expect(keyToAction('Enter')).toBeNull();
  expect(keyToAction('a')).toBeNull();
});
