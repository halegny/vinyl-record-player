import { Atmosphere } from './ui/Atmosphere';
import { RecordRail } from './ui/RecordRail';
import { Turntable } from './ui/Turntable';
import { FlyingVinyl } from './ui/FlyingVinyl';
import { Hud } from './ui/Hud';
import { Controls } from './ui/Controls';
import { AudioController } from './ui/AudioController';

export default function App() {
  return (
    <>
      <Atmosphere />
      <div className="layout">
        <RecordRail />
        <main className="main">
          <Hud />
          <Turntable />
          <Controls />
        </main>
      </div>
      <FlyingVinyl />
      <AudioController />
    </>
  );
}
