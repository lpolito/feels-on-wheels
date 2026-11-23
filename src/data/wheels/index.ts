import core from './core.json';

/**
 * The wheels in switch order (spec v2 §7.1). The first is the default; `suggests` is the wheel its start message links to.
 * Temporary (opinionated wheel preview, 2026-11-23): the body wheel is off until it's mapped to the new feelings wheel;
 * add `{ wheel: body, suggests: 'core' }` back (importing './body.json') then.
 */
export const wheelSources: { wheel: unknown; suggests: string }[] = [
  { wheel: core, suggests: 'body' },
];
