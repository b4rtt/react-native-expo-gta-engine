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

export interface GameState {
  player: Player;
  camera: Camera;
  entities: Entity[];
  tiles: Tile[];
  lastUpdate: number;
}
