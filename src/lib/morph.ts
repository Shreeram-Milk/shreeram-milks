import { Dimensions } from "react-native";

/** Where on screen a tapped card's picture was, and which picture, so the next page can fly that picture into place. */
export type MorphRect = { x: number; y: number; width: number; height: number; radius: number; imageUrl: string | null };

// One hand-off at a time: the card writes it just before opening the page, and the page takes it once.
let pending: { key: string; rect: MorphRect } | null = null;

/**
 * Room kept at the bottom of the screen for the tab bar and the phone's own bar. A card whose picture reaches into it is partly
 * hidden, so its page slides up normally instead: a picture flying out from under the bar would cut across it.
 */
const BOTTOM_RESERVE = 96;

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

/**
 * Measures a card's picture, remembers it for the page, then opens the page. A picture that is partly off screen or under the
 * bottom bar is not remembered (the page then slides up). Opens anyway if the picture cannot be measured.
 */
export function openFromCard(view: Measurable, key: string, radius: number, imageUrl: string | null, open: () => void): void {
  if (!view) { open(); return; }
  let opened = false;
  const go = () => { if (!opened) { opened = true; open(); } };
  view.measureInWindow((x, y, width, height) => {
    const screen = Dimensions.get("window");
    const fullyVisible = y >= 0 && x >= 0 && x + width <= screen.width + 1 && y + height <= screen.height - BOTTOM_RESERVE;
    if (fullyVisible) setMorphOrigin(key, { x, y, width, height, radius, imageUrl });
    go();
  });
  // Some views never answer; the page must still open.
  setTimeout(go, 120);
}
