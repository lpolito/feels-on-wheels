import body from './body.json';
import core from './core.json';

/** The wheels in switch order (spec v2 §7.1). The first is the default; `suggests` is the wheel its start message links to. */
export const wheelSources: { wheel: unknown; suggests: string }[] = [
  { wheel: core, suggests: 'body' },
  { wheel: body, suggests: 'core' },
];
