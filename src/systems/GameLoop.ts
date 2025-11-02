import { GameState, Vector2 } from '../types/Game';
import { createPlayer, updatePlayer } from '../entities/Player';
import { createCamera, updateCamera } from './Camera';
import { generateCityMap } from '../utils/CityMap';
import { TILE_SIZE } from '../utils/Isometric';
import { buildTileLookup, TileLookup } from '../utils/TileLookup';
import { generateCoins, resolveCoinCollection } from '../utils/Collectibles';

export class GameLoop {
  private gameState: GameState;
  private input: Vector2 = { x: 0, y: 0 };
  private screenWidth: number = 0;
  private screenHeight: number = 0;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private onUpdate: (state: GameState) => void;
  private tileLookup: TileLookup;

  constructor(onUpdate: (state: GameState) => void) {
    this.onUpdate = onUpdate;
    // Generate city map (30x30 tiles for a bigger city)
    const tiles = generateCityMap(30, 30);
    this.tileLookup = buildTileLookup(tiles);
    const collectibles = generateCoins(tiles);
    
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
