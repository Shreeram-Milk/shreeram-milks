/** Where on screen a tapped card's picture was, so the next page can grow out of it. */
export type MorphRect = { x: number; y: number; width: number; height: number; radius: number };

// One hand-off at a time: the card writes it just before opening the page, and the page takes it once.
let pending: { key: string; rect: MorphRect } | null = null;

export function setMorphOrigin(key: string, rect: MorphRect): void {
  pending = { key, rect };
}

/** The rect for this page, or null when the page was opened some other way (a banner, a notification). */
export function takeMorphOrigin(key: string): MorphRect | null {
  if (!pending || pending.key !== key) return null;
  const { rect } = pending;
  pending = null;
  return rect.width > 0 && rect.height > 0 ? rect : null;
}

type Measurable = { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void } | null;

/** Measures a card's picture, remembers it for the page, then opens the page. Opens anyway if the picture cannot be measured. */
export function openFromCard(view: Measurable, key: string, radius: number, open: () => void): void {
  if (!view) { open(); return; }
  let opened = false;
  const go = () => { if (!opened) { opened = true; open(); } };
  view.measureInWindow((x, y, width, height) => {
    setMorphOrigin(key, { x, y, width, height, radius });
    go();
  });
  // Some views never answer; the page must still open.
  setTimeout(go, 120);
}
