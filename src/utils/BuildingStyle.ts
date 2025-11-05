import { Tile } from '../types/Game';
import { TILE_SIZE } from './Isometric';

export interface BuildingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BuildingDetail {
  type: 'door' | 'entrance' | 'stairs' | 'vent' | 'antenna' | 'ac-unit' | 'water-tank';
  rect: BuildingRect;
  color?: string;
}

export interface BuildingStyle {
  shadow: BuildingRect;
  body: BuildingRect;
  roof: BuildingRect;
  windows: BuildingRect[];
  details: BuildingDetail[];
  bodyColor: string;
  bodyBorderColor: string;
  roofColor: string;
  windowColor: string;
  facadeColors: string[]; // Color ramp for different heights
}

const buildingBaseColors = ['#5a4a4a', '#4a5a5a', '#4a4a5a', '#5a5a4a', '#4a4a4a', '#6a5a4a', '#5a6a4a'];
const roofColors = ['#7a6a5a', '#6a7a5a', '#7a7a6a', '#8a7a6a', '#7a8a6a'];

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
  const seed = tile.x * 73 + tile.y * 37;

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
  const details: BuildingDetail[] = [];

  // Generate windows
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

  // Add entrance/door at ground level (front facade)
  const doorWidth = Math.max(12, Math.round(footprint * 0.25));
  const doorHeight = Math.max(16, Math.round(body.height * 0.15));
  const doorX = baseX + Math.round(footprint * 0.5 - doorWidth / 2);
  const doorY = baseY - doorHeight;
  
  details.push({
    type: 'door',
    rect: {
      x: doorX,
      y: doorY,
      width: doorWidth,
      height: doorHeight,
    },
    color: '#3a2a2a',
  });

  // Add entrance stairs
  if (buildingHeight > 1) {
    const stairsWidth = doorWidth + 4;
    const stairsHeight = 4;
    details.push({
      type: 'stairs',
      rect: {
        x: doorX - 2,
        y: baseY - stairsHeight,
        width: stairsWidth,
        height: stairsHeight,
      },
      color: '#4a3a3a',
    });
  }

  // Generate color ramp based on height
  const colorVariant = seed % buildingBaseColors.length;
  const baseColor = buildingBaseColors[colorVariant];
  const facadeColors: string[] = [];
  
  // Create color ramp - darker at bottom, lighter at top
  for (let i = 0; i < buildingHeight; i++) {
    const factor = 0.85 + (i / buildingHeight) * 0.15; // 0.85 to 1.0
    facadeColors.push(adjustBrightness(baseColor, factor));
  }

  // Roof color - choose from roof colors or brighten base
  const roofColorVariant = (seed * 11) % roofColors.length;
  const roofColor = buildingHeight > 3 
    ? roofColors[roofColorVariant] 
    : adjustBrightness(baseColor, 1.25);
  
  const borderColor = adjustBrightness(baseColor, 0.75);

  // Add rooftop props for taller buildings
  if (buildingHeight >= 3) {
    const roofCenterX = baseX + footprint / 2;
    const roofTopY = roof.y;

    // AC units (on roof edges)
    if (seed % 3 === 0) {
      const acSize = 8;
      details.push({
        type: 'ac-unit',
        rect: {
          x: baseX + 4,
          y: roofTopY - acSize,
          width: acSize,
          height: acSize,
        },
        color: '#888888',
      });
    }

    // Ventilation shafts
    if (seed % 4 === 0) {
      const ventSize = 6;
      details.push({
        type: 'vent',
        rect: {
          x: roofCenterX - ventSize / 2,
          y: roofTopY - ventSize * 1.5,
          width: ventSize,
          height: ventSize * 1.5,
        },
        color: '#666666',
      });
    }

    // Antennas (for tallest buildings)
    if (buildingHeight >= 4 && seed % 5 === 0) {
      const antennaWidth = 2;
      const antennaHeight = 12;
      details.push({
        type: 'antenna',
        rect: {
          x: roofCenterX - antennaWidth / 2,
          y: roofTopY - antennaHeight,
          width: antennaWidth,
          height: antennaHeight,
        },
        color: '#999999',
      });
    }

    // Water tanks (for very tall buildings)
    if (buildingHeight >= 5 && seed % 7 === 0) {
      const tankSize = 10;
      details.push({
        type: 'water-tank',
        rect: {
          x: baseX + footprint - tankSize - 4,
          y: roofTopY - tankSize,
          width: tankSize,
          height: tankSize,
        },
        color: '#777777',
      });
    }
  }

  return {
    shadow,
    body,
    roof,
    windows,
    details,
    bodyColor: baseColor,
    bodyBorderColor: borderColor,
    roofColor,
    windowColor: '#ffcc66',
    facadeColors,
  };
};

