import { Projectile, Vector2, WeaponId, WeaponType, NPC } from '../types/Game';
import { add, multiply, length, subtract } from '../utils/Math';
import { getTileAt, TileLookup } from '../utils/TileLookup';
import { TILE_SIZE } from '../utils/Isometric';

// Weapon configurations
export interface WeaponConfig {
  damage: number;
  speed: number; // Projectile speed in pixels/second
  fireRate: number; // Minimum time between shots (in seconds)
  lifetime: number; // How long projectile lives (in seconds)
  spread: number; // Random spread in radians
  type: WeaponType;
  maxAmmo: number; // -1 for infinite (melee weapons)
  range: number; // Range for melee weapons in pixels
}

const WEAPON_CONFIGS: Record<WeaponId, WeaponConfig> = {
  fist: {
    damage: 10,
    speed: 0,
    fireRate: 0.5,
    lifetime: 0.1,
    spread: 0,
    type: 'melee',
    maxAmmo: -1,
    range: 40,
  },
  pistol: {
    damage: 25,
    speed: 800,
    fireRate: 0.3,
    lifetime: 2.0,
    spread: 0.05,
    type: 'ranged',
    maxAmmo: 50,
    range: 0,
  },
  knife: {
    damage: 40,
    speed: 0,
    fireRate: 0.6,
    lifetime: 0.1,
    spread: 0,
    type: 'melee',
    maxAmmo: -1,
    range: 45,
  },
  bat: {
    damage: 30,
    speed: 0,
    fireRate: 0.7,
    lifetime: 0.1,
    spread: 0,
    type: 'melee',
    maxAmmo: -1,
    range: 50,
  },
};

export const getWeaponConfig = (weapon: WeaponId): WeaponConfig => {
  return WEAPON_CONFIGS[weapon];
};

export const createProjectile = (
  position: Vector2,
  rotation: number,
  weapon: WeaponId,
  ownerId: string
): Projectile => {
  const config = getWeaponConfig(weapon);
  
  // Add random spread
  const spreadAngle = (Math.random() - 0.5) * config.spread;
  const finalRotation = rotation + spreadAngle;
  
  // Calculate velocity
  const velocity: Vector2 = {
    x: Math.cos(finalRotation) * config.speed,
    y: Math.sin(finalRotation) * config.speed,
  };
  
  return {
    id: `projectile-${Date.now()}-${Math.random()}`,
    position: { ...position },
    velocity,
    rotation: finalRotation,
    damage: config.damage,
    ownerId,
    lifetime: config.lifetime,
    maxLifetime: config.lifetime,
    weapon,
  };
};

export const updateProjectile = (
  projectile: Projectile,
  deltaTime: number,
  tileLookup: TileLookup
): Projectile | null => {
  // Decrease lifetime
  const newLifetime = projectile.lifetime - deltaTime;
  
  if (newLifetime <= 0) {
    return null; // Projectile despawned
  }
  
  // Update position
  const movement = multiply(projectile.velocity, deltaTime);
  const newPosition = add(projectile.position, movement);
  
  // Check collision with world (buildings, water)
  const tileX = Math.floor(newPosition.x / TILE_SIZE);
  const tileY = Math.floor(newPosition.y / TILE_SIZE);
  const tile = getTileAt(tileLookup, tileX, tileY);
  
  // Projectile hits solid tiles
  if (tile && (tile.type === 'building' || tile.type === 'water')) {
    return null; // Projectile destroyed
  }
  
  return {
    ...projectile,
    position: newPosition,
    lifetime: newLifetime,
  };
};

// Check if projectile hits an NPC
export const checkProjectileNPCCollision = (
  projectile: Projectile,
  npc: NPC
): boolean => {
  const distance = length(subtract(projectile.position, npc.position));
  const hitRadius = npc.size / 2 + 5; // Small hit box
  return distance < hitRadius;
};

// Check if projectile hits player
export const checkProjectilePlayerCollision = (
  projectile: Projectile,
  playerPosition: Vector2,
  playerSize: number
): boolean => {
  const distance = length(subtract(projectile.position, playerPosition));
  const hitRadius = playerSize / 2 + 5; // Small hit box
  return distance < hitRadius;
};

