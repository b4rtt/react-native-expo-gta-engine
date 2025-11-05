import React from 'react';
import { Group, Rect } from '@shopify/react-native-skia';
import { Tile } from '../types/Game';
import { computeBuildingStyle } from '../utils/BuildingStyle';

interface IsometricBuildingProps {
  tile: Tile;
  screenX: number;
  screenY: number;
}

export const IsometricBuilding: React.FC<IsometricBuildingProps> = ({
  tile,
  screenX,
  screenY,
}) => {
  const style = computeBuildingStyle(tile, screenX, screenY);
  const buildingHeight = Math.max(1, tile.buildingHeight || 1);
  const floorHeight = style.body.height / buildingHeight;

  return (
    <Group>
      {/* Shadow */}
      <Rect
        x={style.shadow.x}
        y={style.shadow.y}
        width={style.shadow.width}
        height={style.shadow.height}
        color="rgba(0,0,0,0.28)"
      />
      
      {/* Building body with color ramp */}
      {style.facadeColors.map((color, index) => {
        const floorY = style.body.y + (buildingHeight - index - 1) * floorHeight;
        return (
          <Rect
            key={`floor-${index}`}
            x={style.body.x}
            y={floorY}
            width={style.body.width}
            height={floorHeight}
            color={color}
          />
        );
      })}
      
      {/* Body border */}
      <Rect
        x={style.body.x}
        y={style.body.y}
        width={style.body.width}
        height={style.body.height}
        color={style.bodyBorderColor}
        style="stroke"
        strokeWidth={1}
      />
      
      {/* Windows */}
      {style.windows.map((windowRect, index) => (
        <Rect
          key={`window-${index}`}
          x={windowRect.x}
          y={windowRect.y}
          width={windowRect.width}
          height={windowRect.height}
          color={style.windowColor}
        />
      ))}
      
      {/* Building details (doors, stairs, etc.) */}
      {style.details.map((detail, index) => {
        if (detail.type === 'door' || detail.type === 'stairs') {
          return (
            <Rect
              key={`detail-${index}`}
              x={detail.rect.x}
              y={detail.rect.y}
              width={detail.rect.width}
              height={detail.rect.height}
              color={detail.color || '#3a2a2a'}
            />
          );
        }
        // Rooftop props
        return (
          <Rect
            key={`detail-${index}`}
            x={detail.rect.x}
            y={detail.rect.y}
            width={detail.rect.width}
            height={detail.rect.height}
            color={detail.color || '#666666'}
          />
        );
      })}
      
      {/* Roof */}
      <Rect
        x={style.roof.x}
        y={style.roof.y}
        width={style.roof.width}
        height={style.roof.height}
        color={style.roofColor}
      />
    </Group>
  );
};
