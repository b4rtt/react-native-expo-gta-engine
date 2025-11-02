import { Player, Vector2, Direction } from '../types/Game';
import { add, multiply, normalize, clamp, length } from '../utils/Math';
import {
  createSpriteAnimation,
  updateSpriteAnimation,
  getSpriteDirection,
  getSpriteAnimationType,
} from '../utils/SpriteAnimation';

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
  deltaTime: number
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

  // Update position
  const movement = multiply(newVelocity, deltaTime);
  const newPosition = add(player.position, movement);
  const newSpeed = velLength;

  // Update animation based on movement
  const newAnimationType = getSpriteAnimationType(newVelocity);
  
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
    newDirection = getSpriteDirection(newVelocity);
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
    position: newPosition,
    rotation: newRotation,
    velocity: newVelocity,
    speed: newSpeed,
    animation: newAnimation,
  };
};

