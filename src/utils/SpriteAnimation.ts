import { SpriteAnimation, Direction, AnimationType, Vector2 } from '../types/Game';

// Sprritesheet configuration: 3x3 grid
export const SPRITE_SIZE = 32; // Size of each sprite frame
export const SPRITESHEET_COLS = 3;
export const SPRITESHEET_ROWS = 3;

// Animation frame counts
export const ANIMATION_FRAMES: Record<Direction, Record<AnimationType, number>> = {
  front: { idle: 2, walk: 0 },
  back: { idle: 1, walk: 2 },
  right: { idle: 1, walk: 4 },
  left: { idle: 1, walk: 4 }, // Use right walk frames mirrored
};

// Animation speeds (frames per second)
export const ANIMATION_SPEEDS: Record<AnimationType, number> = {
  idle: 2, // 2 frames per second for idle
  walk: 8, // 8 frames per second for walk
};

export const createSpriteAnimation = (
  direction: Direction = 'front',
  type: AnimationType = 'idle'
): SpriteAnimation => ({
  direction,
  type,
  currentFrame: 0,
  frameTime: 0,
  frameDuration: 1 / ANIMATION_SPEEDS[type],
});

export const updateSpriteAnimation = (
  animation: SpriteAnimation,
  deltaTime: number
): SpriteAnimation => {
  const frameCount = ANIMATION_FRAMES[animation.direction][animation.type];
  
  if (frameCount === 0) {
    return animation; // No animation frames available
  }

  const newFrameTime = animation.frameTime + deltaTime;
  const frameDuration = 1 / ANIMATION_SPEEDS[animation.type];
  
  if (newFrameTime >= frameDuration) {
    const newFrame = (animation.currentFrame + 1) % frameCount;
    return {
      ...animation,
      currentFrame: newFrame,
      frameTime: newFrameTime - frameDuration,
      frameDuration,
    };
  }

  return {
    ...animation,
    frameTime: newFrameTime,
  };
};

export const getSpriteDirection = (velocity: Vector2): Direction => {
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  
  if (speed < 10) {
    // If moving very slowly, keep current direction or default to front
    return 'front';
  }

  // GTA 2 style: direct mapping (no rotation)
  // X and Y in world space directly correspond to screen directions
  const absX = Math.abs(velocity.x);
  const absY = Math.abs(velocity.y);

  if (absX > absY) {
    // Horizontal movement
    return velocity.x > 0 ? 'right' : 'left';
  } else {
    // Vertical movement
    return velocity.y > 0 ? 'front' : 'back';
  }
};

export const getSpriteAnimationType = (velocity: Vector2): AnimationType => {
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  return speed > 10 ? 'walk' : 'idle';
};

// Get sprite coordinates in spritesheet (0-indexed)
export const getSpriteCoords = (
  direction: Direction,
  type: AnimationType,
  frame: number
): { col: number; row: number } => {
  // Spritesheet layout (3x3 grid):
  // Row 0: front idle (col 0), right walk frame 1 (col 1), right walk frame 2 (col 2)
  // Row 1: front idle variation (col 0), right walk frame 3 (col 1), right walk frame 4 (col 2)
  // Row 2: back idle (col 0), back walk frame 1 (col 1), back walk frame 2 (col 2)

  if (direction === 'front' && type === 'idle') {
    return { col: 0, row: frame % 2 }; // Alternate between row 0 and row 1
  }

  if (direction === 'right' && type === 'walk') {
    if (frame === 0) return { col: 1, row: 0 };
    if (frame === 1) return { col: 2, row: 0 };
    if (frame === 2) return { col: 1, row: 1 };
    if (frame === 3) return { col: 2, row: 1 };
  }

  if (direction === 'back' && type === 'idle') {
    return { col: 0, row: 2 };
  }

  if (direction === 'back' && type === 'walk') {
    if (frame === 0) return { col: 1, row: 2 };
    if (frame === 1) return { col: 2, row: 2 };
  }

  // For left direction, use right walk frames mirrored
  if (direction === 'left' && type === 'walk') {
    if (frame === 0) return { col: 1, row: 0 };
    if (frame === 1) return { col: 2, row: 0 };
    if (frame === 2) return { col: 1, row: 1 };
    if (frame === 3) return { col: 2, row: 1 };
  }

  if (direction === 'left' && type === 'idle') {
    return { col: 0, row: 0 }; // Use front idle for left idle
  }

  // Default to front idle frame 0
  return { col: 0, row: 0 };
};

