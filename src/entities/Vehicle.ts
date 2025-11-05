import { Vehicle, Vector2 } from '../types/Game';
import { add, multiply, normalize, length, subtract } from '../utils/Math';
import { getTileAt, TileLookup } from '../utils/TileLookup';
import { TILE_SIZE } from '../utils/Isometric';

const VEHICLE_COLORS = [
  '#c41e3a', // Red
  '#0066cc', // Blue
  '#ffcc00', // Yellow
  '#00cc66', // Green
  '#cc6600', // Brown
  '#9966cc', // Purple
  '#ff9900', // Orange
  '#333333', // Dark gray
  '#ffffff', // White
  '#000000', // Black
];

const VEHICLE_TYPES: Array<'car' | 'truck' | 'van'> = ['car', 'truck', 'van'];

export const createVehicle = (
  x: number,
  y: number,
  id: string,
  parked: boolean = true
): Vehicle => {
  const seed = id.split('-').reduce((acc, val) => acc + parseInt(val, 36), 0);
  const colorIndex = Math.abs(seed) % VEHICLE_COLORS.length;
  const typeIndex = Math.abs(seed * 7) % VEHICLE_TYPES.length;
  
  const type = VEHICLE_TYPES[typeIndex];
  const maxSpeed = type === 'truck' ? 250 : type === 'van' ? 220 : 280; // Different speeds per type
  
  return {
    id,
    position: { x, y },
    rotation: parked ? Math.random() * Math.PI * 2 : 0, // Random rotation when parked
    speed: 0,
    size: type === 'truck' ? 48 : type === 'van' ? 44 : 40, // Different sizes
    velocity: { x: 0, y: 0 },
    maxSpeed,
    parked,
    color: VEHICLE_COLORS[colorIndex],
    type,
  };
};

/**
 * GTA 2-style vehicle physics: arcade handling with drift
 */
export const updateVehicle = (
  vehicle: Vehicle,
  input: Vector2,
  deltaTime: number,
  tileLookup: TileLookup
): Vehicle => {
  if (vehicle.parked) {
    // Parked vehicles don't move
    return vehicle;
  }

  // Vehicle physics constants
  const acceleration = 1200; // Faster acceleration than player
  const deceleration = 800; // Slower deceleration (more momentum)
  const turnRate = 4.5; // Radians per second (how fast vehicle rotates)
  const driftFactor = 0.85; // How much the vehicle drifts (lower = more drift)
  
  let newVelocity = { ...vehicle.velocity };
  let newRotation = vehicle.rotation;
  
  const inputLength = length(input);
  
  if (inputLength > 0) {
    // Get desired direction from input
    const desiredDirection = normalize(input);
    const desiredAngle = Math.atan2(desiredDirection.y, desiredDirection.x);
    
    // Smoothly rotate towards desired direction
    let angleDiff = desiredAngle - newRotation;
    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // Apply turn rate
    const maxTurn = turnRate * deltaTime;
    const actualTurn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
    newRotation += actualTurn;
    
    // Normalize rotation
    while (newRotation > Math.PI * 2) newRotation -= Math.PI * 2;
    while (newRotation < 0) newRotation += Math.PI * 2;
    
    // Apply acceleration in forward direction (not input direction - this creates drift)
    const forwardDir = { x: Math.cos(newRotation), y: Math.sin(newRotation) };
    const accelerationVec = multiply(forwardDir, acceleration * deltaTime);
    
    // Blend current velocity with acceleration (creates arcade feel)
    newVelocity = add(
      multiply(newVelocity, driftFactor),
      multiply(accelerationVec, 1 - driftFactor)
    );
  } else {
    // No input - apply deceleration
    const currentSpeed = length(newVelocity);
    if (currentSpeed > 0) {
      const decelerationAmount = deceleration * deltaTime;
      const newSpeed = Math.max(0, currentSpeed - decelerationAmount);
      
      if (newSpeed === 0) {
        newVelocity = { x: 0, y: 0 };
      } else {
        newVelocity = multiply(normalize(newVelocity), newSpeed);
      }
    }
  }
  
  // Clamp velocity to max speed
  const velLength = length(newVelocity);
  if (velLength > vehicle.maxSpeed) {
    newVelocity = multiply(normalize(newVelocity), vehicle.maxSpeed);
  }
  
  // Update position with collision handling
  const movement = multiply(newVelocity, deltaTime);
  const radius = vehicle.size / 2;
  const positionAfterMovement = { ...vehicle.position };
  const resolvedVelocity = { ...newVelocity };
  
  // Simple collision with blocking tiles (vehicles can't drive through buildings/water)
  if (movement.x !== 0) {
    const proposed = {
      x: vehicle.position.x + movement.x,
      y: positionAfterMovement.y,
    };
    
    if (collidesWithBlockingTile(proposed, radius, tileLookup)) {
      resolvedVelocity.x = 0;
      // Bounce back slightly on collision
      resolvedVelocity.y *= 0.5;
    } else {
      positionAfterMovement.x = proposed.x;
    }
  }
  
  if (movement.y !== 0) {
    const proposed = {
      x: positionAfterMovement.x,
      y: vehicle.position.y + movement.y,
    };
    
    if (collidesWithBlockingTile(proposed, radius, tileLookup)) {
      resolvedVelocity.y = 0;
      // Bounce back slightly on collision
      resolvedVelocity.x *= 0.5;
    } else {
      positionAfterMovement.y = proposed.y;
    }
  }
  
  const newSpeed = length(resolvedVelocity);
  
  return {
    ...vehicle,
    position: positionAfterMovement,
    rotation: newRotation,
    velocity: resolvedVelocity,
    speed: newSpeed,
  };
};

