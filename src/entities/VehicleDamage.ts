import { Vehicle, Projectile } from '../types/Game';
import { length, subtract } from '../utils/Math';

/**
 * Check if projectile hits a vehicle
 */
export const checkProjectileVehicleCollision = (
  projectile: Projectile,
  vehicle: Vehicle
): boolean => {
  if (vehicle.destroyed) return false;
  
  const distance = length(subtract(projectile.position, vehicle.position));
  const hitRadius = vehicle.size / 2 + 5;
  return distance < hitRadius;
};

/**
 * Apply damage to vehicle
 */
export const damageVehicle = (
  vehicle: Vehicle,
  damage: number
): Vehicle => {
  if (vehicle.destroyed) return vehicle;
  
  const newHealth = Math.max(0, vehicle.health - damage);
  const isDestroyed = newHealth <= 0;
  
  return {
    ...vehicle,
    health: newHealth,
    destroyed: isDestroyed,
  };
};

/**
 * Get vehicle smoke level based on health
 * Returns 0 (no smoke) to 3 (heavy smoke)
 */
export const getVehicleSmokeLevel = (vehicle: Vehicle): number => {
  if (vehicle.destroyed) return 3;
  
  const healthPercent = vehicle.health / vehicle.maxHealth;
  
  if (healthPercent > 0.75) return 0; // Healthy
  if (healthPercent > 0.5) return 1; // Light smoke
  if (healthPercent > 0.25) return 2; // Medium smoke
  return 3; // Heavy smoke
};

