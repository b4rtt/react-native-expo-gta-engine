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

  return (
    <Group>
      <Rect
        x={style.shadow.x}
        y={style.shadow.y}
        width={style.shadow.width}
        height={style.shadow.height}
        color="rgba(0,0,0,0.28)"
      />
      <Rect
        x={style.body.x}
        y={style.body.y}
        width={style.body.width}
        height={style.body.height}
        color={style.bodyColor}
      />
      <Rect
        x={style.body.x}
        y={style.body.y}
        width={style.body.width}
        height={style.body.height}
        color={style.bodyBorderColor}
        style="stroke"
        strokeWidth={1}
      />
      <Rect
        x={style.roof.x}
        y={style.roof.y}
        width={style.roof.width}
        height={style.roof.height}
        color={style.roofColor}
      />
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
    </Group>
  );
};
