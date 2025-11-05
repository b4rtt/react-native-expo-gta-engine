import { Particle, ParticleType } from '../types/Effects';
import { Vector2 } from '../types/Game';

/**
 * Create a particle
 */
export const createParticle = (
  type: ParticleType,
  position: Vector2,
  velocity: Vector2,
  lifetime: number,
  size: number = 4
): Particle => {
  return {
    id: `particle-${Date.now()}-${Math.random()}`,
    type,
    position: { ...position },
    velocity: { ...velocity },
    lifetime,
    maxLifetime: lifetime,
    size,
    opacity: 1.0,
  };
};

/**
 * Update particle position and lifetime
 */
export const updateParticle = (
  particle: Particle,
  deltaTime: number
): Particle | null => {
  const newLifetime = particle.lifetime - deltaTime;
  
  if (newLifetime <= 0) {
    return null; // Particle expired
  }
  
  // Update position based on velocity
  const newPosition = {
    x: particle.position.x + particle.velocity.x * deltaTime,
    y: particle.position.y + particle.velocity.y * deltaTime,
  };
  
  // Calculate opacity fade based on lifetime
  const lifetimeRatio = newLifetime / particle.maxLifetime;
  const newOpacity = lifetimeRatio;
  
  // Slow down particles over time
  const damping = 0.95;
  const newVelocity = {
    x: particle.velocity.x * damping,
    y: particle.velocity.y * damping,
  };
  
  return {
    ...particle,
    position: newPosition,
    velocity: newVelocity,
    lifetime: newLifetime,
    opacity: newOpacity,
  };
};

/**
 * Create smoke particles for damaged vehicle
 */
export const createVehicleSmoke = (
  position: Vector2,
  intensity: number // 0-1, how damaged the vehicle is
): Particle[] => {
  const particles: Particle[] = [];
  const particleCount = Math.floor(intensity * 3) + 1; // 1-4 particles
  
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 20;
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed - 20, // Smoke rises
    };
    
    const particle = createParticle(
      'smoke',
      position,
      velocity,
      1.0 + Math.random() * 1.0, // 1-2 seconds
      4 + Math.random() * 4 // 4-8 pixels
    );
    
    particles.push(particle);
  }
  
  return particles;
};

/**
 * Create explosion particles
 */
export const createExplosion = (position: Vector2): Particle[] => {
  const particles: Particle[] = [];
  const particleCount = 20 + Math.floor(Math.random() * 10); // 20-30 particles
  
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 150;
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    
    // Mix of fire and smoke particles
    const type: ParticleType = Math.random() > 0.5 ? 'fire' : 'smoke';
    
    const particle = createParticle(
      type,
      position,
      velocity,
      0.5 + Math.random() * 0.5, // 0.5-1 seconds
      6 + Math.random() * 6 // 6-12 pixels
    );
    
    particles.push(particle);
  }
  
  // Add some sparks
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 150 + Math.random() * 100;
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    
    const particle = createParticle(
      'spark',
      position,
      velocity,
      0.3 + Math.random() * 0.3, // 0.3-0.6 seconds
      2 + Math.random() * 2 // 2-4 pixels
    );
    
    particles.push(particle);
  }
  
  return particles;
};

