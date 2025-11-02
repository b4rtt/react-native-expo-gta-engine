import { Player, Vector2, Direction, TileType } from '../types/Game';
import { add, multiply, normalize, length } from '../utils/Math';
import {
  createSpriteAnimation,
  updateSpriteAnimation,
  getSpriteDirection,
  getSpriteAnimationType,
} from '../utils/SpriteAnimation';
import { TileLookup, getTileAt } from '../utils/TileLookup';
import { TILE_SIZE } from '../utils/Isometric';

const BLOCKING_TILE_TYPES: TileType[] = ['building'];

const isBlockingTile = (tileType?: TileType): boolean => {
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

export const createPlayer = (x: number, y: number): Player => ({
  id: 'player',
  position: { x, y },
  rotation: 0,
  speed: 0,
  size: 32, // Match sprite size
  velocity: { x: 0, y: 0 },
  maxSpeed: 180, // Moderate speed for better control
  animation: createSpriteAnimation('front', 'idle'),
});

export const updatePlayer = (
  player: Player,
  input: Vector2,
  deltaTime: number,
  tileLookup: TileLookup
): Player => {
  // GTA 2 style physics: responsive but smooth
  const acceleration = 800; // Lower = more gradual speed up
  const deceleration = 1200; // How fast to stop when no input
  const maxSpeed = 180; // Lower max speed for better control
  
  // Start with current velocity
  let newVelocity = { ...player.velocity };
  let newRotation = player.rotation;

  // Normalize input direction
  const inputLength = length(input);
  
  if (inputLength > 0) {
    // Player is giving input
    const direction = normalize(input);
    
    // Apply acceleration in input direction
    const accelerationVec = multiply(direction, acceleration * deltaTime);
    newVelocity = add(newVelocity, accelerationVec);
    
    // Update rotation based on movement direction
    newRotation = Math.atan2(direction.y, direction.x);
  } else {
    // No input - apply strong deceleration
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

  // Calculate velocity length
  let velLength = length(newVelocity);

  // Clamp velocity to max speed
  if (velLength > maxSpeed) {
    newVelocity = multiply(normalize(newVelocity), maxSpeed);
    velLength = maxSpeed;
  }

  // Update position with collision handling
  const movement = multiply(newVelocity, deltaTime);
  const radius = player.size / 2;
  const positionAfterMovement = { ...player.position };
  const resolvedVelocity = { ...newVelocity };

  if (movement.x !== 0) {
    const proposed = {
      x: player.position.x + movement.x,
      y: positionAfterMovement.y,
    };

    if (collidesWithBlockingTile(proposed, radius, tileLookup)) {
      resolvedVelocity.x = 0;
    } else {
      positionAfterMovement.x = proposed.x;
    }
  }

  if (movement.y !== 0) {
    const proposed = {
      x: positionAfterMovement.x,
      y: player.position.y + movement.y,
    };

    if (collidesWithBlockingTile(proposed, radius, tileLookup)) {
      resolvedVelocity.y = 0;
    } else {
      positionAfterMovement.y = proposed.y;
    }
  }

  const newSpeed = length(resolvedVelocity);

  // Update animation based on movement
  const newAnimationType = getSpriteAnimationType(resolvedVelocity);
  
  // Get new direction, but preserve current direction when idle
  let newDirection: Direction;
  if (newAnimationType === 'idle') {
    // When idle, keep current direction if it's a valid idle direction
    // Otherwise default to front
    if (player.animation.direction === 'front' || player.animation.direction === 'back') {
      newDirection = player.animation.direction;
    } else {
      newDirection = 'front'; // Default to front for idle
    }
  } else {
    // When moving, use actual movement direction
    newDirection = getSpriteDirection(resolvedVelocity);
  }
  
  // Reset animation if direction or type changed
  let newAnimation = player.animation;
  if (
    player.animation.direction !== newDirection ||
    player.animation.type !== newAnimationType
  ) {
    newAnimation = createSpriteAnimation(newDirection, newAnimationType);
  }

  // Update animation frame
  newAnimation = updateSpriteAnimation(newAnimation, deltaTime);

  // Return new player object (immutable update)
  return {
    ...player,
    position: positionAfterMovement,
    rotation: newRotation,
    velocity: resolvedVelocity,
    speed: newSpeed,
    animation: newAnimation,
  };
};
