import { Tile, TileType } from '../types/Game';

/**
 * Generate a GTA 2-style city map with buildings and road grid
 */
const BLOCK_SIZE = 5;

export const generateCityMap = (width: number, height: number): Tile[] => {
  const tiles: Tile[] = [];

  // Create a grid of tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let type: TileType = 'grass';
      
      // Create roads in a grid pattern (every 5th tile)
      const isRoadX = x % BLOCK_SIZE === 0;
      const isRoadY = y % BLOCK_SIZE === 0;
      
      if (isRoadX || isRoadY) {
        type = 'road';
      }

      // Add sidewalks/pavement hugging the road grid
      if (type === 'grass') {
        const isPavementX =
          x % BLOCK_SIZE === 1 || x % BLOCK_SIZE === BLOCK_SIZE - 1;
        const isPavementY =
          y % BLOCK_SIZE === 1 || y % BLOCK_SIZE === BLOCK_SIZE - 1;
        if (isPavementX || isPavementY) {
          type = 'pavement';
        }
      }
      
      // Create buildings in city blocks
      if (type === 'grass') {
        // City block coordinates
        const blockX = x % BLOCK_SIZE;
        const blockY = y % BLOCK_SIZE;
        
        // Place buildings in center of blocks with some variation
        if ((blockX === 2 || blockX === 3) && (blockY === 2 || blockY === 3)) {
          // Use pseudo-random but deterministic building placement
          const seed = x * 73 + y * 37;
          if (seed % 3 !== 0) { // 66% chance of building
            type = 'building';
            // Taller buildings in city center, shorter on edges
            const distFromCenter = Math.abs(x - width / 2) + Math.abs(y - height / 2);
            const maxHeight = Math.max(1, 4 - Math.floor(distFromCenter / 10));
            const heightVariation = (seed % maxHeight) + 1;
            tiles.push({
              x,
              y,
              type,
              buildingHeight: Math.min(heightVariation, maxHeight),
            });
            continue;
          }
        }
      }
      
      tiles.push({
        x,
        y,
        type,
      });
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
