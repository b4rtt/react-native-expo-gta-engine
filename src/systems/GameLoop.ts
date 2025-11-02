import { GameState, Vector2, WeaponId, NPC, Tile, TileType } from '../types/Game';
import { createPlayer, updatePlayer } from '../entities/Player';
import { createCamera, updateCamera } from './Camera';
import { generateCityMap } from '../utils/CityMap';
import { TILE_SIZE } from '../utils/Isometric';
import { buildTileLookup, TileLookup } from '../utils/TileLookup';
import { add, multiply, normalize, length } from '../utils/Math';
import { generateCoins, resolveCoinCollection } from '../utils/Collectibles';

const NPC_COUNT = 12;
const NPC_SPEED = 70;
const NPC_COLORS = ['#f07167', '#6a994e', '#4d96ff', '#ffb703', '#8338ec', '#ff6f91'];
const WALKABLE_TILE_TYPES: TileType[] = ['pavement', 'grass'];

const randomElement = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const tileCenter = (tile: Tile): Vector2 => ({
  x: tile.x * TILE_SIZE + TILE_SIZE / 2,
  y: tile.y * TILE_SIZE + TILE_SIZE / 2,
});

const isBlockingTileType = (type?: TileType): boolean => type === 'building';

const collidesWithBlocking = (position: Vector2, radius: number, lookup: TileLookup): boolean => {
  const offsets = [
    { x: radius, y: 0 },
    { x: -radius, y: 0 },
    { x: 0, y: radius },
    { x: 0, y: -radius },
    { x: 0, y: 0 },
  ];

  for (const offset of offsets) {
    const sampleX = position.x + offset.x;
    const sampleY = position.y + offset.y;
    const tileX = Math.floor(sampleX / TILE_SIZE);
    const tileY = Math.floor(sampleY / TILE_SIZE);
    const tile = lookup.get(`${tileX},${tileY}`);
    if (isBlockingTileType(tile?.type)) {
      return true;
    }
  }

  return false;
};

const pickRandomTarget = (walkableTiles: Tile[]): Vector2 => {
  const tile = randomElement(walkableTiles);
  return tileCenter(tile);
};

const createNPCs = (walkableTiles: Tile[]): NPC[] => {
  if (walkableTiles.length === 0) {
    return [];
  }

  return Array.from({ length: NPC_COUNT }).map((_, index) => {
    const spawnTile = randomElement(walkableTiles);
    const spawnPosition = tileCenter(spawnTile);
    return {
      id: `npc-${index}`,
      position: spawnPosition,
      rotation: 0,
      speed: 0,
      size: 26,
      target: pickRandomTarget(walkableTiles),
      color: NPC_COLORS[index % NPC_COLORS.length],
      behavior: 'wander' as const,
    };
  });
};

const updateNPCs = (
  npcs: NPC[],
  playerPosition: Vector2,
  tileLookup: TileLookup,
  deltaTime: number,
  walkableTiles: Tile[]
): NPC[] => {
  if (walkableTiles.length === 0) {
    return npcs;
  }

  return npcs.map((npc) => {
    let target = npc.target;
    const toTarget = {
      x: target.x - npc.position.x,
      y: target.y - npc.position.y,
    };
    const distanceToTarget = length(toTarget);

    if (distanceToTarget < TILE_SIZE * 0.35) {
      target = pickRandomTarget(walkableTiles);
    }

    const direction = distanceToTarget > 0 ? normalize(toTarget) : { x: 0, y: 0 };
    const desiredVelocity = multiply(direction, NPC_SPEED);
    const proposedPosition = add(npc.position, multiply(desiredVelocity, deltaTime));
    const radius = npc.size / 2;

    let finalPosition = proposedPosition;
    if (collidesWithBlocking(proposedPosition, radius, tileLookup)) {
      target = pickRandomTarget(walkableTiles);
      finalPosition = npc.position;
    }

    const toPlayer = {
      x: finalPosition.x - playerPosition.x,
      y: finalPosition.y - playerPosition.y,
    };
    if (length(toPlayer) < TILE_SIZE * 0.6) {
      target = pickRandomTarget(walkableTiles);
      finalPosition = npc.position;
    }

    return {
      ...npc,
      position: finalPosition,
      target,
      speed: length(desiredVelocity),
    };
  });
};

