import React from 'react';
import { Rect } from '@shopify/react-native-skia';
import { Tile } from '../types/Game';
import { TILE_SIZE } from '../utils/Isometric';
import { Vector2 } from '../types/Game';

interface TopDownGrassProps {
  tile: Tile;
  camera: Vector2;
}

export const TopDownGrass: React.FC<TopDownGrassProps> = ({
  tile,
  camera,
}) => {
  const worldX = tile.x * TILE_SIZE;
  const worldY = tile.y * TILE_SIZE;
  
  const screenX = worldX - camera.x;
  const screenY = worldY - camera.y;
  
  return (
    <Rect
      x={screenX}
      y={screenY}
      width={TILE_SIZE}
      height={TILE_SIZE}
      color="#4a7c3f"
    />
  );
};

