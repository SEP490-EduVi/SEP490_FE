'use client';
import { useEffect, useRef } from 'react';

interface FireworksProps {
  show: boolean;
  duration?: number;
}

const COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#ff922b', '#cc5de8', '#f06595', '#63e6be',
];

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; color: string; radius: number;
};

export function Fireworks({ show, duration = 2500 }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!show) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];

    function burst(x: number, y: number) {
      const count = 60;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 2 + Math.random() * 7;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          alpha: 1,
          color,
          radius: 2 + Math.random() * 3,
        });
      }
    }

    const burstOffsets = [0, 180, 400, 650, 950, 1300];
    const timers: ReturnType<typeof setTimeout>[] = [];

    burstOffsets.forEach((t) => {
      timers.push(
        setTimeout(() => {
          if (!canvasRef.current) return;
          burst(
            canvasRef.current.width * (0.2 + Math.random() * 0.6),
            canvasRef.current.height * (0.1 + Math.random() * 0.45),
          );
        }, t),
      );
    });

    let animFrame: number;
    const GRAVITY = 0.09;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY;
        p.vx *= 0.98;
        p.alpha -= 0.013;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animFrame = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      timers.forEach(clearTimeout);
      cancelAnimationFrame(animFrame);
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [show]);

  if (!show) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[10002]"
    />
  );
}
