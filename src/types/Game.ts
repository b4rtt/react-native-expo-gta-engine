export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type TileType = 'grass' | 'pavement' | 'road' | 'building' | 'water' | 'bridge';

export type RoadConnection = {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
};

export type CollectibleType = 'coin';
export type WeaponId = 'fist' | 'pistol' | 'knife' | 'bat';
export type PropType = 'tree' | 'lamp-post' | 'bench' | 'trash-bin';

export interface Prop {
  id: string;
  type: PropType;
  position: Vector2;
  rotation: number;
  size: number;
}

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  buildingHeight?: number; // For buildings
  roadConnections?: RoadConnection; // For roads - which directions connect
}

export interface Entity {
  id: string;
  position: Vector2;
  rotation: number;
  speed: number;
  size: number;
}

export interface NPC extends Entity {
  target: Vector2;
  color: string;
  behavior: 'wander';
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
  npcs: NPC[];
  tiles: Tile[];
  collectibles: Collectible[];
  props: Prop[];
  stats: GameStats;
  weapons: WeaponId[];
  selectedWeapon: WeaponId;
  lastUpdate: number;
  isPaused: boolean;
  fps?: number; // Frames per second for debug overlay
}
