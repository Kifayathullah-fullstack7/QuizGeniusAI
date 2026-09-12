'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  angularSpeed: number;
  color: string;
  alpha: number;
  targetX?: number;
  targetY?: number;
}

export function KnowledgeConstellation({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrameId: number;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 560);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 560);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Dala Refero Spectrum: Violet, Amber, Deep Verdant/Teal, Magenta, Blue
    const spectrumColors = [
      '#8052ff', // Electric Iris
      '#ffb829', // Saffron Spark
      '#15846e', // Deep Verdant
      '#a855f7', // Vivid Violet
      '#ec4899', // Magenta
      '#3b82f6', // Vivid Blue
      '#ffffff', // Bone White accent
    ];

    const particleCount = 220;
    const particles: Particle[] = [];

    // Procedural brain/neural cloud coordinate distribution (Dual hemispheric clusters)
    for (let i = 0; i < particleCount; i++) {
      const isAmbient = Math.random() > 0.65;
      let x = 0;
      let y = 0;

      if (isAmbient) {
        // Ambient drifting triangles across the canvas
        x = Math.random() * width;
        y = Math.random() * height;
      } else {
        // Brain-like organic cluster centered
        const hemisphere = Math.random() > 0.5 ? 1 : -1;
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random()) * (Math.min(width, height) * 0.28);

        const cx = width * 0.5 + hemisphere * (Math.min(width, height) * 0.08);
        const cy = height * 0.48;

        x = cx + r * Math.sin(phi) * Math.cos(theta);
        y = cy + r * Math.sin(phi) * Math.sin(theta) * 0.78; // Elliptical height
      }

      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (prefersReducedMotion ? 0 : 0.4),
        vy: (Math.random() - 0.5) * (prefersReducedMotion ? 0 : 0.4),
        size: Math.random() * 2.5 + 2.5, // 2.5 to 5px sharp triangles
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.02,
        color: spectrumColors[Math.floor(Math.random() * spectrumColors.length)],
        alpha: Math.random() * 0.65 + 0.35,
      });
    }

    // Draw sharp equilateral outline triangle
    const drawOutlinedTriangle = (
      c: CanvasRenderingContext2D,
      px: number,
      py: number,
      size: number,
      angle: number,
      color: string,
      alpha: number
    ) => {
      c.save();
      c.translate(px, py);
      c.rotate(angle);
      c.strokeStyle = color;
      c.lineWidth = 1.2;
      c.globalAlpha = alpha;

      c.beginPath();
      // Triangle vertices
      c.moveTo(0, -size);
      c.lineTo(size * 0.866, size * 0.5);
      c.lineTo(-size * 0.866, size * 0.5);
      c.closePath();
      c.stroke();
      c.restore();
    };

    let time = 0;
    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Connect proximal brain particles with faint filaments
      const maxDist = 65;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const filamentAlpha = (1 - dist / maxDist) * 0.12;
            ctx.strokeStyle = `rgba(255, 255, 255, ${filamentAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Render each outlined triangular glyph
      particles.forEach((p, idx) => {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.angle += p.angularSpeed;

          // Bounce soft boundaries
          if (p.x < 10 || p.x > width - 10) p.vx *= -1;
          if (p.y < 10 || p.y > height - 10) p.vy *= -1;
        }

        const pulse = Math.sin(time * 2 + idx) * 0.15;
        const currentAlpha = Math.max(0.15, Math.min(1, p.alpha + pulse));

        drawOutlinedTriangle(ctx, p.x, p.y, p.size, p.angle, p.color, currentAlpha);
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[440px] flex items-center justify-center select-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
