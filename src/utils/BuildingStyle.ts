import { Tile } from '../types/Game';
import { TILE_SIZE } from './Isometric';

export interface BuildingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BuildingStyle {
  shadow: BuildingRect;
  body: BuildingRect;
  roof: BuildingRect;
  windows: BuildingRect[];
  bodyColor: string;
  bodyBorderColor: string;
  roofColor: string;
  windowColor: string;
}

const buildingBaseColors = ['#5a4a4a', '#4a5a5a', '#4a4a5a', '#5a5a4a', '#4a4a4a'];

const adjustBrightness = (hexColor: string, factor: number): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));
  const newB = Math.min(255, Math.floor(b * factor));

  return `#${newR.toString(16).padStart(2, '0')}${newG
    .toString(16)
    .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

export const computeBuildingStyle = (
  tile: Tile,
  screenX: number,
  screenY: number
): BuildingStyle => {
  const buildingHeight = Math.max(1, tile.buildingHeight || 1);

  const footprint = Math.round(TILE_SIZE * 0.78);
  const offset = Math.round((TILE_SIZE - footprint) / 2);
  const baseX = Math.round(screenX + offset);
  const baseY = Math.round(screenY + offset + footprint);

  const wallHeight = Math.round(buildingHeight * TILE_SIZE * 0.45);
  const roofThickness = Math.max(6, Math.round(TILE_SIZE * 0.12));

  const body: BuildingRect = {
    x: baseX,
    y: baseY - wallHeight,
    width: footprint,
    height: wallHeight,
  };

  const roof: BuildingRect = {
    x: baseX,
    y: body.y - roofThickness,
    width: footprint,
    height: roofThickness,
  };

  const shadow: BuildingRect = {
    x: baseX + 6,
    y: baseY + 4,
    width: footprint,
    height: Math.max(8, Math.round(footprint * 0.25)),
  };

  const floors = Math.min(buildingHeight, 3);
  const windows: BuildingRect[] = [];

  if (buildingHeight > 1) {
    const verticalSpacing = body.height / (floors + 1);
    const windowHeight = Math.max(6, Math.round(verticalSpacing * 0.45));
    const windowWidth = Math.max(10, Math.round(footprint * 0.18));
    const positions = [0.25, 0.5, 0.75];

    for (let floor = 0; floor < floors; floor += 1) {
      const centerY = Math.round(body.y + (floor + 1) * verticalSpacing);
      for (const fraction of positions) {
        windows.push({
          x: Math.round(baseX + footprint * fraction - windowWidth / 2),
          y: centerY - windowHeight / 2,
          width: windowWidth,
          height: windowHeight,
        });
      }
    }
  }

  const colorVariant = (tile.x * 7 + tile.y * 13) % buildingBaseColors.length;
  const baseColor = buildingBaseColors[colorVariant];
  const roofColor = adjustBrightness(baseColor, 1.2);
  const borderColor = adjustBrightness(baseColor, 0.75);

  return {
    shadow,
    body,
    roof,
    windows,
    bodyColor: baseColor,
    bodyBorderColor: borderColor,
    roofColor,
    windowColor: '#ffcc66',
  };
};

