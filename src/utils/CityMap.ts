import { Tile, TileType, RoadConnection } from '../types/Game';

/**
 * Generate a GTA 2-style city map with varied roads and districts
 */

const roadMap = new Map<string, boolean>();

const isRoad = (x: number, y: number): boolean => {
  return roadMap.has(`${x},${y}`);
};

const createRoadNetwork = (width: number, height: number) => {
  roadMap.clear();
  
  // Create a clear grid pattern with some variation
  // Main roads every 6 tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const seed = x * 73 + y * 37;
      
      // Primary grid - every 6 tiles
      if (x % 6 === 0 || y % 6 === 0) {
        roadMap.set(`${x},${y}`, true);
      }
      
      // Downtown area - denser grid (every 4 tiles)
      const distFromCenter = Math.sqrt((x - width/2) ** 2 + (y - height/2) ** 2);
      if (distFromCenter < width * 0.25) {
        if (x % 4 === 0 || y % 4 === 0) {
          roadMap.set(`${x},${y}`, true);
        }
      }
      
      // Occasional secondary roads
      if (seed % 30 === 0 && x % 3 === 0) {
        // Vertical connector
        for (let dy = -3; dy <= 3; dy++) {
          if (y + dy >= 0 && y + dy < height) {
            roadMap.set(`${x},${y + dy}`, true);
          }
        }
      }
      if (seed % 35 === 0 && y % 3 === 0) {
        // Horizontal connector
        for (let dx = -3; dx <= 3; dx++) {
          if (x + dx >= 0 && x + dx < width) {
            roadMap.set(`${x + dx},${y}`, true);
          }
        }
      }
    }
  }
};

const getRoadConnections = (x: number, y: number): RoadConnection => {
  return {
    north: isRoad(x, y - 1),
    south: isRoad(x, y + 1),
    east: isRoad(x + 1, y),
    west: isRoad(x - 1, y),
  };
};

const waterMap = new Map<string, boolean>();

const isWater = (x: number, y: number): boolean => {
  return waterMap.has(`${x},${y}`);
};

const createWaterBodies = (width: number, height: number) => {
  waterMap.clear();
  
  // Main horizontal river - curves slightly for more organic feel
  const baseRiverY = Math.floor(height * 0.35);
  const riverWidth = 2; // 2 tiles wide
  
  for (let x = 0; x < width; x++) {
    // Add slight sine wave curve to make river more natural
    const curveOffset = Math.floor(Math.sin(x * 0.15) * 1.5);
    const riverY = baseRiverY + curveOffset;
    
    // Variable width - wider in some sections
    const localWidth = (x % 20 < 5) ? 3 : riverWidth; // Wider every ~20 tiles
    
    for (let dy = 0; dy < localWidth; dy++) {
      const y = riverY + dy;
      if (y >= 0 && y < height) {
        // Skip where roads cross (bridges will be added)
        if (!isRoad(x, y)) {
          waterMap.set(`${x},${y}`, true);
        }
      }
    }
  }
  
  // Vertical canal/river on the right side - connects to horizontal river
  const verticalCanalX = Math.floor(width * 0.65);
  const verticalCanalWidth = 2;
  const connectionY = baseRiverY; // Connect to horizontal river
  
  for (let y = 0; y < height; y++) {
    // Add slight curve
    const curveOffset = Math.floor(Math.sin(y * 0.12) * 1);
    const canalX = verticalCanalX + curveOffset;
    
    for (let dx = 0; dx < verticalCanalWidth; dx++) {
      const x = canalX + dx;
      if (x >= 0 && x < width) {
        // Skip where roads cross, but connect to horizontal river
        if (!isRoad(x, y) || (y >= connectionY - 1 && y <= connectionY + 2)) {
          waterMap.set(`${x},${y}`, true);
        }
      }
    }
  }
  
  // Smaller canal on the left side - also connects to main river
  const leftCanalX = Math.floor(width * 0.3);
  const leftCanalWidth = 1;
  const leftCanalStartY = Math.floor(height * 0.5);
  const leftCanalLength = Math.floor(height * 0.25);
  const leftConnectionY = baseRiverY;
  
  for (let y = leftCanalStartY; y < leftCanalStartY + leftCanalLength; y++) {
    // Curve toward connection point
    const progress = (y - leftCanalStartY) / leftCanalLength;
    const curveOffset = Math.floor((leftConnectionY - leftCanalStartY) * progress * 0.3);
    
    for (let dx = 0; dx < leftCanalWidth; dx++) {
      const x = leftCanalX + dx;
      const adjustedY = y + curveOffset;
      if (x >= 0 && x < width && adjustedY >= 0 && adjustedY < height) {
        if (!isRoad(x, adjustedY)) {
          waterMap.set(`${x},${adjustedY}`, true);
        }
      }
    }
  }
  
  // Connect left canal to main river
  for (let x = leftCanalX; x <= Math.floor(width * 0.4); x++) {
    const y = leftConnectionY;
    if (x >= 0 && x < width && y >= 0 && y < height) {
      if (!isRoad(x, y)) {
        waterMap.set(`${x},${y}`, true);
      }
    }
  }
  
  // Expand water slightly at connection points for natural look
  const expandWater = (x: number, y: number, radius: number) => {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius && !isRoad(nx, ny)) {
            waterMap.set(`${nx},${ny}`, true);
          }
        }
      }
    }
  };
  
  // Expand at river junctions
  expandWater(Math.floor(width * 0.65), baseRiverY, 1);
  expandWater(Math.floor(width * 0.4), baseRiverY, 1);
};

