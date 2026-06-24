import { useEffect, useRef } from 'react';
import { findRecord } from '../data/records';
import { audioEngine } from '../lib/audioEngine';
import { useCoverColor } from '../hooks/useCoverColor';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { DeckTheme, themeFromColor, themeVars } from '../lib/theme';
import { usePlayerStore } from '../store/usePlayerStore';

/** Cool, light neutral deck shown while browsing (no album loaded). */
const NEUTRAL_THEME: DeckTheme = {
  deck: '#3a3a46',
  deckHi: '#4a4a58',
  deckLo: '#26262f',
  vinyl: '#1a1a20',
  vinylGroove: '#0d0d10',
  ink: '#aeb0bd',
  glow: '#6b6f86',
};

/**
 * The big flat top-down turntable, rebuilt in CSS to match the reference decks.
 * Recolors to the loaded album, spins the grooved vinyl while audio plays, and
 * drops the counterweighted tonearm onto the record when playback starts. The
 * record on the platter is hidden during inserting/ejecting — the FlyingVinyl
 * owns it then, and hands it back here once it lands.
 */
export function Turntable() {
  const deckRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const phase = usePlayerStore((s) => s.phase);
  const selectedId = usePlayerStore((s) => s.selectedId);
  const audioPaused = usePlayerStore((s) => s.audioPaused);

  const record = findRecord(selectedId);
  // Theme follows the cover's auto-extracted dominant color (falling back to the
  // record's seed color until the image is analyzed).
  const liveColor = useCoverColor(record?.cover ?? null, record?.color ?? '#888888');
  const themed = phase !== 'browsing' && record;
  const theme = themed ? themeFromColor(liveColor) : NEUTRAL_THEME;

  // The record sits on the platter once seated; in flight it lives in FlyingVinyl.
  const onPlatter = phase === 'seated' || phase === 'playing';
  const spinning = phase === 'playing' && !audioPaused;
  const armEngaged = phase === 'playing';

  // Pulse a --level variable from the live audio so the deck glows with the beat.
  useEffect(() => {
    if (reduced || !spinning) {
      deckRef.current?.style.setProperty('--level', '0');
      return;
    }
    let raf = 0;
    const tick = () => {
      deckRef.current?.style.setProperty('--level', audioEngine.getLevel().toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, spinning]);

  return (
    <div className="stage">
      <div
        className={`deck${themed ? ' is-themed' : ''}`}
        ref={deckRef}
        style={themeVars(theme)}
        data-phase={phase}
      >
        <span className="deck__screw deck__screw--tl" />
        <span className="deck__screw deck__screw--tr" />
        <span className="deck__screw deck__screw--bl" />
        <span className="deck__screw deck__screw--br" />

        <div className="platter">
          <div
            className={`vinyl${onPlatter ? ' is-on' : ''}${spinning ? ' is-spinning' : ''}`}
            data-platter
          >
            <span className="vinyl__grooves" />
            <span className="vinyl__sheen" />
            <span className="vinyl__label">
              {record && <img src={record.cover} alt="" draggable={false} />}
            </span>
            <span className="vinyl__spindle" />
          </div>
        </div>

        {/* Tonearm: the gimbal mount is fixed to the plinth; the arm group (tube +
            counterweight + headshell) swings around it onto the record on play. */}
        <span className="tonearm__base" />
        <div className={`tonearm${armEngaged ? ' is-engaged' : ''}`}>
          <span className="tonearm__weight" />
          <span className="tonearm__tube">
            <span className="tonearm__head" />
          </span>
          <span className="tonearm__pivot" />
        </div>

        {/* Controls deco (non-interactive — real transport lives in <Controls/>). */}
        <span className="deck__knob" aria-hidden="true">
          <span className="deck__knob-tick" />
        </span>
        <span className="deck__strobe" aria-hidden="true" />
        <span className="deck__buttons" aria-hidden="true">
          <span />
          <span />
        </span>
        <span className="deck__power" aria-hidden="true" />
        <span className="deck__brand">Vinyl</span>
      </div>
    </div>
  );
}
