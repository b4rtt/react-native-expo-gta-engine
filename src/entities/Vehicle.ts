import { Vehicle, Vector2, VehicleInput } from '../types/Game';
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
  parked: boolean = true,
  isPolice: boolean = false
): Vehicle => {
  const seed = id.split('-').reduce((acc, val) => acc + parseInt(val, 36), 0);
  const colorIndex = Math.abs(seed) % VEHICLE_COLORS.length;
  const typeIndex = Math.abs(seed * 7) % VEHICLE_TYPES.length;
  
  const type = VEHICLE_TYPES[typeIndex];
  const maxSpeed = type === 'truck' ? 240 : type === 'van' ? 260 : 300; // Increased max speeds for better gameplay
  
  // Police vehicles are always cars and have distinct colors
  const vehicleType = isPolice ? 'car' : type;
  const vehicleColor = isPolice ? '#0047AB' : VEHICLE_COLORS[colorIndex]; // Police blue
  const vehicleMaxSpeed = isPolice ? 320 : maxSpeed; // Police cars are faster
  
  return {
    id,
    position: { x, y },
    rotation: parked ? Math.random() * Math.PI * 2 : 0, // Random rotation when parked
    speed: 0,
    size: vehicleType === 'truck' ? 48 : vehicleType === 'van' ? 44 : 40, // Different sizes
    velocity: { x: 0, y: 0 },
    maxSpeed: vehicleMaxSpeed,
    parked,
    color: vehicleColor,
    type: vehicleType,
    isPolice,
    chasing: false,
    targetPosition: undefined,
    health: 100,
    maxHealth: 100,
    destroyed: false,
  };
};

/**
 * GTA 2-style vehicle physics: arcade handling with drift
 */
export const updateVehicle = (
  vehicle: Vehicle,
  input: VehicleInput,
  deltaTime: number,
  tileLookup: TileLookup
): Vehicle => {
  if (vehicle.parked) {
    // Parked vehicles don't move
    return vehicle;
  }

  // Vehicle physics constants - improved for better feel
  const acceleration = 3000; // Forward acceleration (much faster acceleration)
  const brakeDeceleration = 2500; // Braking deceleration (strong brakes)
  const reverseAcceleration = 1500; // Reverse acceleration (better reverse speed)
  const deceleration = 800; // Natural deceleration when no input (slower slowdown for coasting)
  const turnRate = 5.5; // Radians per second (improved turning)
  const driftFactor = 0.82; // How much the vehicle drifts (slightly more responsive)
  
  let newVelocity = { ...vehicle.velocity };
  let newRotation = vehicle.rotation;
  
  // Handle steering (left/right)
  if (Math.abs(input.steering) > 0.01) {
    // Steering speed depends on current speed (faster = less steering)
    const currentSpeed = length(newVelocity);
    const maxSpeedFactor = Math.min(1, currentSpeed / vehicle.maxSpeed);
    // Improved steering curve: better control at low speeds, still responsive at high speeds
    const steeringMultiplier = 0.6 + (1 - maxSpeedFactor) * 0.4; // More steering at low speeds
    
    const turnAmount = input.steering * turnRate * deltaTime * steeringMultiplier;
    newRotation += turnAmount;
    
    // Normalize rotation
    while (newRotation > Math.PI * 2) newRotation -= Math.PI * 2;
    while (newRotation < 0) newRotation += Math.PI * 2;
  }
  
  // Handle acceleration/brake (forward/backward)
  if (Math.abs(input.acceleration) > 0.01) {
    const forwardDir = { x: Math.cos(newRotation), y: Math.sin(newRotation) };
    
    if (input.acceleration > 0) {
      // Forward acceleration - progressive power based on input
      const currentSpeed = length(newVelocity);
      const speedRatio = currentSpeed / vehicle.maxSpeed;
      
      // Acceleration is stronger at lower speeds (like real cars)
      const accelerationMultiplier = 1.0 + (1 - speedRatio) * 0.5; // Up to 1.5x at low speeds
      const accelerationVec = multiply(
        forwardDir, 
        acceleration * deltaTime * input.acceleration * accelerationMultiplier
      );
      
      // Blend current velocity with acceleration (creates arcade feel with drift)
      newVelocity = add(
        multiply(newVelocity, driftFactor),
        multiply(accelerationVec, 1 - driftFactor)
      );
    } else {
      // Brake or reverse
      const currentSpeed = length(newVelocity);
      
      if (currentSpeed > 5) {
        // Braking (when moving forward) - strong and immediate
        const brakeAmount = brakeDeceleration * deltaTime * Math.abs(input.acceleration);
        const newSpeed = Math.max(0, currentSpeed - brakeAmount);
        
        if (newSpeed === 0) {
          newVelocity = { x: 0, y: 0 };
        } else {
          newVelocity = multiply(normalize(newVelocity), newSpeed);
        }
      } else {
        // Reverse (when stopped or moving slowly)
        const reverseVec = multiply(forwardDir, -reverseAcceleration * deltaTime * Math.abs(input.acceleration));
        newVelocity = add(newVelocity, reverseVec);
      }
    }
  } else {
    // No acceleration input - apply natural deceleration
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
  
  // Calculate collision damage (based on speed change)
  const speedChange = Math.abs(newSpeed - vehicle.speed);
  let healthDamage = 0;
  
  // If we hit a wall and lost significant speed, take damage
  if (speedChange > 50) {
    healthDamage = speedChange / 10; // Scale damage based on speed loss
  }
  
  const newHealth = Math.max(0, vehicle.health - healthDamage);
  const isDestroyed = newHealth <= 0;
  
  return {
    ...vehicle,
    position: positionAfterMovement,
    rotation: newRotation,
    velocity: resolvedVelocity,
    speed: newSpeed,
    health: newHealth,
    destroyed: isDestroyed,
  };
};

/**
 * Update police vehicle with AI chase logic
 */
export const updatePoliceVehicle = (
  vehicle: Vehicle,
  playerPosition: Vector2,
  deltaTime: number,
  tileLookup: TileLookup
): Vehicle => {
  if (vehicle.parked || !vehicle.chasing) {
    return vehicle;
  }
  
  // Calculate direction to player
  const toPlayer = subtract(playerPosition, vehicle.position);
  const distanceToPlayer = length(toPlayer);
  
  // If very close to player, slow down a bit
  const closeDistance = 100;
  const isClose = distanceToPlayer < closeDistance;
  
  // Calculate desired rotation (angle to player)
  const desiredRotation = Math.atan2(toPlayer.y, toPlayer.x);
  
  // Calculate rotation difference
  let rotationDiff = desiredRotation - vehicle.rotation;
  
  // Normalize to -PI to PI
  while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
  while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
  
  // Calculate AI input based on angle and distance
  const steering = Math.max(-1, Math.min(1, rotationDiff * 2)); // Proportional steering
  
  // Accelerate if pointing roughly towards player, brake if pointing away
  const angleThreshold = Math.PI / 3; // 60 degrees
  let acceleration: number;
  
  if (Math.abs(rotationDiff) < angleThreshold) {
    // Pointing towards player - accelerate
    acceleration = isClose ? 0.5 : 1.0; // Slow down when close
  } else if (Math.abs(rotationDiff) > Math.PI * 0.7) {
    // Pointing away - reverse or brake
    acceleration = -0.5;
  } else {
    // Turning - moderate acceleration
    acceleration = 0.3;
  }
  
  // Use regular vehicle update with AI input
  const aiInput: VehicleInput = {
    acceleration,
    steering,
  };
  
  return updateVehicle(vehicle, aiInput, deltaTime, tileLookup);
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