export const generateCityMap = (width: number, height: number): Tile[] => {
  const tiles: Tile[] = [];
  
  // First create road network
  createRoadNetwork(width, height);
  
  // Then create water bodies
  createWaterBodies(width, height);

  // Create a grid of tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let type: TileType = 'grass';
      const seed = x * 73 + y * 37;
      const distFromCenter = Math.sqrt((x - width/2) ** 2 + (y - height/2) ** 2);
      
      // Check if this is water
      if (isWater(x, y)) {
        // If road crosses water, make it a bridge
        if (isRoad(x, y)) {
          type = 'bridge';
        } else {
          type = 'water';
        }
        tiles.push({
          x,
          y,
          type,
        });
        continue;
      }
      
      // Check if this is a road
      if (isRoad(x, y)) {
        type = 'road';
      }

      // Add sidewalks/pavement next to roads
      if (type === 'grass') {
        const hasRoadNearby = 
          isRoad(x - 1, y) || isRoad(x + 1, y) || 
          isRoad(x, y - 1) || isRoad(x, y + 1);
        
        if (hasRoadNearby) {
          type = 'pavement';
        }
      }
      
      // Create buildings
      if (type === 'grass') {
        // More buildings in center, fewer on edges
        // Lower number = more buildings (50% chance in center, 40% on edges)
        const buildingChance = distFromCenter < width * 0.25 ? 2 : 
                               distFromCenter < width * 0.4 ? 3 : 5;
        
        if (seed % buildingChance === 0) {
          type = 'building';
          // Taller buildings in city center
          const maxHeight = distFromCenter < width * 0.2 ? 5 : 
                           distFromCenter < width * 0.35 ? 3 : 2;
          const heightVariation = 1 + (seed % maxHeight);
          tiles.push({
            x,
            y,
            type,
            buildingHeight: heightVariation,
          });
          continue;
        }
        
        // Additional scattered buildings
        if ((seed * 17) % 7 === 0) {
          type = 'building';
          const heightVariation = 1 + ((seed * 19) % 3);
          tiles.push({
            x,
            y,
            type,
            buildingHeight: heightVariation,
          });
          continue;
        }
      }
      
      // Add road connection metadata for roads
      const tile: Tile = {
        x,
        y,
        type,
      };
      
      if (type === 'road') {
        tile.roadConnections = getRoadConnections(x, y);
      }
      
      tiles.push(tile);
    }
  }

  return tiles;
};

/**
 * Get tile neighbors for road rendering
 */
export const getTileNeighbors = (
  tiles: Tile[],
  tile: Tile
): { left: boolean; right: boolean; top: boolean; bottom: boolean } => {
  return {
    left: tiles.some(t => t.x === tile.x - 1 && t.y === tile.y && t.type === 'road'),
    right: tiles.some(t => t.x === tile.x + 1 && t.y === tile.y && t.type === 'road'),
    top: tiles.some(t => t.x === tile.x && t.y === tile.y - 1 && t.type === 'road'),
    bottom: tiles.some(t => t.x === tile.x && t.y === tile.y + 1 && t.type === 'road'),
  };
};
