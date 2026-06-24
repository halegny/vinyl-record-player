/**
 * Pure layout math for the left record rail. As the rail scrolls, each item is
 * pushed horizontally by a sine of its distance from the rail's vertical center
 * (plus a scroll-driven phase), so the column ripples like a travelling wave.
 * Items also recede — shrinking and fading — toward the top and bottom edges.
 * Kept pure and framework-free so it can be unit-tested in isolation.
 */

export interface WaveParams {
  /** Peak horizontal push, in pixels. */
  amplitude: number;
  /** Number of half-waves across one rail height. */
  waves: number;
}

export const DEFAULT_WAVE: WaveParams = { amplitude: 54, waves: 2.2 };

/**
 * Horizontal offset (px) for an item.
 * @param distance normalized vertical distance from rail center, roughly [-1, 1].
 * @param phase    scroll-driven phase in radians, so the wave travels on scroll.
 */
export function waveX(distance: number, phase: number, p: WaveParams = DEFAULT_WAVE): number {
  return p.amplitude * Math.sin(distance * Math.PI * p.waves + phase);
}

/** Depth scale for an item: 1 at center, shrinking toward the edges. */
export function depthScale(distance: number): number {
  const d = Math.min(1.4, Math.abs(distance));
  return 1 - d * 0.16;
}

/** Opacity for an item: full at center, fading toward the edges. */
export function depthOpacity(distance: number): number {
  const d = Math.min(1.4, Math.abs(distance));
  return Math.max(0.18, 1 - d * 0.52);
}
