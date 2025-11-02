import { Camera, Vector2 } from '../types/Game';
import { worldToIsometric } from '../utils/Isometric';

export const createCamera = (x: number, y: number): Camera => {
  // Initialize camera in isometric space
  const isoPos = worldToIsometric({ x, y, z: 0 });
  return {
    position: { x: isoPos.x, y: isoPos.y },
    zoom: 1,
  };
};

export const updateCamera = (
  camera: Camera,
  target: Vector2,
  screenWidth: number,
  screenHeight: number,
  deltaTime: number
): Camera => {
  // GTA 2 style: Camera is LOCKED to player (no smooth follow)
  // Player is always centered on screen
  
  // Convert target world position to isometric coordinates
  const targetIso = worldToIsometric({ x: target.x, y: target.y, z: 0 });

  // Direct camera lock - no interpolation
  return {
    ...camera,
    position: {
      x: targetIso.x,
      y: targetIso.y,
    },
  };
};

export const worldToScreen = (
  worldPos: Vector2,
  camera: Camera
): Vector2 => {
  return {
    x: worldPos.x - camera.position.x,
    y: worldPos.y - camera.position.y,
  };
};