const BLOCKING_TILE_TYPES = ['building', 'water'];

const isBlockingTile = (tileType?: string): boolean => {
  if (!tileType) {
    return true;
  }
  return BLOCKING_TILE_TYPES.includes(tileType);
};

const collidesWithBlockingTile = (
  position: Vector2,
  radius: number,
  tileLookup: TileLookup
): boolean => {
  const sampleOffsets = [
    { x: -radius, y: -radius },
    { x: radius, y: -radius },
    { x: radius, y: radius },
    { x: -radius, y: radius },
    { x: 0, y: 0 },
  ];

  for (const offset of sampleOffsets) {
    const sampleX = position.x + offset.x;
    const sampleY = position.y + offset.y;
    if (!Number.isFinite(sampleX) || !Number.isFinite(sampleY)) {
      return true;
    }

    const tileX = Math.floor(sampleX / TILE_SIZE);
    const tileY = Math.floor(sampleY / TILE_SIZE);
    const tile = getTileAt(tileLookup, tileX, tileY);

    if (isBlockingTile(tile?.type)) {
      return true;
    }
  }

  return false;
};

/**
 * Spawn vehicles parked on roads across the city
 */
export const spawnVehiclesInCity = (
  citySize: number,
  tileSize: number,
  count: number,
  tileLookup: TileLookup
): Vehicle[] => {
  const vehicles: Vehicle[] = [];
  const maxAttempts = count * 20;
  let attempts = 0;

  for (let i = 0; i < count && attempts < maxAttempts; attempts++) {
    // Try to spawn on road tiles only
    const x = Math.random() * citySize * tileSize;
    const y = Math.random() * citySize * tileSize;

    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    const tile = getTileAt(tileLookup, tileX, tileY);

    // Only spawn on road tiles
    if (tile && tile.type === 'road') {
      // Offset slightly within the road tile
      const offsetX = (Math.random() - 0.5) * tileSize * 0.6;
      const offsetY = (Math.random() - 0.5) * tileSize * 0.6;
      const vehicleX = x + offsetX;
      const vehicleY = y + offsetY;
      
      const vehicle = createVehicle(vehicleX, vehicleY, `vehicle-${i}`, true);
      
      // Check if too close to other vehicles
      const tooClose = vehicles.some(other => {
        const dist = length(subtract(other.position, vehicle.position));
        return dist < 60; // Minimum 60 pixels apart
      });

      if (!tooClose) {
        vehicles.push(vehicle);
        i++;
      }
    }
  }

  return vehicles;
};

