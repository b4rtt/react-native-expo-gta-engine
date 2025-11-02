import React from 'react';
import { Path, Group, Skia } from '@shopify/react-native-skia';
import { Tile } from '../types/Game';
import { TILE_SIZE } from '../utils/Isometric';

export interface RoadNeighbors {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

interface IsometricRoadProps {
  tile: Tile;
  screenX: number;
  screenY: number;
  neighbors: RoadNeighbors;
}

export const IsometricRoad: React.FC<IsometricRoadProps> = ({
  tile,
  screenX,
  screenY,
  neighbors,
}) => {
  // GTA 2 uses rectangular tiles (NOT diamond shapes)
  const tileWidth = TILE_SIZE;
  const tileHeight = TILE_SIZE;
  
  // Create road tile path (rectangle - GTA 2 style)
  const roadPath = Skia.Path.Make();
  roadPath.addRect({
    x: screenX,
    y: screenY,
    width: tileWidth,
    height: tileHeight,
  });
  
  // Create road markings based on neighbors
  const markings: typeof roadPath[] = [];
  const centerX = screenX + tileWidth / 2;
  const centerY = screenY + tileHeight / 2;
  let intersectionPath: typeof roadPath | null = null;
  
  // Horizontal road markings (left-right roads)
  if (neighbors.left || neighbors.right) {
    const markingPath = Skia.Path.Make();
    markingPath.moveTo(screenX + tileWidth * 0.1, centerY);
    markingPath.lineTo(screenX + tileWidth * 0.9, centerY);
    markings.push(markingPath);
  }
  
  // Vertical road markings (top-bottom roads)
  if (neighbors.top || neighbors.bottom) {
    const markingPath = Skia.Path.Make();
    markingPath.moveTo(centerX, screenY + tileHeight * 0.1);
    markingPath.lineTo(centerX, screenY + tileHeight * 0.9);
    markings.push(markingPath);
  }

  if (
    (neighbors.left || neighbors.right) &&
    (neighbors.top || neighbors.bottom)
  ) {
    intersectionPath = Skia.Path.Make();
    const intersectionSize = tileWidth * 0.2;
    intersectionPath.addRect({
      x: centerX - intersectionSize / 2,
      y: centerY - intersectionSize / 2,
      width: intersectionSize,
      height: intersectionSize,
    });
  }
  
  return (
    <Group>
      {/* Road base with slightly darker color for GTA 2 style */}
      <Path path={roadPath} color="#2a2a2a" />
      {/* Add road texture/shading */}
      <Path path={roadPath} color="rgba(0,0,0,0.3)" style="stroke" strokeWidth={1} />
      {/* Road markings in yellow */}
      {markings.map((marking, i) => (
        <Path key={i} path={marking} color="#e0c030" style="stroke" strokeWidth={2} />
      ))}
      {intersectionPath && (
        <Path path={intersectionPath} color="rgba(255,255,255,0.15)" />
      )}
    </Group>
  );
};
