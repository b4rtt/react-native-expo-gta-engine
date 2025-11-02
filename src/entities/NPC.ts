import { NPC, Vector2, TileType } from '../types/Game';
import { add, multiply, normalize, length, subtract } from '../utils/Math';
import { TileLookup, getTileAt } from '../utils/TileLookup';
import { TILE_SIZE } from '../utils/Isometric';

const BLOCKING_TILE_TYPES: TileType[] = ['building'];

const isBlockingTile = (tileType?: TileType): boolean => {
  if (!tileType) {
    return true;
  }
  return BLOCKING_TILE_TYPES.includes(tileType);
};

const collidesWithBlockingTile = (
  position: Vector2,
  radius: number,
  tileLookup: TileLookup
): boolean => {
  const sampleOffsets = [
    { x: -radius, y: -radius },
    { x: radius, y: -radius },
    { x: radius, y: radius },
    { x: -radius, y: radius },
    { x: 0, y: 0 },
  ];

  for (const offset of sampleOffsets) {
    const sampleX = position.x + offset.x;
    const sampleY = position.y + offset.y;
    if (!Number.isFinite(sampleX) || !Number.isFinite(sampleY)) {
      return true;
    }

    const tileX = Math.floor(sampleX / TILE_SIZE);
    const tileY = Math.floor(sampleY / TILE_SIZE);
    const tile = getTileAt(tileLookup, tileX, tileY);

    if (isBlockingTile(tile?.type)) {
      return true;
    }
  }

  return false;
};

const NPC_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
];

export const createNPC = (x: number, y: number, id: string): NPC => {
  const colorIndex = parseInt(id.replace('npc-', ''), 10) % NPC_COLORS.length;
  return {
    id,
    position: { x, y },
    rotation: Math.random() * Math.PI * 2,
    speed: 0,
    size: 28, // Slightly smaller than player
    target: { x, y }, // Start with current position as target
    color: NPC_COLORS[colorIndex],
    behavior: 'wander',
  };
};

export const updateNPC = (
  npc: NPC,
  deltaTime: number,
  tileLookup: TileLookup,
  playerPosition: Vector2,
  otherNPCs: NPC[]
): NPC => {
  const wanderSpeed = 60 + Math.random() * 40; // 60-100 pixels per second
  const targetThreshold = 10; // How close to target before picking new one
  const playerAvoidanceRadius = 50; // Stay away from player
  const npcAvoidanceRadius = 40; // Stay away from other NPCs

  let newTarget = { ...npc.target };
  
  // Check if reached current target
  const distanceToTarget = length(subtract(npc.target, npc.position));
  
  if (distanceToTarget < targetThreshold) {
    // Pick new random target nearby
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 150; // 50-200 pixels away
    
    newTarget = {
      x: npc.position.x + Math.cos(angle) * distance,
      y: npc.position.y + Math.sin(angle) * distance,
    };
  }

  // Calculate direction to target
  let direction = subtract(newTarget, npc.position);
  const dirLength = length(direction);
  
  if (dirLength > 0) {
    direction = normalize(direction);
  } else {
    direction = { x: 0, y: 0 };
  }

  // Avoidance behavior - stay away from player
  const toPlayer = subtract(playerPosition, npc.position);
  const distanceToPlayer = length(toPlayer);
  
  if (distanceToPlayer < playerAvoidanceRadius && distanceToPlayer > 0) {
    // Move away from player
    const avoidanceForce = multiply(
      normalize(toPlayer),
      -1 * (1 - distanceToPlayer / playerAvoidanceRadius)
    );
    direction = add(direction, multiply(avoidanceForce, 2));
    direction = normalize(direction);
  }

  // Avoidance behavior - stay away from other NPCs
  for (const other of otherNPCs) {
    if (other.id === npc.id) continue;
    
    const toOther = subtract(other.position, npc.position);
    const distanceToOther = length(toOther);
    
    if (distanceToOther < npcAvoidanceRadius && distanceToOther > 0) {
      // Move away from other NPC
      const avoidanceForce = multiply(
        normalize(toOther),
        -1 * (1 - distanceToOther / npcAvoidanceRadius)
      );
      direction = add(direction, avoidanceForce);
      direction = normalize(direction);
    }
  }

  // Calculate new position
  const movement = multiply(direction, wanderSpeed * deltaTime);
  const radius = npc.size / 2;
  const positionAfterMovement = { ...npc.position };

  // X-axis collision
  if (movement.x !== 0) {
    const proposed = {
      x: npc.position.x + movement.x,
      y: positionAfterMovement.y,
    };

    if (collidesWithBlockingTile(proposed, radius, tileLookup)) {
      // Hit a wall on X axis - pick new target
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 150;
      newTarget = {
        x: npc.position.x + Math.cos(angle) * distance,
        y: npc.position.y + Math.sin(angle) * distance,
      };
    } else {
      positionAfterMovement.x = proposed.x;
    }
  }

  // Y-axis collision
  if (movement.y !== 0) {
    const proposed = {
      x: positionAfterMovement.x,
      y: npc.position.y + movement.y,
    };

    if (collidesWithBlockingTile(proposed, radius, tileLookup)) {
      // Hit a wall on Y axis - pick new target
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 150;
      newTarget = {
        x: npc.position.x + Math.cos(angle) * distance,
        y: npc.position.y + Math.sin(angle) * distance,
      };
    } else {
      positionAfterMovement.y = proposed.y;
    }
  }

  // Update rotation based on movement direction
  let newRotation = npc.rotation;
  if (length(movement) > 0.1) {
    newRotation = Math.atan2(movement.y, movement.x);
  }

  const newSpeed = length(movement) / deltaTime;

  return {
    ...npc,
    position: positionAfterMovement,
    rotation: newRotation,
    speed: newSpeed,
    target: newTarget,
  };
};

export const spawnNPCsInCity = (
  citySize: number,
  tileSize: number,
  count: number,
  tileLookup: TileLookup
): NPC[] => {
  const npcs: NPC[] = [];
  const maxAttempts = count * 10; // Try harder to find valid spawn points
  let attempts = 0;

  for (let i = 0; i < count && attempts < maxAttempts; attempts++) {
    // Try to spawn on pavement or grass tiles (not roads or buildings)
    const x = Math.random() * citySize * tileSize;
    const y = Math.random() * citySize * tileSize;

    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    const tile = getTileAt(tileLookup, tileX, tileY);

    // Only spawn on safe tiles
    if (tile && (tile.type === 'pavement' || tile.type === 'grass')) {
      const npc = createNPC(x, y, `npc-${i}`);
      
      // Check if too close to other NPCs
      const tooClose = npcs.some(other => {
        const dist = length(subtract(other.position, npc.position));
        return dist < 100; // Minimum 100 pixels apart
      });

      if (!tooClose) {
        npcs.push(npc);
        i++;
      }
    }
  }

  return npcs;
};