export class GameLoop {
  private gameState: GameState;
  private input: Vector2 = { x: 0, y: 0 };
  private screenWidth: number = 0;
  private screenHeight: number = 0;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private onUpdate: (state: GameState) => void;
  private tileLookup: TileLookup;
  private npcWalkableTiles: Tile[];

  constructor(onUpdate: (state: GameState) => void) {
    this.onUpdate = onUpdate;
    // Generate city map (30x30 tiles for a bigger city)
    const tiles = generateCityMap(30, 30);
    this.tileLookup = buildTileLookup(tiles);
    this.npcWalkableTiles = tiles.filter(tile => WALKABLE_TILE_TYPES.includes(tile.type));
    const collectibles = generateCoins(tiles);
    const weapons: WeaponId[] = ['fist', 'pistol', 'knife', 'bat'];
    
    // Start player in center of map in world coordinates
    const startTileX = 15;
    const startTileY = 15;
    const startWorldX = startTileX * TILE_SIZE + TILE_SIZE / 2;
    const startWorldY = startTileY * TILE_SIZE + TILE_SIZE / 2;
    
    this.gameState = {
      player: createPlayer(startWorldX, startWorldY),
      camera: createCamera(startWorldX, startWorldY),
      entities: [],
      tiles,
      collectibles,
      stats: {
        coinsCollected: 0,
        cash: 0,
        health: 100,
        maxHealth: 100,
        wantedLevel: 0,
      },
      weapons,
      selectedWeapon: weapons[0],
      npcs: createNPCs(this.npcWalkableTiles),
      lastUpdate: 0,
    };
  }

  setScreenSize(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  setInput(input: Vector2) {
    this.input = { x: input.x, y: input.y };
  }

  setSelectedWeapon(weapon: WeaponId) {
    if (!this.gameState.weapons.includes(weapon)) {
      return;
    }

    if (this.gameState.selectedWeapon === weapon) {
      return;
    }

    this.gameState = {
      ...this.gameState,
      selectedWeapon: weapon,
    };

    this.onUpdate(this.gameState);
  }

  start() {
    this.lastTime = performance.now();
    this.update();
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private update = () => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update player (returns new player object)
    const updatedPlayer = updatePlayer(
      this.gameState.player,
      this.input,
      deltaTime,
      this.tileLookup
    );

    const updatedNPCs = updateNPCs(
      this.gameState.npcs,
      updatedPlayer.position,
      this.tileLookup,
      deltaTime,
      this.npcWalkableTiles
    );

    const {
      collectibles: updatedCollectibles,
      collectedValue,
    } = resolveCoinCollection(
      this.gameState.collectibles,
      updatedPlayer.position,
      updatedPlayer.size / 2
    );

    const updatedStats = collectedValue
      ? {
          ...this.gameState.stats,
          coinsCollected: this.gameState.stats.coinsCollected + collectedValue,
          cash: this.gameState.stats.cash + collectedValue * 10,
        }
      : this.gameState.stats;
    
    // Update camera (returns new camera object)
    const updatedCamera = updateCamera(
      this.gameState.camera,
      updatedPlayer.position,
      this.screenWidth,
      this.screenHeight,
      deltaTime
    );

    // Create new game state object (immutable update for React)
    this.gameState = {
      ...this.gameState,
      player: updatedPlayer,
      camera: updatedCamera,
      collectibles: updatedCollectibles,
      stats: updatedStats,
      npcs: updatedNPCs,
      lastUpdate: currentTime,
    };

    // Call update callback with NEW game state
    this.onUpdate(this.gameState);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.update);
  };

  getState(): GameState {
    return this.gameState;
  }
}
