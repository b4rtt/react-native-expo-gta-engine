export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface VehicleInput {
  acceleration: number; // -1 (brake/reverse) to 1 (forward), 0 = no input
  steering: number; // -1 (left) to 1 (right), 0 = straight
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
export type WeaponType = 'melee' | 'ranged';
export type PropType = 'tree' | 'lamp-post' | 'bench' | 'trash-bin';

export interface WeaponInventory {
  [weaponId: string]: {
    ammo: number;
    maxAmmo: number;
  };
}

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
  health: number;
  maxHealth: number;
}

export interface Collectible {
  id: string;
  type: CollectibleType;
  position: Vector2;
  radius: number;
  value: number;
  collected: boolean;
}

export interface Projectile {
  id: string;
  position: Vector2;
  velocity: Vector2;
  rotation: number;
  damage: number;
  ownerId: string; // ID of who fired it (player, npc, etc)
  lifetime: number; // Time remaining before despawn (in seconds)
  maxLifetime: number; // Maximum lifetime
  weapon: WeaponId;
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
  inVehicle?: string; // ID of vehicle player is in, undefined if on foot
  lastShotTime: number; // Timestamp of last shot fired
  weaponInventory: WeaponInventory; // Ammo for each weapon
}

export interface Vehicle extends Entity {
  velocity: Vector2;
  maxSpeed: number;
  parked: boolean; // true if parked, false if being driven
  color: string; // Vehicle color
  type: 'car' | 'truck' | 'van';
  isPolice: boolean; // true if this is a police vehicle
  chasing: boolean; // true if actively chasing the player
  targetPosition?: Vector2; // Target position for AI chasing
  health: number; // Current health (0-100)
  maxHealth: number; // Maximum health
  destroyed: boolean; // true if vehicle is destroyed (exploded)
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

export interface TimeOfDay {
  hour: number; // 0-23
  minute: number; // 0-59
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night'; // Time period classification
  lightLevel: number; // 0-1, where 0 is darkest and 1 is brightest
}

export interface GameState {
  player: Player;
  camera: Camera;
  entities: Entity[];
  npcs: NPC[];
  vehicles: Vehicle[];
  tiles: Tile[];
  collectibles: Collectible[];
  props: Prop[];
  projectiles: Projectile[];
  stats: GameStats;
  weapons: WeaponId[];
  selectedWeapon: WeaponId;
  lastUpdate: number;
  isPaused: boolean;
  fps?: number; // Frames per second for debug overlay
  timeOfDay: TimeOfDay; // Current time of day
}
