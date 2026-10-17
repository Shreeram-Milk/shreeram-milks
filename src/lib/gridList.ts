/** An empty cell that keeps the last row of a grid the same width as the rows above it. */
export type GridSpacer = { id: string; spacer: true };

/** Fills the last row of a multi-column list with empty cells, so one leftover item stays half width instead of stretching across the screen. */
export function padToColumns<T extends { id: string }>(items: T[], columns = 2): (T | GridSpacer)[] {
  const remainder = items.length % columns;
  if (remainder === 0) return items;
  return [...items, ...Array.from({ length: columns - remainder }, (_unused, index): GridSpacer => ({ id: `spacer-${index}`, spacer: true }))];
}

export const isSpacer = (item: { id: string }): item is GridSpacer => "spacer" in item;
