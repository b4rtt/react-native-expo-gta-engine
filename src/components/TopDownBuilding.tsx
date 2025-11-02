import React from 'react';
import { Rect, Path, Group, Skia } from '@shopify/react-native-skia';
import { Tile } from '../types/Game';
import { TILE_SIZE, TILE_HEIGHT } from '../utils/Isometric';
import { Vector2 } from '../types/Game';

interface TopDownBuildingProps {
  tile: Tile;
  camera: Vector2;
}

export const TopDownBuilding: React.FC<TopDownBuildingProps> = ({
  tile,
  camera,
}) => {
  const buildingHeight = tile.buildingHeight || 1;
  const worldX = tile.x * TILE_SIZE;
  const worldY = tile.y * TILE_SIZE;
  
  const screenX = worldX - camera.x;
  const screenY = worldY - camera.y;
  
  const buildingSize = TILE_SIZE * 0.8;
  const offset = (TILE_SIZE - buildingSize) / 2;
  const height = buildingHeight * TILE_HEIGHT;
  
  // 3D building - top view with height visualization
  const baseX = screenX + offset;
  const baseY = screenY + offset;
  
  // Calculate shadow offset (buildings cast shadow)
  const shadowOffset = height * 0.3;
  
  // Base (ground floor)
  const basePath = Skia.Path.Make();
  basePath.addRect({ x: baseX, y: baseY, width: buildingSize, height: buildingSize });
  
  // Top face (roof) - slightly offset to show height
  const roofX = baseX - shadowOffset * 0.3;
  const roofY = baseY - shadowOffset * 0.3;
  const roofPath = Skia.Path.Make();
  roofPath.addRect({ x: roofX, y: roofY, width: buildingSize, height: buildingSize });
  
  // Walls (visible from top-down as outlines)
  const wallColor = buildingHeight > 2 ? '#666666' : '#888888';
  
  return (
    <Group>
      {/* Building shadow */}
      <Rect
        x={baseX + shadowOffset}
        y={baseY + shadowOffset}
        width={buildingSize}
        height={buildingSize}
        color="rgba(0, 0, 0, 0.3)"
      />
      
      {/* Building base (darker for taller buildings) */}
      <Path
        path={basePath}
        color={buildingHeight > 2 ? '#4a4a4a' : '#6a6a6a'}
      />
      
      {/* Building walls (visible as darker edges) */}
      <Group>
        {/* Top edge */}
        <Rect
          x={baseX}
          y={baseY}
          width={buildingSize}
          height={2}
          color={wallColor}
        />
        {/* Left edge */}
        <Rect
          x={baseX}
          y={baseY}
          width={2}
          height={buildingSize}
          color={wallColor}
        />
        {/* Right edge */}
        <Rect
          x={baseX + buildingSize - 2}
          y={baseY}
          width={2}
          height={buildingSize}
          color={wallColor}
        />
        {/* Bottom edge */}
        <Rect
          x={baseX}
          y={baseY + buildingSize - 2}
          width={buildingSize}
          height={2}
          color={wallColor}
        />
      </Group>
      
      {/* Roof (lighter, slightly offset) */}
      <Path
        path={roofPath}
        color={buildingHeight > 2 ? '#9a9a9a' : '#aaaaaa'}
      />
      
      {/* Roof outline */}
      <Rect
        x={roofX}
        y={roofY}
        width={buildingSize}
        height={buildingSize}
        color="#333333"
        style="stroke"
        strokeWidth={1}
      />
      
      {/* Height indicator lines (connecting base to roof) */}
      {buildingHeight > 1 && (
        <Group>
          {/* Corner lines showing height */}
          <Rect
            x={baseX - 1}
            y={baseY - 1}
            width={1}
            height={shadowOffset}
            color={wallColor}
          />
          <Rect
            x={baseX + buildingSize}
            y={baseY - 1}
            width={1}
            height={shadowOffset}
            color={wallColor}
          />
          <Rect
            x={baseX - 1}
            y={baseY + buildingSize}
            width={1}
            height={shadowOffset}
            color={wallColor}
          />
          <Rect
            x={baseX + buildingSize}
            y={baseY + buildingSize}
            width={1}
            height={shadowOffset}
            color={wallColor}
          />
        </Group>
      )}
    </Group>
  );
};


