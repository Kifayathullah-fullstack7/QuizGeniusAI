'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CosmicCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Mouse coords & lerp trailing coords
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Disable on touch screens
    if (typeof window !== 'undefined') {
      const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
      if (isTouch) {
        setIsTouchDevice(true);
        return;
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Check if hovering over interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = !!target.closest('a, button, input, textarea, select, [role="button"], .cursor-pointer');
        setIsHovering(interactive);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Smooth physics loop for trailing ring
    const render = () => {
      // Smooth lerp (linear interpolation)
      const ease = 0.2;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * ease;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * ease;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isVisible]);

  if (isTouchDevice) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden transition-opacity duration-300">
      {/* Precision Inner Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 pointer-events-none rounded-full transition-all duration-75 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } ${
          isHovering
            ? 'w-3 h-3 bg-cyan-300 shadow-[0_0_12px_#22D3EE]'
            : 'w-2 h-2 bg-violet-400 shadow-[0_0_10px_#8B5CF6]'
        }`}
        style={{ willChange: 'transform' }}
      />

      {/* Trailing Fluid Halo / Glowing Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 pointer-events-none rounded-full transition-all duration-300 ease-out flex items-center justify-center ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } ${
          isHovering
            ? 'w-11 h-11 border border-cyan-400/70 bg-cyan-500/15 shadow-[0_0_25px_rgba(34,211,238,0.4)] scale-125'
            : isClicking
            ? 'w-7 h-7 border-2 border-violet-400/80 bg-violet-500/25 shadow-[0_0_20px_rgba(139,92,246,0.6)] scale-90'
            : 'w-8 h-8 border border-violet-400/40 bg-violet-500/5 shadow-[0_0_15px_rgba(139,92,246,0.25)]'
        }`}
        style={{ willChange: 'transform' }}
      >
        {/* Subtle internal crosshair or inner pulse when hovering */}
        {isHovering && (
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping opacity-60" />
        )}
      </div>
    </div>
  );
}
