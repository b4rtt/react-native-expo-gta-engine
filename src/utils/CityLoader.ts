import { Tile, TileType, RoadConnection } from '../types/Game';
import { generateCityMap } from './CityMap';

/**
 * City layout format:
 * - JSON: Array of arrays, where each inner array is a row
 * - CSV: Comma-separated values, each row on a new line
 * 
 * Tile type mapping:
 * - 'g' or 'G' = grass
 * - 'p' or 'P' = pavement
 * - 'r' or 'R' = road
 * - 'b' or 'B' = building
 * - 'w' or 'W' = water
 * - 'X' or 'x' = bridge
 * 
 * Building heights can be specified with numbers:
 * - 'b1', 'b2', 'b3', etc. = building with height 1, 2, 3...
 */

export interface CityLayoutData {
  width: number;
  height: number;
  tiles: Tile[];
}

/**
 * Parse a single tile character/number into TileType and optional building height
 */
const parseTileType = (char: string): { type: TileType; buildingHeight?: number } => {
  const lower = char.toLowerCase();
  
  // Check for building with height (b1, b2, b3, etc.)
  if (lower.startsWith('b') && lower.length > 1) {
    const height = parseInt(lower.substring(1), 10);
    if (!isNaN(height) && height > 0) {
      return { type: 'building', buildingHeight: height };
    }
  }
  
  // Standard tile types
  switch (lower) {
    case 'g':
      return { type: 'grass' };
    case 'p':
      return { type: 'pavement' };
    case 'r':
      return { type: 'road' };
    case 'b':
      return { type: 'building', buildingHeight: 1 }; // Default building height
    case 'w':
      return { type: 'water' };
    case 'x':
      return { type: 'bridge' };
    default:
      return { type: 'grass' }; // Default fallback
  }
};

/**
 * Calculate road connections for a road tile
 */
const getRoadConnections = (
  layout: string[][],
  x: number,
  y: number,
  width: number,
  height: number
): RoadConnection => {
  const isRoadTile = (tx: number, ty: number): boolean => {
    if (tx < 0 || tx >= width || ty < 0 || ty >= height) {
      return false;
    }
    const tile = layout[ty]?.[tx]?.toLowerCase();
    return tile === 'r' || tile === 'x'; // Roads and bridges
  };

  return {
    north: isRoadTile(x, y - 1),
    south: isRoadTile(x, y + 1),
    east: isRoadTile(x + 1, y),
    west: isRoadTile(x - 1, y),
  };
};

/**
 * Load city layout from JSON format
 * Expected format: { width: number, height: number, layout: string[][] }
 * Or simpler: string[][] (array of arrays)
 */
export const loadCityFromJSON = (jsonData: any): CityLayoutData | null => {
  try {
    let layout: string[][];
    let width: number;
    let height: number;

    // Handle different JSON formats
    if (Array.isArray(jsonData)) {
      // Simple format: just array of arrays
      layout = jsonData.map(row => 
        Array.isArray(row) ? row.map(cell => String(cell)) : []
      );
      height = layout.length;
      width = layout.length > 0 ? layout[0].length : 0;
    } else if (jsonData.layout && Array.isArray(jsonData.layout)) {
      // Object format: { width, height, layout }
      layout = jsonData.layout.map((row: any) => 
        Array.isArray(row) ? row.map((cell: any) => String(cell)) : []
      );
      width = jsonData.width || (layout.length > 0 ? layout[0].length : 0);
      height = jsonData.height || layout.length;
    } else {
      return null;
    }

    if (width === 0 || height === 0) {
      return null;
    }

    // Convert layout to tiles
    const tiles: Tile[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = layout[y]?.[x] || 'g';
        const { type, buildingHeight } = parseTileType(cell);

        const tile: Tile = {
          x,
          y,
          type,
        };

        if (buildingHeight !== undefined) {
          tile.buildingHeight = buildingHeight;
        }

        // Add road connections for roads and bridges
        if (type === 'road' || type === 'bridge') {
          tile.roadConnections = getRoadConnections(layout, x, y, width, height);
        }

        tiles.push(tile);
      }
    }

    return { width, height, tiles };
  } catch (error) {
    console.error('Failed to load city from JSON:', error);
    return null;
  }
};

/**
 * Load city layout from CSV format
 * Expected format: Comma-separated values, each row on a new line
 */
export const loadCityFromCSV = (csvText: string): CityLayoutData | null => {
  try {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return null;
    }

    const layout: string[][] = lines.map(line => 
      line.split(',').map(cell => cell.trim())
    );

    const height = layout.length;
    const width = layout.length > 0 ? layout[0].length : 0;

    if (width === 0 || height === 0) {
      return null;
    }

    // Ensure all rows have the same width
    for (let y = 0; y < height; y++) {
      while (layout[y].length < width) {
        layout[y].push('g'); // Fill with grass
      }
      layout[y] = layout[y].slice(0, width); // Trim if too long
    }

    // Convert layout to tiles
    const tiles: Tile[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = layout[y]?.[x] || 'g';
        const { type, buildingHeight } = parseTileType(cell);

        const tile: Tile = {
          x,
          y,
          type,
        };

        if (buildingHeight !== undefined) {
          tile.buildingHeight = buildingHeight;
        }

        // Add road connections for roads and bridges
        if (type === 'road' || type === 'bridge') {
          tile.roadConnections = getRoadConnections(layout, x, y, width, height);
        }

        tiles.push(tile);
      }
    }

    return { width, height, tiles };
  } catch (error) {
    console.error('Failed to load city from CSV:', error);
    return null;
  }
};

/**
 * Load city layout from a file (JSON or CSV)
 * Returns null if file cannot be loaded or parsed
 */
export const loadCityFromFile = async (
  filePath: string
): Promise<CityLayoutData | null> => {
  try {
    // In a real implementation, this would fetch the file
    // For now, we'll return null and use fallback
    // This can be extended to use fetch() or file system APIs
    console.warn('File loading not yet implemented, using fallback');
    return null;
  } catch (error) {
    console.error('Failed to load city from file:', error);
    return null;
  }
};

/**
 * Load city layout with fallback to procedural generation
 * @param jsonData Optional JSON data (object or string)
 * @param csvData Optional CSV data (string)
 * @param width Default width for procedural generation
 * @param height Default height for procedural generation
 */
export const loadCityLayout = (
  jsonData?: any,
  csvData?: string,
  width: number = 30,
  height: number = 30
): CityLayoutData => {
  // Try JSON first
  if (jsonData) {
    // If jsonData is a string, parse it
    let parsedJson = jsonData;
    if (typeof jsonData === 'string') {
      try {
        parsedJson = JSON.parse(jsonData);
      } catch (e) {
        console.warn('Failed to parse JSON, trying CSV...');
      }
    }
    
    const jsonResult = loadCityFromJSON(parsedJson);
    if (jsonResult) {
      console.log(`Loaded city from JSON: ${jsonResult.width}x${jsonResult.height}`);
      return jsonResult;
    }
  }

  // Try CSV second
  if (csvData) {
    const csvResult = loadCityFromCSV(csvData);
    if (csvResult) {
      console.log(`Loaded city from CSV: ${csvResult.width}x${csvResult.height}`);
      return csvResult;
    }
  }

  // Fallback to procedural generation
  console.log(`Using procedural generation: ${width}x${height}`);
  const tiles = generateCityMap(width, height);
  return { width, height, tiles };
};

