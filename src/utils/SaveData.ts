import { GameState, Player, GameStats, Collectible, NPC, WeaponId } from '../types/Game';

/**
 * Serializable save data structure
 * Contains only the essential game state that needs to be persisted
 */
export interface SaveData {
  version: string;
  timestamp: number;
  player: {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    rotation: number;
    speed: number;
    maxSpeed: number;
  };
  stats: GameStats;
  collectibles: Array<{
    id: string;
    collected: boolean;
  }>;
  npcs: Array<{
    id: string;
    position: { x: number; y: number };
    target: { x: number; y: number };
  }>;
  weapons: WeaponId[];
  selectedWeapon: WeaponId;
  worldSeed?: number; // Optional seed for deterministic world generation
}

const SAVE_VERSION = '1.0.0';

/**
 * Serialize game state to save data
 */
export function serializeGameState(gameState: GameState, worldSeed?: number): SaveData {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    player: {
      position: { ...gameState.player.position },
      velocity: { ...gameState.player.velocity },
      rotation: gameState.player.rotation,
      speed: gameState.player.speed,
      maxSpeed: gameState.player.maxSpeed,
    },
    stats: { ...gameState.stats },
    collectibles: gameState.collectibles.map((c) => ({
      id: c.id,
      collected: c.collected,
    })),
    npcs: gameState.npcs.map((npc) => ({
      id: npc.id,
      position: { ...npc.position },
      target: { ...npc.target },
    })),
    weapons: [...gameState.weapons],
    selectedWeapon: gameState.selectedWeapon,
    worldSeed,
  };
}

/**
 * Apply save data to game state
 * Note: This assumes the world (tiles, props) is already generated
 */
export function applySaveData(gameState: GameState, saveData: SaveData): GameState {
  // Update player
  const updatedPlayer: Player = {
    ...gameState.player,
    position: { ...saveData.player.position },
    velocity: { ...saveData.player.velocity },
    rotation: saveData.player.rotation,
    speed: saveData.player.speed,
    maxSpeed: saveData.player.maxSpeed,
  };

  // Update collectibles - merge saved state with current collectibles
  const collectibleMap = new Map(saveData.collectibles.map((c) => [c.id, c.collected]));
  const updatedCollectibles = gameState.collectibles.map((c) => {
    const savedState = collectibleMap.get(c.id);
    return savedState !== undefined ? { ...c, collected: savedState } : c;
  });

  // Update NPCs - match by ID and update position/target
  const npcMap = new Map(
    saveData.npcs.map((npc) => [
      npc.id,
      { position: npc.position, target: npc.target },
    ])
  );
  const updatedNPCs = gameState.npcs.map((npc) => {
    const savedData = npcMap.get(npc.id);
    if (savedData) {
      return {
        ...npc,
        position: { ...savedData.position },
        target: { ...savedData.target },
      };
    }
    return npc;
  });

  // Update camera to follow player
  const updatedCamera = {
    ...gameState.camera,
    position: { ...saveData.player.position },
  };

  return {
    ...gameState,
    player: updatedPlayer,
    camera: updatedCamera,
    stats: { ...saveData.stats },
    collectibles: updatedCollectibles,
    npcs: updatedNPCs,
    weapons: [...saveData.weapons],
    selectedWeapon: saveData.selectedWeapon,
  };
}

export { SAVE_VERSION };

