import { useCallback, useEffect, useRef } from 'react';
import { RecordItem, records } from '../data/records';
import { useCoverColor } from '../hooks/useCoverColor';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { DEFAULT_WAVE, depthOpacity, depthScale, waveX } from '../lib/wave';
import { usePlayerStore } from '../store/usePlayerStore';

/**
 * Left rail of albums as a vertical column of mini vinyl discs. On scroll the
 * column ripples into a travelling sine wave (math in lib/wave.ts), with items
 * receding toward the top and bottom edges. Selecting a disc drives the state
 * machine; the chosen record then flies into the deck (see FlyingVinyl).
 */
export function RecordRail() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const reduced = useReducedMotion();

  const phase = usePlayerStore((s) => s.phase);
  const selectedId = usePlayerStore((s) => s.selectedId);
  const select = usePlayerStore((s) => s.select);

  // Lock the rail only during the brief fly-in/out; otherwise you can pick any
  // other record to switch to it on the fly.
  const busy = phase === 'inserting' || phase === 'ejecting';

  /** Lay out every item from the current scroll position. */
  const layout = useCallback(() => {
    frame.current = null;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const railRect = scroller.getBoundingClientRect();
    const center = railRect.top + railRect.height / 2;
    const half = railRect.height / 2 || 1;
    // Phase advances with scroll so the wave appears to travel as you scroll.
    const phaseRad = scroller.scrollTop / 90;

    const items = scroller.querySelectorAll<HTMLElement>('.rail__item');
    items.forEach((item) => {
      const r = item.getBoundingClientRect();
      const itemCenter = r.top + r.height / 2;
      const distance = (itemCenter - center) / half;

      if (reduced) {
        item.style.transform = '';
        item.style.opacity = '1';
        return;
      }
      const x = waveX(distance, phaseRad, DEFAULT_WAVE);
      const scale = depthScale(distance);
      item.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) scale(${scale.toFixed(3)})`;
      item.style.opacity = depthOpacity(distance).toFixed(3);
    });
  }, [reduced]);

  const onScroll = useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(layout);
  }, [layout]);

  useEffect(() => {
    layout();
    window.addEventListener('resize', layout);
    return () => {
      window.removeEventListener('resize', layout);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [layout]);

  return (
    <nav className="rail" aria-label="Albums">
      <div className="rail__scroller" ref={scrollerRef} onScroll={onScroll}>
        <ul className="rail__list">
          {records.map((r) => (
            <RailItem
              key={r.id}
              record={r}
              selected={r.id === selectedId}
              disabled={busy || r.id === selectedId}
              onSelect={select}
            />
          ))}
        </ul>
      </div>
    </nav>
  );
}

interface RailItemProps {
  record: RecordItem;
  selected: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
}

/** A single rail disc; its accent glow uses the cover's auto-extracted color. */
function RailItem({ record, selected, disabled, onSelect }: RailItemProps) {
  const album = useCoverColor(record.cover, record.color);
  return (
    <li className="rail__item" data-rail-id={record.id}>
      <button
        type="button"
        className={`rail__btn${selected ? ' is-selected' : ''}`}
        onClick={() => onSelect(record.id)}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={`Play ${record.title} by ${record.artist}`}
        style={{ ['--album' as string]: album }}
      >
        <span className="rail__disc" aria-hidden="true">
          <span className="rail__grooves" />
          <span className="rail__label">
            <img src={record.cover} alt="" draggable={false} />
          </span>
        </span>
        <span className="rail__meta">
          <span className="rail__title">{record.title}</span>
          <span className="rail__artist">{record.artist}</span>
        </span>
      </button>
    </li>
  );
}
