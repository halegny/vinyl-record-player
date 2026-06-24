import { create } from 'zustand';

/**
 * Interaction phases. The flow is:
 *   browsing -> inserting -> seated -> playing -> ejecting -> browsing
 *
 * Transitions are centralized in TRANSITIONS so illegal moves are no-ops and
 * the logic stays testable (see usePlayerStore.test.ts).
 */
export type Phase = 'browsing' | 'inserting' | 'seated' | 'playing' | 'ejecting';

export type PlayerAction =
  | 'select'
  | 'reselect'
  | 'insertionComplete'
  | 'play'
  | 'eject'
  | 'ejectionComplete';

const TRANSITIONS: Record<Phase, Partial<Record<PlayerAction, Phase>>> = {
  browsing: { select: 'inserting' },
  inserting: { insertionComplete: 'seated', eject: 'ejecting' },
  // `reselect` lets the user swap to a different record on the fly — it sends the
  // deck back through insertion with the newly chosen record.
  seated: { play: 'playing', eject: 'ejecting', reselect: 'inserting' },
  playing: { eject: 'ejecting', reselect: 'inserting' },
  ejecting: { ejectionComplete: 'browsing' },
};

/** Pure transition function. Returns the next phase, or null if illegal. */
export function reduce(phase: Phase, action: PlayerAction): Phase | null {
  return TRANSITIONS[phase][action] ?? null;
}

interface PlayerStore {
  phase: Phase;
  selectedId: string | null;
  /** Mirrors real audio playback so the platter only spins when sound plays. */
  audioPaused: boolean;
  select: (id: string) => void;
  play: () => void;
  eject: () => void;
  /** Driven by the fly-in spring reaching its rest position. */
  insertionComplete: () => void;
  /** Driven by the eject spring returning the record to the shelf. */
  ejectionComplete: () => void;
  setAudioPaused: (paused: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => {
  /** Apply an action through the guarded state machine. Returns success. */
  function dispatch(action: PlayerAction): boolean {
    const next = reduce(get().phase, action);
    if (next === null) return false;
    set({ phase: next });
    return true;
  }

  return {
    phase: 'browsing',
    selectedId: null,
    audioPaused: true,

    select: (id) => {
      const { phase, selectedId } = get();
      if (phase === 'browsing') {
        set({ selectedId: id });
        dispatch('select');
        return;
      }
      // A record is already loaded: switch to a different one mid-session.
      if (id === selectedId) return;
      set({ selectedId: id, audioPaused: true });
      dispatch('reselect');
    },

    play: () => {
      // Optimistically mark as playing so the platter spins immediately; the
      // audio engine will correct this if playback is blocked.
      if (dispatch('play')) set({ audioPaused: false });
    },

    eject: () => {
      if (dispatch('eject')) set({ audioPaused: true });
    },

    insertionComplete: () => {
      dispatch('insertionComplete');
    },

    ejectionComplete: () => {
      if (dispatch('ejectionComplete')) set({ selectedId: null });
    },

    setAudioPaused: (paused) => set({ audioPaused: paused }),
  };
});
