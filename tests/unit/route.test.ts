// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest';
import { keyTarget, routeKey } from '../../src/input/route';

describe('routeKey', () => {
  test('button target: ArrowDown routes to step +1', () => {
    expect(routeKey('ArrowDown', 'button', false)).toEqual({ type: 'step', delta: 1 });
    expect(routeKey('ArrowUp', 'button', false)).toEqual({ type: 'step', delta: -1 });
    expect(routeKey('-', 'button', false)).toEqual({ type: 'stepOut' });
    expect(routeKey('+', 'button', false)).toEqual({ type: 'activate' });
    expect(routeKey('=', 'button', false)).toEqual({ type: 'activate' });
    expect(routeKey('Escape', 'button', false)).toEqual({ type: 'escape' });
  });

  test('button target: Enter and Space are left to the button', () => {
    expect(routeKey('Enter', 'button', false)).toBeNull();
    expect(routeKey(' ', 'button', false)).toBeNull();
  });

  test('field target: only Escape routes', () => {
    expect(routeKey('Escape', 'field', false)).toEqual({ type: 'escape' });
    for (const k of ['ArrowDown', 'ArrowLeft', 'Enter', ' ', '+', '-', '=']) expect(routeKey(k, 'field', false), k).toBeNull();
  });

  test('other target routes every mapped key', () => {
    expect(routeKey('Enter', 'other', false)).toEqual({ type: 'activate' });
    expect(routeKey('ArrowRight', 'other', false)).toEqual({ type: 'toChild' });
    expect(routeKey('a', 'other', false)).toBeNull();
  });

  test('modified keys are never routed', () => {
    for (const where of ['field', 'button', 'other'] as const) {
      expect(routeKey('Escape', where, true), where).toBeNull();
      expect(routeKey('ArrowDown', where, true), where).toBeNull();
    }
  });
});

test('keyTarget classifies input/select/textarea as field, button as button, li/body as other', () => {
  for (const tag of ['input', 'select', 'textarea']) expect(keyTarget(document.createElement(tag)), tag).toBe('field');
  expect(keyTarget(document.createElement('button'))).toBe('button');
  const button = document.createElement('button');
  const span = document.createElement('span');
  button.append(span);
  expect(keyTarget(span)).toBe('button');
  expect(keyTarget(document.createElement('li'))).toBe('other');
  expect(keyTarget(document.body)).toBe('other');
  expect(keyTarget(null)).toBe('other');
});
