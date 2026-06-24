import { describe, expect, it } from 'vitest';
import { reduce, type Phase } from './usePlayerStore';

describe('state machine reduce()', () => {
  it('walks the happy path browsing -> ... -> browsing', () => {
    let phase: Phase = 'browsing';
    phase = reduce(phase, 'select')!;
    expect(phase).toBe('inserting');
    phase = reduce(phase, 'insertionComplete')!;
    expect(phase).toBe('seated');
    phase = reduce(phase, 'play')!;
    expect(phase).toBe('playing');
    phase = reduce(phase, 'eject')!;
    expect(phase).toBe('ejecting');
    phase = reduce(phase, 'ejectionComplete')!;
    expect(phase).toBe('browsing');
  });

  it('allows eject from inserting, seated and playing', () => {
    expect(reduce('inserting', 'eject')).toBe('ejecting');
    expect(reduce('seated', 'eject')).toBe('ejecting');
    expect(reduce('playing', 'eject')).toBe('ejecting');
  });

  it('allows reselect (switching records) from seated and playing only', () => {
    expect(reduce('seated', 'reselect')).toBe('inserting');
    expect(reduce('playing', 'reselect')).toBe('inserting');
    expect(reduce('browsing', 'reselect')).toBeNull();
    expect(reduce('inserting', 'reselect')).toBeNull();
    expect(reduce('ejecting', 'reselect')).toBeNull();
  });

  it('rejects illegal transitions as null', () => {
    expect(reduce('browsing', 'play')).toBeNull();
    expect(reduce('browsing', 'eject')).toBeNull();
    expect(reduce('playing', 'select')).toBeNull();
    expect(reduce('ejecting', 'play')).toBeNull();
    expect(reduce('seated', 'insertionComplete')).toBeNull();
  });
});
