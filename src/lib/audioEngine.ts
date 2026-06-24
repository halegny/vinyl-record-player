/**
 * Single shared local-audio engine built on the Web Audio API. One reused
 * <audio> element is routed through an AnalyserNode so the visuals can react to
 * the actual sound (see getLevel). createMediaElementSource may only be called
 * once per element, so the graph is built lazily after the first user gesture
 * (required by browser autoplay policy anyway).
 */
class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freq: Uint8Array<ArrayBuffer> | null = null;
  private currentUrl: string | null = null;
  private endedCb: (() => void) | null = null;
  private smoothed = 0;
  /** One-shot sound effects (e.g. placing the record), kept off the analyser graph. */
  private sfx: HTMLAudioElement | null = null;
  /** Resolves/cleans up the in-flight sfx promise (used to cancel on re-entry). */
  private sfxDone: (() => void) | null = null;

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.addEventListener('ended', () => this.endedCb?.());
      this.audio = audio;
    }
    return this.audio;
  }

  private ensureGraph() {
    if (this.ctx) return;
    const audio = this.ensureAudio();
    const Ctor: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    this.ctx = ctx;
    this.analyser = analyser;
    this.freq = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  }

  load(url: string) {
    const audio = this.ensureAudio();
    if (this.currentUrl === url) return;
    this.currentUrl = url;
    audio.src = url;
  }

  async play(): Promise<void> {
    this.ensureGraph();
    await this.ctx?.resume();
    await this.ensureAudio().play();
  }

  pause() {
    this.audio?.pause();
  }

  /** Warm the sfx element so the first placement plays without a fetch gap. */
  preloadSfx(url: string) {
    const el = this.sfx ?? (this.sfx = new Audio());
    el.preload = 'auto';
    el.src = encodeURI(url);
  }

  /**
   * Play a one-shot sound effect to completion. Resolves when it ends (or
   * immediately if playback is blocked/fails), so callers can chain the next
   * step — e.g. start the track once the "record placed" thunk has finished.
   */
  playSfx(url: string): Promise<void> {
    this.sfxDone?.(); // cancel any sfx already in flight (e.g. switching records)
    const el = this.sfx ?? (this.sfx = new Audio());
    el.src = encodeURI(url); // tolerate spaces in the filename
    el.currentTime = 0;
    return new Promise((resolve) => {
      const done = () => {
        el.removeEventListener('ended', done);
        el.removeEventListener('error', done);
        if (this.sfxDone === done) this.sfxDone = null;
        resolve();
      };
      this.sfxDone = done;
      el.addEventListener('ended', done);
      el.addEventListener('error', done);
      el.play().catch(done);
    });
  }

  stopSfx() {
    this.sfxDone?.();
    this.sfx?.pause();
  }

  get paused(): boolean {
    return this.audio?.paused ?? true;
  }

  onEnded(cb: () => void) {
    this.endedCb = cb;
  }

  /**
   * Smoothed loudness in [0, 1]. Call once per animation frame. Returns 0 until
   * the graph exists (i.e. before the first play).
   */
  getLevel(): number {
    if (!this.analyser || !this.freq) return 0;
    this.analyser.getByteFrequencyData(this.freq);
    let sum = 0;
    for (let i = 0; i < this.freq.length; i++) sum += this.freq[i] ?? 0;
    const avg = sum / this.freq.length / 255;
    this.smoothed += (avg - this.smoothed) * 0.25;
    return this.smoothed;
  }
}

export const audioEngine = new AudioEngine();
