// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest';
import { keyTarget, routeKey } from '../../src/input/route';

describe('routeKey', () => {
  test('button target: ArrowDown routes to step +1', () => {
    expect(routeKey('ArrowDown', 'button', false)).toEqual({ type: 'step', delta: 1 });
    expect(routeKey('ArrowUp', 'button', false)).toEqual({ type: 'step', delta: -1 });
    expect(routeKey('Escape', 'button', false)).toEqual({ type: 'escape' });
  });

  test('button target: Enter and Space are left to the button', () => {
    expect(routeKey('Enter', 'button', false)).toBeNull();
    expect(routeKey(' ', 'button', false)).toBeNull();
  });

  test('link target (spec v2.1 §6.3): Enter is left to the link; other keys still route', () => {
    expect(routeKey('Enter', 'link', false)).toBeNull();
    expect(routeKey('ArrowDown', 'link', false)).toEqual({ type: 'step', delta: 1 });
    expect(routeKey('Escape', 'link', false)).toEqual({ type: 'escape' });
  });

  test('keyTarget classifies a link with an href as link', () => {
    document.body.innerHTML = '<p><a href="#/body"><span>go</span></a><a>no href</a></p>';
    expect(keyTarget(document.querySelector('a[href] span'))).toBe('link');
    expect(keyTarget(document.querySelector('a:not([href])'))).toBe('other');
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

  test('single-character keys (+, =, −) are never routed: they work only with focus on the wheel (WCAG 2.1.4)', () => {
    for (const where of ['field', 'button', 'other'] as const) {
      for (const k of ['+', '=', '-']) expect(routeKey(k, where, false), `${k} ${where}`).toBeNull();
    }
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
