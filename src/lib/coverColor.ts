/**
 * Automatic dominant-color extraction from cover art, so the deck/background
 * theme follows whatever image a record points at — no hand-tuned hex needed.
 *
 * The pixel analysis (`dominantColorFromPixels`) is pure and unit-tested; the
 * `extractDominantColor` wrapper just rasterizes the image to a small canvas and
 * hands the pixels over. Results are cached (and in-flight loads de-duped) so each
 * cover is analyzed at most once.
 */

function rgbToSl(r: number, g: number, b: number): { s: number; l: number } {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2 / 255;
  const d = mx - mn;
  const s = d === 0 ? 0 : d / (255 - Math.abs(mx + mn - 255));
  return { s, l };
}

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');

interface Bucket {
  count: number;
  r: number;
  g: number;
  b: number;
  sat: number;
}

/**
 * Pick a representative vibrant color from raw RGBA pixels. Colors are quantized
 * into coarse buckets; the winning bucket maximizes frequency weighted by
 * saturation (so a small splash of vivid color beats a large muddy background),
 * while skipping near-black, near-white, transparent, and washed-out pixels. If
 * nothing vibrant exists, falls back to the overall average.
 */
export function dominantColorFromPixels(data: Uint8ClampedArray): string {
  const vivid = new Map<number, Bucket>();
  let aR = 0;
  let aG = 0;
  let aB = 0;
  let aN = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const a = data[i + 3] ?? 0;
    if (a < 125) continue;

    aR += r;
    aG += g;
    aB += b;
    aN++;

    const { s, l } = rgbToSl(r, g, b);
    if (s < 0.18 || l < 0.12 || l > 0.9) continue; // not a vibrant candidate

    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bk = vivid.get(key);
    if (bk) {
      bk.count++;
      bk.r += r;
      bk.g += g;
      bk.b += b;
      bk.sat += s;
    } else {
      vivid.set(key, { count: 1, r, g, b, sat: s });
    }
  }

  let best: Bucket | null = null;
  let bestScore = 0;
  for (const bk of vivid.values()) {
    const score = bk.count * (0.3 + bk.sat / bk.count);
    if (score > bestScore) {
      bestScore = score;
      best = bk;
    }
  }

  if (best) {
    return `#${hex2(best.r / best.count)}${hex2(best.g / best.count)}${hex2(best.b / best.count)}`;
  }
  if (aN > 0) return `#${hex2(aR / aN)}${hex2(aG / aN)}${hex2(aB / aN)}`;
  return '#888888';
}

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

/** Extract (and cache) the dominant color of an image URL. */
export function extractDominantColor(src: string): Promise<string> {
  const hit = cache.get(src);
  if (hit) return Promise.resolve(hit);
  const inflight = pending.get(src);
  if (inflight) return inflight;

  const p = new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('2d context unavailable');
        ctx.drawImage(img, 0, 0, size, size);
        const color = dominantColorFromPixels(ctx.getImageData(0, 0, size, size).data);
        cache.set(src, color);
        resolve(color);
      } catch (err) {
        reject(err);
      } finally {
        pending.delete(src);
      }
    };
    img.onerror = () => {
      pending.delete(src);
      reject(new Error(`Failed to load ${src}`));
    };
    img.src = src;
  });
  pending.set(src, p);
  return p;
}
