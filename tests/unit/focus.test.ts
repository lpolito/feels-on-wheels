// @vitest-environment happy-dom
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeEach, describe, expect, test } from 'vitest';
import { installFocusTracking, moveFocus } from '../../src/a11y/focus';

let btn: HTMLButtonElement;
let uninstall: (() => void) | undefined;
const press = (): boolean => document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
const key = (k = 'Tab'): boolean => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

beforeEach(() => {
  uninstall?.();
  document.body.replaceChildren();
  btn = document.createElement('button');
  document.body.append(btn);
  uninstall = installFocusTracking(document);
});

describe('moveFocus', () => {
  test('after a pointer press, it focuses and marks the element', () => {
    press();
    moveFocus(btn);
    expect(document.activeElement).toBe(btn);
    expect(btn.hasAttribute('data-quiet-focus')).toBe(true);
  });

  test('after a key, it focuses without marking', () => {
    key();
    moveFocus(btn);
    expect(document.activeElement).toBe(btn);
    expect(btn.hasAttribute('data-quiet-focus')).toBe(false);
  });

  test('with no input seen yet, it does not mark (fail safe)', () => {
    moveFocus(btn);
    expect(btn.hasAttribute('data-quiet-focus')).toBe(false);
  });

  test('a key clears the mark', () => {
    press();
    moveFocus(btn);
    key('ArrowDown');
    expect(btn.hasAttribute('data-quiet-focus')).toBe(false);
  });

  test('blur clears the mark, and a focus move after a key shows the ring', () => {
    press();
    moveFocus(btn);
    btn.blur();
    expect(btn.hasAttribute('data-quiet-focus')).toBe(false);
    key();
    moveFocus(btn);
    expect(btn.hasAttribute('data-quiet-focus')).toBe(false);
  });

  test('passes focus options through', () => {
    press();
    moveFocus(btn, { preventScroll: true });
    expect(document.activeElement).toBe(btn);
  });
});

test('no .focus( call in src bypasses moveFocus', () => {
  const root = join(__dirname, '../../src');
  const files = (readdirSync(root, { recursive: true }) as string[]).filter((f) => f.endsWith('.ts'));
  const offenders = files
    .filter((f) => relative('.', join('src', f)) !== join('src', 'a11y', 'focus.ts'))
    .filter((f) => {
      const code = readFileSync(join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      return /\.focus\(/.test(code);
    });
  expect(offenders).toEqual([]);
});
