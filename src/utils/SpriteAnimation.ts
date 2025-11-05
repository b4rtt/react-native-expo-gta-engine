import { SpriteAnimation, Direction, AnimationType, Vector2 } from '../types/Game';

// Spritesheet configuration: 6x3 grid (192x96 pixels)
export const SPRITE_SIZE = 32; // Size of each sprite frame
export const SPRITESHEET_COLS = 6;
export const SPRITESHEET_ROWS = 3;

// Animation frame counts
export const ANIMATION_FRAMES: Record<Direction, Record<AnimationType, number>> = {
  front: { idle: 2, walk: 2 }, // Idle: row 2 cols 4-5, Walk: row 2 cols 2-3 (dolů)
  back: { idle: 2, walk: 3 }, // Idle: row 2 cols 4-5, Walk: row 1 col 0 + row 2 cols 0-1 (nahoru)
  right: { idle: 2, walk: 2 }, // Idle: row 2 cols 4-5, Walk: row 0 cols 0,3 (doprava)
  left: { idle: 2, walk: 2 }, // Idle: row 2 cols 4-5, Walk: row 0 cols 0,3 (doprava, zrcadleno)
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
  // Spritesheet layout (6x3 grid, 192x96 pixels):
  // Row 0: Doprava (col 0), Doleva (col 1), Doleva (col 2), Doprava (col 3), Doleva (col 4), Doleva (col 5)
  // Row 1: Nahoru (col 0), Doprava (col 1), Doprava (col 2), Doprava (col 3), Doleva (col 4)
  // Row 2: Nahoru (col 0), Nahoru (col 1), Dolů (col 2), Dolů (col 3), Idle (col 4), Idle (col 5)

  // Idle: všichni používají row 2 cols 4-5 (2 idle frames)
  if (type === 'idle') {
    return { col: (frame % 2) + 4, row: 2 };
  }

  // Right walk: row 0 cols 0, 3 (doprava)
  if (direction === 'right' && type === 'walk') {
    const rightFrames = [0, 3];
    return { col: rightFrames[frame % 2], row: 0 };
  }

  // Left walk: row 0 cols 0, 3 (doprava) - protože když běží doleva, sprite ukazuje doprava
  if (direction === 'left' && type === 'walk') {
    const leftFrames = [0, 3]; // Použijeme doprava sprites, které se zrcadlí
    return { col: leftFrames[frame % 2], row: 0 };
  }

  // Front walk: row 2 cols 2-3 (dolů)
  if (direction === 'front' && type === 'walk') {
    return { col: (frame % 2) + 2, row: 2 }; // Dolů sprites z třetího řádku (cols 2-3)
  }

  // Back walk: row 1 col 0 + row 2 cols 0-1 (nahoru)
  if (direction === 'back' && type === 'walk') {
    const backFrames = [
      { col: 0, row: 1 }, // Row 1 col 0
      { col: 0, row: 2 }, // Row 2 col 0
      { col: 1, row: 2 }, // Row 2 col 1
    ];
    return backFrames[frame % 3];
  }

  // Default to idle frame
  return { col: 2, row: 2 };
};

