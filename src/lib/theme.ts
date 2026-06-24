/**
 * Per-album color theming for the turntable. Each album carries one vibrant
 * dominant hex; from it we derive the full pastel palette seen in the reference
 * decks (light plinth, translucent tinted vinyl, dark ink) so the whole player
 * recolors from a single source value. All math is pure and unit-tested.
 */

export interface DeckTheme {
  /** Plinth body. */
  deck: string;
  /** Raised bevel highlight. */
  deckHi: string;
  /** Recessed edge / shadow. */
  deckLo: string;
  /** Vinyl base tint. */
  vinyl: string;
  /** Darker groove color, layered over the base for the record rings. */
  vinylGroove: string;
  /** Text / engraving on the deck. */
  ink: string;
  /** Saturated accent for glows and the now-playing dot. */
  glow: string;
}

export interface Hsl {
  h: number; // 0..360
  s: number; // 0..1
  l: number; // 0..1
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Parse `#rgb` or `#rrggbb` to HSL. Throws on malformed input. */
export function hexToHsl(hex: string): Hsl {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) throw new Error(`Invalid hex color: ${hex}`);
  const body = m[1].length === 3 ? m[1].replace(/(.)/g, '$1$1') : m[1];
  const r = parseInt(body.slice(0, 2), 16) / 255;
  const g = parseInt(body.slice(2, 4), 16) / 255;
  const b = parseInt(body.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

/** HSL back to `#rrggbb`. */
export function hslToHex({ h, s, l }: Hsl): string {
  s = clamp01(s);
  l = clamp01(l);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Build a deck theme from one dominant album color. */
export function themeFromColor(hex: string): DeckTheme {
  const { h } = hexToHsl(hex);
  return {
    deck: hslToHex({ h, s: 0.34, l: 0.82 }),
    deckHi: hslToHex({ h, s: 0.46, l: 0.91 }),
    deckLo: hslToHex({ h, s: 0.36, l: 0.64 }),
    vinyl: hslToHex({ h, s: 0.42, l: 0.56 }),
    vinylGroove: hslToHex({ h, s: 0.44, l: 0.38 }),
    ink: hslToHex({ h, s: 0.32, l: 0.24 }),
    glow: hslToHex({ h, s: 0.78, l: 0.6 }),
  };
}

/** Map a theme to the CSS custom properties consumed by the deck stylesheet. */
export function themeVars(t: DeckTheme): Record<string, string> {
  return {
    '--deck': t.deck,
    '--deck-hi': t.deckHi,
    '--deck-lo': t.deckLo,
    '--vinyl': t.vinyl,
    '--vinyl-groove': t.vinylGroove,
    '--ink': t.ink,
    '--glow': t.glow,
  };
}
