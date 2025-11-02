import React from 'react';
import { Path, Group, Rect, Skia } from '@shopify/react-native-skia';
import { Tile } from '../types/Game';
import { TILE_SIZE, TILE_HEIGHT } from '../utils/Isometric';

// Helper function to adjust color brightness
const adjustBrightness = (hexColor: string, factor: number): string => {
  // Parse hex color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));
  const newB = Math.min(255, Math.floor(b * factor));
  
  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

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
  const buildingHeight = tile.buildingHeight || 1;
  const buildingSize = TILE_SIZE * 0.8; // Slightly smaller than tile

  // GTA 2 buildings: rectangular base with height offset for 3D effect
  const width = buildingSize;
  const depth = buildingSize;
  const height = buildingHeight * TILE_HEIGHT * 0.6;
  
  const offsetX = (TILE_SIZE - width) / 2;
  const offsetY = (TILE_SIZE - depth) / 2;
  const baseX = screenX + offsetX;
  const baseY = screenY + offsetY;
  
  // Top of building (shifted up by height)
  const topX = baseX;
  const topY = baseY - height;
  
  // Create building faces (GTA 2-style: rectangles with depth)
  // Top face (roof)
  const topPath = Skia.Path.Make();
  topPath.addRect({
    x: topX,
    y: topY,
    width: width,
    height: depth,
  });
  
  // North face (top edge visible)
  const northPath = Skia.Path.Make();
  northPath.moveTo(topX, topY);
  northPath.lineTo(topX + width, topY);
  northPath.lineTo(topX + width, baseY);
  northPath.lineTo(topX, baseY);
  northPath.close();
  
  // West face (left edge visible)
  const westPath = Skia.Path.Make();
  westPath.moveTo(topX, topY);
  westPath.lineTo(topX, topY + depth);
  westPath.lineTo(topX, baseY + depth);
  westPath.lineTo(topX, baseY);
  westPath.close();
  
  // Vary building colors for more interesting cityscape
  const colorVariant = ((tile.x * 7 + tile.y * 13) % 5);
  const buildingBaseColors = ['#5a4a4a', '#4a5a5a', '#4a4a5a', '#5a5a4a', '#4a4a4a'];
  const baseColor = buildingBaseColors[colorVariant];
  
  // Calculate lighter and darker shades for 3D effect
  const topColor = adjustBrightness(baseColor, 1.4);
  const rightColor = adjustBrightness(baseColor, 1.2);
  
  return (
    <Group>
      {/* Shadow (drawn first, below building) */}
      <Rect
        x={baseX + 4}
        y={baseY + 4}
        width={width}
        height={depth}
        color="rgba(0,0,0,0.3)"
      />
      
      {/* North face (darker) */}
      <Path path={northPath} color={baseColor} />
      
      {/* West face (darker) */}
      <Path path={westPath} color={adjustBrightness(baseColor, 0.85)} />
      
      {/* Top face / Roof (lightest) */}
      <Path path={topPath} color={topColor} />
      
      {/* Windows on visible faces */}
      {buildingHeight > 1 && (
        <Group>
          {Array.from({ length: Math.min(buildingHeight, 3) }).map((_, floor) => {
            const windowY = baseY - height + (height / buildingHeight) * floor + 8;
            return (
              <Group key={floor}>
                {/* Windows on north face */}
                {[0.2, 0.5, 0.8].map((pos, i) => (
                  <Rect
                    key={`n-${i}`}
                    x={topX + width * pos - 4}
                    y={windowY}
                    width={8}
                    height={(height / buildingHeight) * 0.3}
                    color="#ffcc66"
                  />
                ))}
              </Group>
            );
          })}
        </Group>
      )}
    </Group>
  );
};
