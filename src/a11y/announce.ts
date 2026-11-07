/** Polite live-region announcer. Clears first so identical text is announced again. */
export function createAnnouncer(el: HTMLElement): (text: string) => void {
  let pending = 0;
  return (text) => {
    cancelAnimationFrame(pending);
    el.textContent = '';
    pending = requestAnimationFrame(() => {
      el.textContent = text;
    });
  };
}
