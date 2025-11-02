import React from 'react';
import { Rect, Line } from '@shopify/react-native-skia';
import { Tile } from '../types/Game';
import { TILE_SIZE } from '../utils/Isometric';
import { Vector2 } from '../types/Game';

interface TopDownRoadProps {
  tile: Tile;
  camera: Vector2;
  neighbors: { left: boolean; right: boolean; top: boolean; bottom: boolean };
}

export const TopDownRoad: React.FC<TopDownRoadProps> = ({
  tile,
  camera,
  neighbors,
}) => {
  const worldX = tile.x * TILE_SIZE;
  const worldY = tile.y * TILE_SIZE;
  
  const screenX = worldX - camera.x;
  const screenY = worldY - camera.y;
  
  const centerX = screenX + TILE_SIZE / 2;
  const centerY = screenY + TILE_SIZE / 2;
  
  return (
    <>
      {/* Road base */}
      <Rect
        x={screenX}
        y={screenY}
        width={TILE_SIZE}
        height={TILE_SIZE}
        color="#333333"
      />
      
      {/* Road markings */}
      {(neighbors.top || neighbors.bottom) && (
        <Line
          p1={{ x: screenX + TILE_SIZE * 0.2, y: centerY }}
          p2={{ x: screenX + TILE_SIZE * 0.8, y: centerY }}
          color="#ffff00"
          style="stroke"
          strokeWidth={2}
        />
      )}
      
      {(neighbors.left || neighbors.right) && (
        <Line
          p1={{ x: centerX, y: screenY + TILE_SIZE * 0.2 }}
          p2={{ x: centerX, y: screenY + TILE_SIZE * 0.8 }}
          color="#ffff00"
          style="stroke"
          strokeWidth={2}
        />
      )}
    </>
  );
};

