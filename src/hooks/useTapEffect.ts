/**
 * Tap animation effect hook.
 * Manages crown tap animation and particle effects.
 */

import { useState, useCallback } from 'react';
import { Particle, createParticle, updateParticle } from '../utils/particle';
import { GAME_CONFIG } from '../game/gameConfig';

export interface TapEffectState {
  isTapping: boolean;
  particles: Particle[];
  rewardPosition: { x: number; y: number; opacity: number } | null;
  rewardText: string;
}

export const useTapEffect = () => {
  const [tapEffect, setTapEffect] = useState<TapEffectState>({
    isTapping: false,
    particles: [],
    rewardPosition: null,
    rewardText: `+${GAME_CONFIG.tapReward.toFixed(3)}`,
  });

  const triggerTap = useCallback((x: number, y: number, rewardText = `+${GAME_CONFIG.tapReward.toFixed(3)}`) => {
    setTapEffect((prev) => {
      // Create new particles
      const newParticles: Particle[] = [];
      const particleCount = 12;
      for (let i = 0; i < particleCount; i++) {
        newParticles.push(
          createParticle(
            x,
            y,
            GAME_CONFIG.particleLifetime,
            GAME_CONFIG.particleGravity
          )
        );
      }

      // Limit total particles
      const allParticles = [...prev.particles, ...newParticles]
        .filter((p) => p.active)
        .slice(-GAME_CONFIG.maxParticles);

      return {
        isTapping: true,
        particles: allParticles,
        rewardPosition: { x, y, opacity: 1 },
        rewardText,
      };
    });

    // End tap animation
    setTimeout(() => {
      setTapEffect((prev) => ({
        ...prev,
        isTapping: false,
      }));
    }, GAME_CONFIG.crownTapDuration);
  }, []);

  const updateParticles = useCallback(() => {
    setTapEffect((prev) => {
      const updatedParticles = prev.particles
        .map((p) =>
          updateParticle(p, 16.67, GAME_CONFIG.particleGravity) // ~60fps
        )
        .filter((p) => p.active);

      let newRewardPosition = prev.rewardPosition;
      if (newRewardPosition) {
        newRewardPosition = {
          x: newRewardPosition.x,
          y: newRewardPosition.y - 1,
          opacity: Math.max(0, newRewardPosition.opacity - 0.02),
        };
        if (newRewardPosition.opacity <= 0) {
          newRewardPosition = null;
        }
      }

      return {
        ...prev,
        particles: updatedParticles,
        rewardPosition: newRewardPosition,
      };
    });
  }, []);

  return {
    tapEffect,
    triggerTap,
    updateParticles,
  };
};
