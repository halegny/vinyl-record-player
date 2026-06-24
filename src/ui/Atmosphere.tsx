import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { NEUTRAL_COLOR, findRecord } from '../data/records';
import { audioEngine } from '../lib/audioEngine';
import { useCoverColor } from '../hooks/useCoverColor';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { usePlayerStore } from '../store/usePlayerStore';

const BLOB_COUNT = 7;

/**
 * Retro-luxe background ported from the MusicPlayer2024 sample, adapted to
 * React: GSAP-morphed lava blobs (gooey SVG filter + blur), dual film-grain
 * overlays, a vignette, and a low-res TV-static canvas. The blobs take the
 * current album's color and the whole field pulses to the live audio level.
 */
export function Atmosphere() {
  const lavaRef = useRef<HTMLDivElement>(null);
  const staticRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<HTMLDivElement[]>([]);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  const reduced = useReducedMotion();
  const phase = usePlayerStore((s) => s.phase);
  const selectedId = usePlayerStore((s) => s.selectedId);

  const record = findRecord(selectedId);
  const liveColor = useCoverColor(record?.cover ?? null, record?.color ?? NEUTRAL_COLOR);
  const active = phase === 'inserting' || phase === 'seated' || phase === 'playing';
  const color = (active && record && liveColor) || NEUTRAL_COLOR;

  // ── Create the blobs once ──
  useEffect(() => {
    const lava = lavaRef.current;
    if (!lava) return;
    const isMobile = window.innerWidth <= 600;
    const blobs: HTMLDivElement[] = [];

    for (let i = 0; i < BLOB_COUNT; i++) {
      const blob = document.createElement('div');
      blob.className = 'lava-blob';
      const clusterX = ((i % 3) - 1) * (isMobile ? 25 : 20) + 50;
      const clusterY = 30 + ((i * 7) % 40);
      gsap.set(blob, { left: `${clusterX}%`, top: `${clusterY}%`, xPercent: -50, yPercent: -50 });
      lava.appendChild(blob);
      blobs.push(blob);
    }
    blobsRef.current = blobs;
    gsap.set(blobs, { opacity: 0, scale: 0 });

    return () => {
      tweensRef.current.forEach((t) => t.kill());
      tweensRef.current = [];
      blobs.forEach((b) => b.remove());
      blobsRef.current = [];
    };
  }, []);

  // ── Color follows the current album ──
  useEffect(() => {
    if (!blobsRef.current.length) return;
    gsap.to(blobsRef.current, { background: color, duration: 1.2, ease: 'power2.out' });
  }, [color]);

  // ── Show / hide the lava field with the play state ──
  useEffect(() => {
    const blobs = blobsRef.current;
    if (!blobs.length) return;

    tweensRef.current.forEach((t) => t.kill());
    tweensRef.current = [];

    if (!active) {
      blobs.forEach((blob, i) => {
        gsap.to(blob, {
          opacity: 0,
          scale: 0,
          duration: 0.8 + i * 0.1,
          ease: 'power2.in',
          onComplete: () => {
            blob.style.borderRadius = '';
            blob.style.width = '';
            blob.style.height = '';
            blob.style.transform = '';
          },
        });
      });
      return;
    }

    const isMobile = window.innerWidth <= 600;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    blobs.forEach((blob, i) => {
      const size = isMobile ? 120 + Math.random() * 120 : 140 + Math.random() * 220;
      gsap.set(blob, { width: size, height: size });
      gsap.to(blob, {
        opacity: 0.5 + Math.random() * 0.2,
        scale: 1,
        duration: 1.2 + i * 0.12,
        ease: 'power3.out',
      });

      if (reduced) return; // no perpetual motion under reduced-motion

      const rangeX = (isMobile ? 0.4 : 0.35) * vw;
      const rangeY = (isMobile ? 0.35 : 0.3) * vh;

      tweensRef.current.push(
        gsap.to(blob, {
          x: () => (Math.random() - 0.5) * rangeX,
          y: () => (Math.random() - 0.5) * rangeY,
          duration: () => 5 + Math.random() * 5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.3,
        }),
        gsap.to(blob, {
          scaleX: () => 0.7 + Math.random() * 0.6,
          scaleY: () => 0.7 + Math.random() * 0.6,
          duration: () => 3 + Math.random() * 4,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.25,
        }),
        gsap.to(blob, {
          borderRadius: () => {
            const r = Array.from({ length: 8 }, () => 25 + Math.random() * 35);
            return `${r[0]}% ${r[1]}% ${r[2]}% ${r[3]}% / ${r[4]}% ${r[5]}% ${r[6]}% ${r[7]}%`;
          },
          duration: () => 3 + Math.random() * 3,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.2,
        }),
      );
    });
  }, [active, reduced]);

  // ── Audio-reactive pulse of the whole field ──
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const tick = () => {
      const lava = lavaRef.current;
      if (lava) {
        const level = audioEngine.getLevel(); // 0..1
        lava.style.transform = `scale(${1 + level * 0.28})`;
        lava.style.opacity = `${0.75 + level * 0.25}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // ── TV static ──
  useEffect(() => {
    const canvas = staticRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SCALE = 3;
    let w = 0;
    let h = 0;
    let imageData: ImageData;

    const resize = () => {
      w = Math.ceil(window.innerWidth / SCALE);
      h = Math.ceil(window.innerHeight / SCALE);
      canvas.width = w;
      canvas.height = h;
      imageData = ctx.createImageData(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    const draw = () => {
      const pixels = imageData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const v = (Math.random() * 28) | 0;
        pixels[i] = v;
        pixels[i + 1] = v;
        pixels[i + 2] = v;
        pixels[i + 3] = 45;
      }
      ctx.putImageData(imageData, 0, 0);
      raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      draw(); // single frame, no animation loop
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  return (
    <>
      {/* SVG filters referenced by the CSS below */}
      <svg className="atmos-defs" aria-hidden="true">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          <filter id="grain-fine" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="4"
              stitchTiles="stitch"
              seed="2"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <filter id="grain-coarse" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.45"
              numOctaves="2"
              stitchTiles="stitch"
              seed="7"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      <canvas ref={staticRef} className="paper-bg" aria-hidden="true" />
      <div ref={lavaRef} className="lava-bg" aria-hidden="true" />
      <div className="grain-overlay grain-fine" aria-hidden="true" />
      <div className="grain-overlay grain-coarse" aria-hidden="true" />
      <div className="vignette-overlay" aria-hidden="true" />
    </>
  );
}
