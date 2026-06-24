import { useEffect, useRef, type CSSProperties } from 'react';
import { findRecord } from '../data/records';
import { useCoverColor } from '../hooks/useCoverColor';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { Vec3, easeInOut, lerp, quadBezier } from '../lib/curve';
import { themeFromColor } from '../lib/theme';
import { usePlayerStore } from '../store/usePlayerStore';

const FLIGHT_MS = 720;

interface Box {
  cx: number;
  cy: number;
  size: number;
}

function boxOf(el: Element | null): Box | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, size: r.width };
}

/**
 * Choreographs the record between the rail and the deck. On `inserting` a disc
 * arcs (quadratic Bézier) from the chosen rail item to the platter, growing as
 * it goes; on `ejecting` it arcs back. The flight drives the state machine: it
 * fires insertionComplete / ejectionComplete when it lands. Reduced-motion users
 * skip the arc but still advance the machine. The platter hides its own record
 * during flight (see Turntable), so the handoff reads as one continuous object.
 */
export function FlyingVinyl() {
  const discRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const reduced = useReducedMotion();

  const phase = usePlayerStore((s) => s.phase);
  const selectedId = usePlayerStore((s) => s.selectedId);
  const record = findRecord(selectedId);

  useEffect(() => {
    const flying = phase === 'inserting' || phase === 'ejecting';
    const disc = discRef.current;
    if (!flying || !disc || !selectedId) return;

    const store = usePlayerStore.getState();
    const finish = () => (phase === 'inserting' ? store.insertionComplete() : store.ejectionComplete());

    const railDisc = boxOf(document.querySelector(`[data-rail-id="${selectedId}"] .rail__disc`));
    const platter = boxOf(document.querySelector('[data-platter]'));
    if (!railDisc || !platter) {
      finish();
      return;
    }

    const [from, to] = phase === 'inserting' ? [railDisc, platter] : [platter, railDisc];
    const dir = phase === 'inserting' ? 1 : -1;

    const place = (cx: number, cy: number, size: number, spin: number, lift: number) => {
      disc.style.width = `${size}px`;
      disc.style.height = `${size}px`;
      disc.style.opacity = '1';
      disc.style.transform =
        `translate3d(${(cx - size / 2).toFixed(2)}px, ${(cy - size / 2).toFixed(2)}px, 0)` +
        ` rotate(${spin.toFixed(1)}deg) scale(${lift.toFixed(3)})`;
    };

    if (reduced) {
      place(to.cx, to.cy, to.size, 0, 1);
      const id = window.setTimeout(() => {
        disc.style.opacity = '0';
        finish();
      }, 60);
      return () => window.clearTimeout(id);
    }

    // Arc up and over: control point is the midpoint, raised by a fraction of the span.
    const span = Math.hypot(to.cx - from.cx, to.cy - from.cy);
    const ctrl: Vec3 = [(from.cx + to.cx) / 2, Math.min(from.cy, to.cy) - span * 0.32 - 80, 0];
    const p0: Vec3 = [from.cx, from.cy, 0];
    const p1: Vec3 = [to.cx, to.cy, 0];

    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const raw = Math.min(1, (now - start) / FLIGHT_MS);
      const t = easeInOut(raw);
      const [x, y] = quadBezier(p0, ctrl, p1, t);
      const size = lerp(from.size, to.size, t);
      const spin = dir * t * 200;
      const lift = 1 + Math.sin(t * Math.PI) * 0.06; // gentle hop at the apex
      place(x, y, size, spin, lift);

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        disc.style.opacity = '0';
        finish();
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // Re-run only when the phase flips into/out of a flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const liveColor = useCoverColor(record?.cover ?? null, record?.color ?? '#888888');
  const discStyle: CSSProperties | undefined = record
    ? ({ ['--vinyl' as string]: themeFromColor(liveColor).vinyl } as CSSProperties)
    : undefined;

  return (
    <div className="flyer" aria-hidden="true">
      <div className="flyer__disc" ref={discRef} style={discStyle}>
        <span className="vinyl__grooves" />
        <span className="vinyl__sheen" />
        <span className="vinyl__label">{record && <img src={record.cover} alt="" />}</span>
        <span className="vinyl__spindle" />
      </div>
    </div>
  );
}
