import React from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import { Tile } from '../types/Game';
import { TILE_SIZE } from '../utils/Isometric';

interface IsometricGrassProps {
  tile: Tile;
  screenX: number;
  screenY: number;
}

export const IsometricGrass: React.FC<IsometricGrassProps> = ({
  tile,
  screenX,
  screenY,
}) => {
  // GTA 2 uses rectangular tiles (NOT diamond shapes)
  const tileWidth = TILE_SIZE;
  const tileHeight = TILE_SIZE;
  
  // Create grass tile path (rectangle - GTA 2 style)
  const grassPath = Skia.Path.Make();
  grassPath.addRect({
    x: screenX,
    y: screenY,
    width: tileWidth,
    height: tileHeight,
  });
  
  const isPavement = tile.type === 'pavement' || tile.type === 'building';
  const colorVariant = (tile.x + tile.y) % 3;
  const palette = isPavement
    ? ['#5b5b5b', '#616161', '#585858']
    : ['#3d6b34', '#4a7c3f', '#416e38'];
  const baseColor = palette[colorVariant];
  return (
    <>
      <Path path={grassPath} color={baseColor} />
    </>
  );
};
