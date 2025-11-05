import { GameState, Vector2, WeaponId } from '../types/Game';
import { createPlayer, updatePlayer } from '../entities/Player';
import { createCamera, updateCamera } from './Camera';
import { generateCityMap } from '../utils/CityMap';
import { buildTileLookup, TileLookup } from '../utils/TileLookup';
import { generateCoins, resolveCoinCollection } from '../utils/Collectibles';
import { spawnNPCsInCity, updateNPC } from '../entities/NPC';
import { generateProps } from '../utils/Props';
import { TILE_SIZE } from '../utils/Isometric';
import { serializeGameState, applySaveData, SaveData } from '../utils/SaveData';
import { Storage, SAVE_KEY_CONSTANT } from '../utils/Storage';

export class GameLoop {
  private gameState: GameState;
  private input: Vector2 = { x: 0, y: 0 };
  private screenWidth: number = 0;
  private screenHeight: number = 0;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private onUpdate: (state: GameState) => void;
  private tileLookup: TileLookup;
  private fpsHistory: number[] = [];
  private fpsUpdateInterval: number = 0;

  constructor(onUpdate: (state: GameState) => void) {
    this.onUpdate = onUpdate;
    // Generate city map (30x30 tiles for a bigger city)
    const tiles = generateCityMap(30, 30);
    this.tileLookup = buildTileLookup(tiles);
    const collectibles = generateCoins(tiles);
    const props = generateProps(tiles);
    const weapons: WeaponId[] = ['fist', 'pistol', 'knife', 'bat'];
    
    // Start player in center of map in world coordinates
    const startTileX = 15;
    const startTileY = 15;
    const startWorldX = startTileX * TILE_SIZE + TILE_SIZE / 2;
    const startWorldY = startTileY * TILE_SIZE + TILE_SIZE / 2;
    
    // Spawn NPCs across the city
    const npcs = spawnNPCsInCity(30, TILE_SIZE, 15, this.tileLookup);
    
    this.gameState = {
      player: createPlayer(startWorldX, startWorldY),
      camera: createCamera(startWorldX, startWorldY),
      entities: [],
      tiles,
      collectibles,
      props,
      stats: {
        coinsCollected: 0,
        cash: 0,
        health: 100,
        maxHealth: 100,
        wantedLevel: 0,
      },
      weapons,
      selectedWeapon: weapons[0],
      npcs,
      lastUpdate: 0,
      isPaused: false,
      fps: 0,
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

  pause() {
    if (this.gameState.isPaused) {
      return;
    }

    this.gameState = {
      ...this.gameState,
      isPaused: true,
    };

    this.onUpdate(this.gameState);
  }

  unpause() {
    if (!this.gameState.isPaused) {
      return;
    }

    this.gameState = {
      ...this.gameState,
      isPaused: false,
    };

    // Reset lastTime to prevent large delta time after unpause
    this.lastTime = performance.now();
    this.onUpdate(this.gameState);
  }

  togglePause() {
    if (this.gameState.isPaused) {
      this.unpause();
    } else {
      this.pause();
    }
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

    // If paused, don't update game logic, just schedule next frame
    if (this.gameState.isPaused) {
      this.animationFrameId = requestAnimationFrame(this.update);
      return;
    }

    // Calculate FPS (average over last second) - only when not paused
    const currentFPS = deltaTime > 0 ? 1 / deltaTime : 0;
    this.fpsHistory.push(currentFPS);
    // Keep only last 60 frames (roughly 1 second at 60fps)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }
    // Update FPS every ~0.5 seconds for smoother display
    this.fpsUpdateInterval += deltaTime;
    let avgFPS = this.gameState.fps || 0;
    if (this.fpsUpdateInterval >= 0.5) {
      avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      this.fpsUpdateInterval = 0;
    }

    // Update player (returns new player object)
    const updatedPlayer = updatePlayer(
      this.gameState.player,
      this.input,
      deltaTime,
      this.tileLookup
    );

    // Update each NPC individually with improved collision avoidance
    const updatedNPCs = this.gameState.npcs.map((npc) =>
      updateNPC(
        npc,
        deltaTime,
        this.tileLookup,
        updatedPlayer.position,
        this.gameState.npcs
      )
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
      fps: avgFPS,
    };

    // Call update callback with NEW game state
    this.onUpdate(this.gameState);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.update);
  };

  getState(): GameState {
    return this.gameState;
  }

  /**
   * Save current game state to storage
   */
  async save(): Promise<boolean> {
    try {
      const saveData = serializeGameState(this.gameState);
      const json = JSON.stringify(saveData);
      await Storage.save(SAVE_KEY_CONSTANT, json);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from storage and apply it
   */
  async load(): Promise<boolean> {
    try {
      const json = await Storage.load(SAVE_KEY_CONSTANT);
      if (!json) {
        return false;
      }

      const saveData: SaveData = JSON.parse(json);
      
      // Validate save data version
      if (saveData.version !== '1.0.0') {
        console.warn('Save data version mismatch:', saveData.version);
        return false;
      }

      // Apply save data to current game state
      this.gameState = applySaveData(this.gameState, saveData);
      
      // Update camera to match player position
      this.gameState.camera.position = { ...this.gameState.player.position };
      
      // Notify React of the updated state
      this.onUpdate(this.gameState);
      
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  /**
   * Check if a save file exists
   */
  static async hasSave(): Promise<boolean> {
    try {
      const json = await Storage.load(SAVE_KEY_CONSTANT);
      return json !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete save file
   */
  static async deleteSave(): Promise<boolean> {
    try {
      await Storage.remove(SAVE_KEY_CONSTANT);
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }
}
