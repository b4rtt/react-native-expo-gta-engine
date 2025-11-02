export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type TileType = 'grass' | 'pavement' | 'road' | 'building';

export type CollectibleType = 'coin';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  buildingHeight?: number; // For buildings
}

export interface Entity {
  id: string;
  position: Vector2;
  rotation: number;
  speed: number;
  size: number;
}

export interface Collectible {
  id: string;
  type: CollectibleType;
  position: Vector2;
  radius: number;
  value: number;
  collected: boolean;
}

export type Direction = 'front' | 'back' | 'right' | 'left';
export type AnimationType = 'idle' | 'walk';

export interface SpriteAnimation {
  direction: Direction;
  type: AnimationType;
  currentFrame: number;
  frameTime: number;
  frameDuration: number;
}

export interface Player extends Entity {
  velocity: Vector2;
  maxSpeed: number;
  animation: SpriteAnimation;
}

export interface Camera {
  position: Vector2;
  zoom: number;
}

export interface GameStats {
  coinsCollected: number;
  cash: number;
  health: number;
  maxHealth: number;
  wantedLevel: number; // 0-6
}

export interface GameState {
  player: Player;
  camera: Camera;
  entities: Entity[];
  tiles: Tile[];
  collectibles: Collectible[];
  stats: GameStats;
  lastUpdate: number;
}
