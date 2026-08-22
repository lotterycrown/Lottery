/**
 * Particle system utilities for coin particle effects.
 */

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  rotation: number; // radians
  rotationSpeed: number; // radians per frame
  scale: number;
  opacity: number;
  age: number; // milliseconds
  lifetime: number; // milliseconds
  active: boolean;
}

/**
 * Create a new particle.
 */
export const createParticle = (
  x: number,
  y: number,
  lifetime: number,
  gravity: number
): Particle => {
  // Random direction and speed
  const angle = Math.random() * Math.PI * 2;
  const speed = 3 + Math.random() * 5;

  return {
    id: Math.random().toString(36),
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - gravity,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    scale: 0.5 + Math.random() * 0.5,
    opacity: 1,
    age: 0,
    lifetime,
    active: true,
  };
};

/**
 * Update particle state.
 */
export const updateParticle = (
  particle: Particle,
  deltaTime: number,
  gravity: number
): Particle => {
  const updated = { ...particle };

  updated.age += deltaTime;
  const progress = updated.age / updated.lifetime;

  // Position
  updated.x += updated.vx;
  updated.y += updated.vy;
  updated.vy += gravity; // Apply gravity

  // Rotation
  updated.rotation += updated.rotationSpeed;

  // Fade out in the last 30% of lifetime
  updated.opacity = Math.max(0, 1 - Math.max(0, progress - 0.7) / 0.3);

  // Deactivate when lifetime expires
  updated.active = updated.age < updated.lifetime;

  return updated;
};
