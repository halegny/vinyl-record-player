import { describe, expect, it } from 'vitest';
import { easeInOut, lerp, quadBezier, type Vec3 } from './curve';

describe('quadBezier', () => {
  const p0: Vec3 = [0, 0, 0];
  const p1: Vec3 = [1, 2, 0];
  const p2: Vec3 = [2, 0, 0];

  it('hits the endpoints at t=0 and t=1', () => {
    expect(quadBezier(p0, p1, p2, 0)).toEqual(p0);
    expect(quadBezier(p0, p1, p2, 1)).toEqual(p2);
  });

  it('arcs above the chord at the midpoint', () => {
    const mid = quadBezier(p0, p1, p2, 0.5);
    expect(mid[0]).toBeCloseTo(1, 5); // halfway across
    expect(mid[1]).toBeGreaterThan(0); // lifted by the control point
  });
});

describe('easeInOut', () => {
  it('is pinned at 0 and 1 and clamps out-of-range input', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });

  it('is symmetric around the midpoint', () => {
    expect(easeInOut(0.25) + easeInOut(0.75)).toBeCloseTo(1, 5);
  });
});

describe('lerp', () => {
  it('interpolates linearly', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(2, 4, 0)).toBe(2);
    expect(lerp(2, 4, 1)).toBe(4);
  });
});
