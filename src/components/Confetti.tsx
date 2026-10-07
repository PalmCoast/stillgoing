import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion.ts';

const COLORS = ['#d6ff3f', '#ff3d8a', '#79e7ff', '#f6f1e7', '#ffc14d'];

export function Confetti({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const pieces = Array.from({ length: 88 }, () => ({
      x: Math.random(),
      y: -0.1 - Math.random() * 0.4,
      vy: 0.18 + Math.random() * 0.38,
      vx: -0.06 + Math.random() * 0.12,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 12,
      rot: Math.random() * 6,
      vr: -2 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#d6ff3f',
    }));

    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const t = (now - start) / 1000;
      for (const piece of pieces) {
        context.save();
        context.translate((piece.x + piece.vx * t) * width, (piece.y + piece.vy * t) * height);
        context.rotate(piece.rot + piece.vr * t);
        context.fillStyle = piece.color;
        context.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        context.restore();
      }
      if (t < 3.6) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced]);

  if (!active || reduced) return null;
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
