import { findRecord } from '../data/records';
import { usePlayerStore } from '../store/usePlayerStore';

/** Brand + browsing hint (top-left) and the now-playing label (top-right). */
export function Hud() {
  const phase = usePlayerStore((s) => s.phase);
  const selectedId = usePlayerStore((s) => s.selectedId);
  const record = findRecord(selectedId);

  return (
    <>
      <header className="hud hud--tl">
        <div className="hud__brand">
          vinyl<span className="hud__dot">.</span>
        </div>
        <div className="hud__by">Built by Hale Gunay</div>
      </header>

      {record && phase !== 'browsing' && (
        <aside className="hud hud--tr">
          <span className="hud__nowlabel">{phase === 'playing' ? 'Now playing' : 'Cueing up'}</span>
          <span className="hud__title">{record.title}</span>
          <span className="hud__artist">
            {record.artist} · {record.album}
          </span>
        </aside>
      )}
    </>
  );
}
