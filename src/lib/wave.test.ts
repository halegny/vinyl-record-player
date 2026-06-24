import { describe, expect, it } from 'vitest';
import { DEFAULT_WAVE, depthOpacity, depthScale, waveX } from './wave';

describe('waveX', () => {
  it('is zero at the rail center with no phase', () => {
    expect(waveX(0, 0)).toBeCloseTo(0);
  });

  it('never exceeds the configured amplitude', () => {
    for (let d = -1.5; d <= 1.5; d += 0.1) {
      for (let p = 0; p < Math.PI * 2; p += 0.3) {
        expect(Math.abs(waveX(d, p))).toBeLessThanOrEqual(DEFAULT_WAVE.amplitude + 1e-9);
      }
    }
  });

  it('shifts with scroll phase so the wave travels', () => {
    expect(waveX(0.25, 0)).not.toBeCloseTo(waveX(0.25, 1));
  });
});

describe('depth falloff', () => {
  it('is full scale and opacity at center', () => {
    expect(depthScale(0)).toBeCloseTo(1);
    expect(depthOpacity(0)).toBeCloseTo(1);
  });

  it('shrinks and fades toward the edges, monotonically', () => {
    expect(depthScale(1)).toBeLessThan(depthScale(0.2));
    expect(depthOpacity(1)).toBeLessThan(depthOpacity(0.2));
  });

  it('never fully disappears (keeps a readable floor)', () => {
    expect(depthOpacity(5)).toBeGreaterThanOrEqual(0.18);
  });
});
