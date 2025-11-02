import { Vector2, Vector3 } from '../types/Game';

/**
 * Convert 3D world coordinates to 2D GTA 2-style projection
 * GTA 2 uses a top-down oblique projection (NO rotation!)
 * Camera looks down from above with slight 3D effect from building heights
 */
export const worldToIsometric = (worldPos: Vector3): Vector2 => {
  // GTA 2-style projection: pure top-down with NO rotation
  // X stays X, Y stays Y (buildings face north-south and east-west)
  // Only Z (height) affects the Y position for 3D depth
  
  return {
    x: worldPos.x,
    y: worldPos.y - worldPos.z * 0.5, // Height shifts things up visually
  };
};

/**
 * Convert screen coordinates to world coordinates (reverse GTA 2 projection)
 */
export const isometricToWorld = (screenPos: Vector2): Vector2 => {
  // Simple reverse: X stays X, Y stays Y
  return {
    x: screenPos.x,
    y: screenPos.y,
  };
};

/**
 * Tile size in isometric pixels
 */
export const TILE_SIZE = 64;
export const TILE_HEIGHT = TILE_SIZE / 2;

