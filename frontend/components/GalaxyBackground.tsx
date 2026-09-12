'use client';

import React from 'react';
import Galaxy from './Galaxy';

export default function GalaxyBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <Galaxy
        mouseRepulsion={true}
        mouseInteraction={true}
        density={1.5}
        glowIntensity={0.6}
        saturation={0.9}
        hueShift={240}
        transparent={true}
        starSpeed={0.5}
        speed={1.0}
        twinkleIntensity={0.5}
        repulsionStrength={2.5}
      />
    </div>
  );
}
