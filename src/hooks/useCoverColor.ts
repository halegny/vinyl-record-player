import { useEffect, useState } from 'react';
import { extractDominantColor } from '../lib/coverColor';

/**
 * Live dominant color for a cover image. Returns the fallback immediately, then
 * swaps in the color extracted from the image once it loads — so swapping a
 * cover automatically re-themes the deck with no hand-coded hex. Pass src = null
 * to just hold the fallback (e.g. when nothing is selected).
 */
export function useCoverColor(src: string | null | undefined, fallback: string): string {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    setColor(fallback);
    if (!src) return;
    let alive = true;
    extractDominantColor(src)
      .then((c) => {
        if (alive) setColor(c);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      alive = false;
    };
  }, [src, fallback]);

  return color;
}
