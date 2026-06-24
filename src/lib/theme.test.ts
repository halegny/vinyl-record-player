import { describe, expect, it } from 'vitest';
import { hexToHsl, hslToHex, themeFromColor, themeVars } from './theme';

describe('hexToHsl', () => {
  it('parses 6-digit and 3-digit hex equivalently', () => {
    expect(hexToHsl('#ffffff')).toEqual(hexToHsl('#fff'));
  });

  it('reads pure red as hue 0, full saturation, mid lightness', () => {
    const { h, s, l } = hexToHsl('#ff0000');
    expect(h).toBeCloseTo(0);
    expect(s).toBeCloseTo(1);
    expect(l).toBeCloseTo(0.5);
  });

  it('keeps greys desaturated', () => {
    expect(hexToHsl('#888888').s).toBeCloseTo(0);
  });

  it('throws on malformed input', () => {
    expect(() => hexToHsl('nope')).toThrow();
  });
});

describe('hslToHex', () => {
  it('round-trips a saturated color within rounding tolerance', () => {
    const hsl = hexToHsl('#4a90d9');
    const back = hexToHsl(hslToHex(hsl));
    expect(back.h).toBeCloseTo(hsl.h, 0);
    expect(back.s).toBeCloseTo(hsl.s, 1);
    expect(back.l).toBeCloseTo(hsl.l, 1);
  });

  it('clamps out-of-range lightness instead of producing junk', () => {
    expect(hslToHex({ h: 200, s: 0.5, l: 2 })).toBe('#ffffff');
    expect(hslToHex({ h: 200, s: 0.5, l: -1 })).toBe('#000000');
  });
});

describe('themeFromColor', () => {
  it('derives a lighter deck than the source vinyl tint', () => {
    const t = themeFromColor('#4a90d9');
    expect(hexToHsl(t.deck).l).toBeGreaterThan(hexToHsl(t.vinyl).l);
  });

  it('keeps every derived swatch on the source hue', () => {
    const srcHue = hexToHsl('#f77e7e').h;
    const t = themeFromColor('#f77e7e');
    for (const swatch of [t.deck, t.deckHi, t.deckLo, t.vinyl, t.vinylGroove, t.ink, t.glow]) {
      expect(hexToHsl(swatch).h).toBeCloseTo(srcHue, 0);
    }
  });

  it('exposes all CSS variables the deck stylesheet expects', () => {
    const vars = themeVars(themeFromColor('#fdd94f'));
    expect(Object.keys(vars).sort()).toEqual(
      ['--deck', '--deck-hi', '--deck-lo', '--glow', '--ink', '--vinyl', '--vinyl-groove'].sort(),
    );
  });
});
