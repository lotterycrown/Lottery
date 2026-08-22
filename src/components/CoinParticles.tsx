/**
 * Coin particle effect component.
 * Renders animated coin particles that burst from tap location.
 */

import React, { useEffect, useRef } from 'react';
import { Particle } from '../utils/particle';

interface CoinParticlesProps {
  particles: Particle[];
  onAnimationFrame?: () => void;
}

export const CoinParticles: React.FC<CoinParticlesProps> = ({
  particles,
  onAnimationFrame,
}) => {
  const rafRef = useRef<number>();

  useEffect(() => {
    if (particles.length === 0) return;

    const animate = () => {
      onAnimationFrame?.();
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [particles.length, onAnimationFrame]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: `translate(-50%, -50%) rotate(${particle.rotation}rad) scale(${particle.scale})`,
            opacity: particle.opacity,
            width: '16px',
            height: '16px',
          }}
        >
          {/* Coin particle */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id={`coin-${particle.id}`} cx="35%" cy="35%">
                <stop offset="0%" style={{ stopColor: '#f4d03f', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#b8860b', stopOpacity: 1 }} />
              </radialGradient>
            </defs>
            <circle cx="8" cy="8" r="8" fill={`url(#coin-${particle.id})`} />
            <circle cx="8" cy="8" r="7" fill="none" stroke="#d4af37" strokeWidth="0.5" />
            <circle cx="6" cy="6" r="2" fill="#ffffff" opacity="0.4" />
          </svg>
        </div>
      ))}
    </div>
  );
};
