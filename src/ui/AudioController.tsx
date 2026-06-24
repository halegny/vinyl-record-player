import { useEffect, useRef } from 'react';
import { findRecord } from '../data/records';
import { audioEngine } from '../lib/audioEngine';
import { usePlayerStore } from '../store/usePlayerStore';

/** Sound effect of a record being set down on the platter. */
const PLACEMENT_SFX = '/audio/record-being placed-on.wav';

/**
 * Headless bridge between the state machine and the local audio engine. The
 * "record placed" sound starts as the record drops into the deck (so the sound
 * and the placing motion happen together); when it finishes the needle drops and
 * the track starts. Pauses on eject and auto-ejects when the track ends. Visible
 * transport lives in <Controls/>.
 */
export function AudioController() {
  const phase = usePlayerStore((s) => s.phase);
  const selectedId = usePlayerStore((s) => s.selectedId);
  // Which record's placement is in progress, so the sound isn't restarted as the
  // flight transitions inserting -> seated, but DOES restart when switching to a
  // different record. Cleared once we return to browsing/eject.
  const placingIdRef = useRef<string | null>(null);

  useEffect(() => {
    audioEngine.onEnded(() => usePlayerStore.getState().eject());
    audioEngine.preloadSfx(PLACEMENT_SFX);
  }, []);

  useEffect(() => {
    const store = usePlayerStore.getState();
    const record = findRecord(selectedId);

    // Record begins dropping in (fresh selection or a switch): stop whatever was
    // playing, play the placement sound in sync with the flight, then start the
    // track once it finishes — unless the record changed/ejected meanwhile.
    if (phase === 'inserting' && record && placingIdRef.current !== record.id) {
      placingIdRef.current = record.id;
      audioEngine.pause();
      audioEngine.load(record.audio);
      audioEngine.playSfx(PLACEMENT_SFX).then(() => {
        const s = usePlayerStore.getState();
        if (s.phase === 'seated' && s.selectedId === record.id) s.play();
      });
    }

    if (phase === 'playing' && record) {
      audioEngine.load(record.audio);
      audioEngine
        .play()
        .then(() => store.setAudioPaused(false))
        .catch((err) => {
          console.warn('[audio] playback blocked:', err);
          store.setAudioPaused(true);
        });
    } else if (phase === 'browsing' || phase === 'ejecting') {
      audioEngine.pause();
      audioEngine.stopSfx();
      placingIdRef.current = null;
      store.setAudioPaused(true);
    }
  }, [phase, selectedId]);

  return null;
}
