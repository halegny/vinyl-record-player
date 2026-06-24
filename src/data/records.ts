import type { Vec3 } from '../lib/curve';

export interface RecordItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  /** Square cover image, served from /public. */
  cover: string;
  /** Local audio file, served from /public. */
  audio: string;
  /**
   * Fallback dominant color, shown until the real one is auto-extracted from the
   * cover image at runtime (see lib/coverColor.ts). Swapping a cover re-themes
   * automatically; this value only needs to be roughly right for the first paint.
   */
  color: string;
}

/**
 * Albums + local audio borrowed from the MusicPlayer2024 sample. Dominant
 * colors are taken from that project's curated values.
 *
 * NOTE: these tracks/covers are copyrighted — fine for a local demo, but swap
 * in your own licensed audio before publishing.
 */
export const records: RecordItem[] = [
  {
    id: 'strokes',
    title: 'Last Nite',
    artist: 'The Strokes',
    album: 'Is This It (2001)',
    cover: '/covers/strokes.jpg',
    audio: '/audio/strokes.mp3',
    color: '#FDD94F',
  },
  {
    id: 'jennifer',
    title: 'On the Floor',
    artist: 'Jennifer Lopez',
    album: 'Love? (2011)',
    cover: '/covers/jennifer.png',
    audio: '/audio/jennifer.mp3',
    color: '#d94f9a',
  },
  {
    id: 'rihanna',
    title: 'We Found Love',
    artist: 'Rihanna',
    album: 'Talk That Talk (2011)',
    cover: '/covers/rihanna.webp',
    audio: '/audio/rihanna.mp3',
    color: '#8a9a5b',
  },
  {
    id: 'justin',
    title: 'Beauty and a Beat',
    artist: 'Justin Bieber, Nicki Minaj',
    album: 'Believe (2012)',
    cover: '/covers/justin.jpg',
    audio: '/audio/justin.mp3',
    color: '#4f9ad9',
  },
  {
    id: 'nelly',
    title: 'Promiscuous',
    artist: 'Nelly Furtado, Timbaland',
    album: 'Loose (2006)',
    cover: '/covers/nelly.webp',
    audio: '/audio/nelly.mp3',
    color: '#c0392b',
  },
  {
    id: 'plain',
    title: 'Hey There Delilah',
    artist: "Plain White T's",
    album: 'All That We Needed (2005)',
    cover: '/covers/plain.jpeg',
    audio: '/audio/plain.mp3',
    color: '#6b8e9e',
  },
  {
    id: 'natasha',
    title: 'Unwritten',
    artist: 'Natasha Bedingfield',
    album: 'Unwritten (2004)',
    cover: '/covers/natasha.jpeg',
    audio: '/audio/natasha.mp3',
    color: '#e0a73c',
  },
];

/** Base color of the dark room when nothing is playing. */
export const NEUTRAL_COLOR = '#1b1b2e';

export function findRecord(id: string | null): RecordItem | null {
  if (id === null) return null;
  return records.find((r) => r.id === id) ?? null;
}

export function recordIndex(id: string): number {
  return records.findIndex((r) => r.id === id);
}

export type { Vec3 };
