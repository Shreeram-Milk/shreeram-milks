export const motion = {
  duration: { instant: 100, fast: 150, quick: 180, normal: 250, enter: 260, overlay: 300, slow: 400 },
  pressScale: { control: 0.97, compactControl: 0.94, card: 0.98 },
  overlayOpacity: 0.56,
  entranceOffset: 8,
  /** Gap between items that rise in one after another, and how many of them animate at most. */
  stagger: { stepMs: 35, maxItems: 8 },
  easing: {
    standard: [0.2, 0, 0, 1],
    decelerate: [0.05, 0.7, 0.1, 1],
    accelerate: [0.3, 0, 0.8, 0.15],
  },
  spring: {
    press: { damping: 18, stiffness: 320, mass: 0.6 },
    pop: { damping: 12, stiffness: 260, mass: 0.6 },
    sheet: { damping: 24, stiffness: 190, mass: 0.9, overshootClamping: true },
  },
} as const;
