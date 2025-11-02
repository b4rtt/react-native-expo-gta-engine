import { Tile } from '../types/Game';

export type TileLookup = Map<string, Tile>;

export const buildTileLookup = (tiles: Tile[]): TileLookup => {
  const map: TileLookup = new Map();
  for (const tile of tiles) {
    map.set(`${tile.x},${tile.y}`, tile);
  }
  return map;
};

export const getTileAt = (lookup: TileLookup, tileX: number, tileY: number): Tile | undefined => {
  return lookup.get(`${tileX},${tileY}`);
};

