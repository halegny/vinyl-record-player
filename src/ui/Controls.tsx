import { audioEngine } from '../lib/audioEngine';
import { usePlayerStore } from '../store/usePlayerStore';

/** Transport (play/pause) and eject, shown whenever a record is out of its sleeve. */
export function Controls() {
  const phase = usePlayerStore((s) => s.phase);
  const audioPaused = usePlayerStore((s) => s.audioPaused);
  const eject = usePlayerStore((s) => s.eject);
  const setAudioPaused = usePlayerStore((s) => s.setAudioPaused);

  if (phase === 'browsing') return null;

  const togglePlay = () => {
    if (audioPaused) {
      audioEngine
        .play()
        .then(() => setAudioPaused(false))
        .catch(() => undefined);
    } else {
      audioEngine.pause();
      setAudioPaused(true);
    }
  };

  return (
    <div className="controls">
      {phase === 'playing' && (
        <button className="btn" onClick={togglePlay} aria-label={audioPaused ? 'Play' : 'Pause'}>
          <span aria-hidden="true">{audioPaused ? '▶' : '⏸'}</span>{' '}
          {audioPaused ? 'Play' : 'Pause'}
        </button>
      )}
      <button className="btn" onClick={eject} aria-label="Eject record and return to wall">
        <span aria-hidden="true">⏏</span> Eject
      </button>
    </div>
  );
}
