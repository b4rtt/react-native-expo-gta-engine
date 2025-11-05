import { GameState, Vector2, WeaponId, Vehicle, Player } from '../types/Game';
import { createPlayer, updatePlayer } from '../entities/Player';
import { createCamera, updateCamera } from './Camera';
import { generateCityMap } from '../utils/CityMap';
import { loadCityLayout } from '../utils/CityLoader';
import { buildTileLookup, TileLookup, getTileAt } from '../utils/TileLookup';
import { generateCoins, resolveCoinCollection } from '../utils/Collectibles';
import { spawnNPCsInCity, updateNPC } from '../entities/NPC';
import { spawnVehiclesInCity, updateVehicle } from '../entities/Vehicle';
import { generateProps } from '../utils/Props';
import { TILE_SIZE } from '../utils/Isometric';
import { serializeGameState, applySaveData, SaveData } from '../utils/SaveData';
import { Storage, SAVE_KEY_CONSTANT } from '../utils/Storage';
import { length, subtract } from '../utils/Math';
import { createTimeOfDay, updateTimeOfDay } from '../utils/TimeOfDay';

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
  private lastExitAttempt: number = 0;
  private lastExitTime: number = 0; // Track when player last exited a vehicle
  private pendingExit: boolean = false; // Flag for manual exit request

  constructor(onUpdate: (state: GameState) => void, cityLayoutData?: any) {
    this.onUpdate = onUpdate;
    // Load city map - try external layout, fallback to procedural generation
    const cityData = loadCityLayout(cityLayoutData, undefined, 30, 30);
    const tiles = cityData.tiles;
    const cityWidth = cityData.width;
    const cityHeight = cityData.height;
    this.tileLookup = buildTileLookup(tiles);
    const collectibles = generateCoins(tiles);
    const props = generateProps(tiles);
    const weapons: WeaponId[] = ['fist', 'pistol', 'knife', 'bat'];
    
    // Start player in center of map in world coordinates
    const startTileX = Math.floor(cityWidth / 2);
    const startTileY = Math.floor(cityHeight / 2);
    const startWorldX = startTileX * TILE_SIZE + TILE_SIZE / 2;
    const startWorldY = startTileY * TILE_SIZE + TILE_SIZE / 2;
    
    // Spawn NPCs across the city
    const npcs = spawnNPCsInCity(cityWidth, TILE_SIZE, 15, this.tileLookup);
    
    // Spawn vehicles parked on roads
    const vehicles = spawnVehiclesInCity(cityWidth, TILE_SIZE, 20, this.tileLookup);
    
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
      vehicles,
      lastUpdate: 0,
      isPaused: false,
      fps: 0,
      timeOfDay: createTimeOfDay(12, 0), // Start at noon
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

  exitVehicle() {
    // Just set a flag - the actual exit will be handled in the next update cycle
    // This prevents race conditions and state conflicts
    if (this.gameState.player.inVehicle) {
      console.log('[GameLoop] exitVehicle called - setting pendingExit flag');
      this.pendingExit = true;
      this.lastExitAttempt = performance.now(); // Allow immediate exit
    }
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

    // Update time of day (only when not paused)
    // Time scale: 1.0 = 1 game minute per real second
    // For testing: 60.0 = 1 game hour per real second (much faster)
    const updatedTimeOfDay = updateTimeOfDay(this.gameState.timeOfDay, deltaTime, 60.0);

    // Handle vehicle entering/exiting
    let updatedVehicles = [...this.gameState.vehicles];
    let playerVehicle: Vehicle | undefined;
    
    if (this.gameState.player.inVehicle) {
      // Player is in a vehicle - find it
      playerVehicle = updatedVehicles.find(v => v.id === this.gameState.player.inVehicle);
      
      if (!playerVehicle || playerVehicle.parked) {
        // Vehicle not found or became parked (shouldn't happen) - exit vehicle
        const updatedPlayerNoVehicle = {
          ...this.gameState.player,
          inVehicle: undefined,
        };
        this.gameState = {
          ...this.gameState,
          player: updatedPlayerNoVehicle,
        };
        playerVehicle = undefined;
      }
    } else {
      // Check if player wants to enter a vehicle
      // Enter vehicle if: close to parked vehicle, stopped, and near vehicle
      // Prevent immediate re-entry after exit (0.5 second cooldown)
      const timeSinceExit = currentTime - this.lastExitTime;
      const enterDistance = 50; // Distance to enter vehicle
      const playerSpeed = length(this.gameState.player.velocity);
      
      if (playerSpeed < 20 && timeSinceExit > 500) { // Only enter when nearly stopped and after cooldown
        for (const vehicle of updatedVehicles) {
          if (vehicle.parked) {
            const dist = length(subtract(vehicle.position, this.gameState.player.position));
            if (dist < enterDistance) {
              // Enter vehicle
              playerVehicle = vehicle;
              updatedVehicles = updatedVehicles.map(v =>
                v.id === vehicle.id ? { ...v, parked: false } : v
              );
              break;
            }
          }
        }
      }
    }
    
    // Update vehicle if player is driving it
    if (playerVehicle && !playerVehicle.parked) {
      const vehicleIndex = updatedVehicles.findIndex(v => v.id === playerVehicle!.id);
      if (vehicleIndex >= 0) {
        updatedVehicles[vehicleIndex] = updateVehicle(
          updatedVehicles[vehicleIndex],
          this.input,
          deltaTime,
          this.tileLookup
        );
        playerVehicle = updatedVehicles[vehicleIndex];
      }
    }
    
    // Update player (returns new player object)
    // If in vehicle, sync position/rotation with vehicle
    // BUT: if pendingExit is set, don't sync with vehicle - prepare for exit
    const shouldSyncWithVehicle = !this.pendingExit && playerVehicle && !playerVehicle.parked;
    
    let updatedPlayer = updatePlayer(
      {
        ...this.gameState.player,
        inVehicle: playerVehicle?.id,
      },
      this.input,
      deltaTime,
      this.tileLookup,
      shouldSyncWithVehicle ? playerVehicle?.position : undefined,
      shouldSyncWithVehicle ? playerVehicle?.rotation : undefined
    );
    
    // Check for vehicle exit
    // Exit when: manual exit requested OR (in vehicle, stopped, and no input for 0.5 seconds)
    if (updatedPlayer.inVehicle && playerVehicle) {
      const vehicleSpeed = length(playerVehicle.velocity);
      const inputLength = length(this.input);
      
      // Manual exit (button press) - exit immediately regardless of speed
      // Auto-exit - only when stopped and no input for 0.5 seconds
      const shouldExit = this.pendingExit || (vehicleSpeed < 5 && inputLength < 0.1 && (currentTime - this.lastExitAttempt > 500));
      
      if (shouldExit) {
        console.log('[GameLoop] Exiting vehicle - pendingExit:', this.pendingExit, 'vehicleSpeed:', vehicleSpeed);
        // If manual exit and vehicle is moving, stop vehicle first
        if (this.pendingExit && vehicleSpeed > 5) {
          // Stop the vehicle immediately for safe exit
          updatedVehicles = updatedVehicles.map(v =>
            v.id === playerVehicle!.id ? { ...v, velocity: { x: 0, y: 0 }, speed: 0 } : v
          );
          playerVehicle = { ...playerVehicle, velocity: { x: 0, y: 0 }, speed: 0 };
        }
        // Exit vehicle - set player position slightly offset from vehicle
        const exitOffset = {
          x: Math.cos(playerVehicle.rotation + Math.PI / 2) * 30,
          y: Math.sin(playerVehicle.rotation + Math.PI / 2) * 30,
        };
        
        // Ensure exit position is valid
        const exitPos = {
          x: playerVehicle.position.x + exitOffset.x,
          y: playerVehicle.position.y + exitOffset.y,
        };
        
        // Validate exit position
        const tileX = Math.floor(exitPos.x / TILE_SIZE);
        const tileY = Math.floor(exitPos.y / TILE_SIZE);
        const tile = getTileAt(this.tileLookup, tileX, tileY);
        
        let finalExitPos = exitPos;
        if (tile && (tile.type === 'building' || tile.type === 'water')) {
          // Try alternative positions
          const offsets = [
            { x: Math.cos(playerVehicle.rotation) * 40, y: Math.sin(playerVehicle.rotation) * 40 },
            { x: Math.cos(playerVehicle.rotation + Math.PI) * 40, y: Math.sin(playerVehicle.rotation + Math.PI) * 40 },
            { x: Math.cos(playerVehicle.rotation - Math.PI / 2) * 40, y: Math.sin(playerVehicle.rotation - Math.PI / 2) * 40 },
          ];
          
          for (const offset of offsets) {
            const testPos = {
              x: playerVehicle.position.x + offset.x,
              y: playerVehicle.position.y + offset.y,
            };
            const testTileX = Math.floor(testPos.x / TILE_SIZE);
            const testTileY = Math.floor(testPos.y / TILE_SIZE);
            const testTile = getTileAt(this.tileLookup, testTileX, testTileY);
            if (testTile && testTile.type !== 'building' && testTile.type !== 'water') {
              finalExitPos = testPos;
              break;
            }
          }
          
          // If still invalid, use vehicle position
          if (finalExitPos === exitPos && tile && (tile.type === 'building' || tile.type === 'water')) {
            finalExitPos = { ...playerVehicle.position };
          }
        }
        
        console.log('[GameLoop] Exit position:', finalExitPos, 'Player was at:', updatedPlayer.position);
        
        // Create a NEW player object (don't mutate)
        const exitedPlayer: Player = {
          ...updatedPlayer,
          inVehicle: undefined,
          position: { ...finalExitPos }, // Clone position
          velocity: { x: 0, y: 0 }, // Reset velocity
          speed: 0,
        };
        
        // Update vehicles to mark as parked
        updatedVehicles = updatedVehicles.map(v =>
          v.id === playerVehicle!.id ? { ...v, parked: true } : v
        );
        
        // Clear vehicle reference and flags
        playerVehicle = undefined;
        this.lastExitAttempt = currentTime; // Reset timer after exit
        this.lastExitTime = currentTime; // Track exit time for cooldown
        this.pendingExit = false; // Clear exit flag
        
        // Use the new player object
        updatedPlayer = exitedPlayer;
        
        console.log('[GameLoop] Vehicle exit complete - player now at:', updatedPlayer.position);
      } else {
        // Reset exit timer if vehicle is moving or player is giving input
        this.lastExitAttempt = currentTime;
      }
    } else {
      // Reset exit timer when not in vehicle
      this.lastExitAttempt = currentTime;
      this.pendingExit = false; // Clear exit flag if somehow set
    }

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
      vehicles: updatedVehicles,
      timeOfDay: updatedTimeOfDay,
      lastUpdate: currentTime,
      fps: avgFPS,
    };

    // Call update callback with NEW game state
    this.onUpdate(this.gameState);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.update);
    
    // Debug: Log when animation frame is not being scheduled
    if (!this.animationFrameId) {
      console.error('[GameLoop] Failed to schedule next frame!');
    }
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
