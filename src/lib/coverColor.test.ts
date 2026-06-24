import { describe, expect, it } from 'vitest';
import { dominantColorFromPixels } from './coverColor';
import { hexToHsl } from './theme';

/** Build an RGBA buffer from a list of [r,g,b] pixels (alpha defaults to 255). */
function pixels(list: Array<[number, number, number, number?]>): Uint8ClampedArray {
  const data = new Uint8ClampedArray(list.length * 4);
  list.forEach(([r, g, b, a = 255], i) => {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  });
  return data;
}

const rep = (px: [number, number, number, number?], n: number) =>
  Array.from({ length: n }, () => px);

describe('dominantColorFromPixels', () => {
  it('picks a vivid splash over a large muddy background', () => {
    // 90 grey pixels (desaturated, skipped) + 10 vivid red → red should win.
    const data = pixels([...rep([130, 130, 130], 90), ...rep([220, 30, 30], 10)]);
    const { h } = hexToHsl(dominantColorFromPixels(data));
    // Red hue sits near 0/360.
    expect(Math.min(h, 360 - h)).toBeLessThan(20);
  });

  it('chooses the more frequent of two vivid colors', () => {
    const data = pixels([...rep([40, 80, 220], 70), ...rep([220, 40, 40], 15)]);
    const c = dominantColorFromPixels(data);
    const { h } = hexToHsl(c);
    expect(h).toBeGreaterThan(200); // blue
    expect(h).toBeLessThan(260);
  });

  it('falls back to the average when nothing is vibrant', () => {
    const data = pixels(rep([120, 120, 120], 50));
    expect(hexToHsl(dominantColorFromPixels(data)).s).toBeLessThan(0.1);
  });

  it('ignores transparent pixels', () => {
    const data = pixels([...rep([10, 200, 90, 0], 80), ...rep([200, 40, 160], 20)]);
    const { h } = hexToHsl(dominantColorFromPixels(data));
    expect(h).toBeGreaterThan(290); // magenta, not the transparent green
  });
});
