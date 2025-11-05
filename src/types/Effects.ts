import { Vector2 } from './Game';

export type ParticleType = 'smoke' | 'fire' | 'spark' | 'explosion';

export interface Particle {
  id: string;
  type: ParticleType;
  position: Vector2;
  velocity: Vector2;
  lifetime: number; // Remaining lifetime in seconds
  maxLifetime: number; // Initial lifetime
  size: number; // Particle size
  opacity: number; // Current opacity (0-1)
  color?: string; // Optional color override
}

export interface Effect {
  id: string;
  type: 'vehicle-smoke' | 'vehicle-fire' | 'explosion';
  position: Vector2;
  startTime: number; // Timestamp when effect started
  duration: number; // How long effect lasts (ms)
  intensity: number; // 0-1, how strong the effect is
}

