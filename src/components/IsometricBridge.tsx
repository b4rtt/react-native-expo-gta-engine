import React from 'react';
import { Group, Rect } from '@shopify/react-native-skia';
import { Tile } from '../types/Game';
import { TILE_SIZE } from '../utils/Isometric';

interface IsometricBridgeProps {
  tile: Tile;
  screenX: number;
  screenY: number;
  neighbors: { left: boolean; right: boolean; top: boolean; bottom: boolean };
}

const BRIDGE_COLOR = '#4a4a4a';
const BRIDGE_BORDER = '#3a3a3a';
const WATER_COLOR = '#2a5a7a';

export const IsometricBridge: React.FC<IsometricBridgeProps> = ({
  tile,
  screenX,
  screenY,
  neighbors,
}) => {
  const isHorizontal = neighbors.left || neighbors.right;
  const bridgeWidth = isHorizontal ? TILE_SIZE : TILE_SIZE * 0.6;
  const bridgeHeight = isHorizontal ? TILE_SIZE * 0.6 : TILE_SIZE;
  const bridgeX = isHorizontal ? screenX : screenX + (TILE_SIZE - bridgeWidth) / 2;
  const bridgeY = isHorizontal ? screenY + (TILE_SIZE - bridgeHeight) / 2 : screenY;

  return (
    <Group>
      {/* Water background */}
      <Rect
        x={screenX}
        y={screenY}
        width={TILE_SIZE}
        height={TILE_SIZE}
        color={WATER_COLOR}
      />
      
      {/* Bridge deck */}
      <Rect
        x={bridgeX}
        y={bridgeY}
        width={bridgeWidth}
        height={bridgeHeight}
        color={BRIDGE_COLOR}
      />
      
      {/* Bridge border */}
      <Rect
        x={bridgeX}
        y={bridgeY}
        width={bridgeWidth}
        height={bridgeHeight}
        color={BRIDGE_BORDER}
        style="stroke"
        strokeWidth={2}
      />
      
      {/* Bridge planks/segments */}
      {isHorizontal ? (
        <>
          <Rect
            x={bridgeX + bridgeWidth * 0.25}
            y={bridgeY}
            width={2}
            height={bridgeHeight}
            color={BRIDGE_BORDER}
          />
          <Rect
            x={bridgeX + bridgeWidth * 0.5}
            y={bridgeY}
            width={2}
            height={bridgeHeight}
            color={BRIDGE_BORDER}
          />
          <Rect
            x={bridgeX + bridgeWidth * 0.75}
            y={bridgeY}
            width={2}
            height={bridgeHeight}
            color={BRIDGE_BORDER}
          />
        </>
      ) : (
        <>
          <Rect
            x={bridgeX}
            y={bridgeY + bridgeHeight * 0.25}
            width={bridgeWidth}
            height={2}
            color={BRIDGE_BORDER}
          />
          <Rect
            x={bridgeX}
            y={bridgeY + bridgeHeight * 0.5}
            width={bridgeWidth}
            height={2}
            color={BRIDGE_BORDER}
          />
          <Rect
            x={bridgeX}
            y={bridgeY + bridgeHeight * 0.75}
            width={bridgeWidth}
            height={2}
            color={BRIDGE_BORDER}
          />
        </>
      )}
    </Group>
  );
};

