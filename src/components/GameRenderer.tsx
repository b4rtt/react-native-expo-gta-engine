import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group, RoundedRect, Rect } from '@shopify/react-native-skia';
import { GameState, Tile, Collectible, NPC, Prop, PropType, Vehicle } from '../types/Game';
import { IsometricGrass } from './IsometricGrass';
import { IsometricRoad, RoadNeighbors } from './IsometricRoad';
import { IsometricBuilding } from './IsometricBuilding';
import { IsometricWater } from './IsometricWater';
import { IsometricBridge } from './IsometricBridge';
import { PlayerSprite } from './PlayerSprite';
import { PlayerSpriteWeb } from './PlayerSpriteWeb';
import { computeBuildingStyle } from '../utils/BuildingStyle';
import { worldToIsometric, TILE_SIZE } from '../utils/Isometric';
import { getTimeOfDayTint, getAmbientLightColor } from '../utils/TimeOfDay';

interface GameRendererProps {
  gameState: GameState;
  width: number;
  height: number;
}

interface ProjectedTile {
  tile: Tile;
  screenX: number;
  screenY: number;
  depth: number;
  neighbors: RoadNeighbors;
}

interface ProjectedCoin {
  coin: Collectible;
  screenX: number;
  screenY: number;
  depth: number;
}

interface ProjectedNPC {
  npc: NPC;
  screenX: number;
  screenY: number;
  radius: number;
}

interface ProjectedProp {
  prop: Prop;
  screenX: number;
  screenY: number;
  depth: number;
}

interface ProjectedVehicle {
  vehicle: Vehicle;
  screenX: number;
  screenY: number;
  depth: number;
}

interface ProjectedProjectile {
  x: number;
  y: number;
  rotation: number;
  weapon: string;
}

interface ProjectedScene {
  tiles: ProjectedTile[];
  playerScreenPos: { x: number; y: number };
  coins: ProjectedCoin[];
  npcs: ProjectedNPC[];
  props: ProjectedProp[];
  vehicles: ProjectedVehicle[];
  projectiles: ProjectedProjectile[];
}

const CULL_MARGIN = TILE_SIZE * 2;
const GRASS_COLORS_BASE = ['#3d6b34', '#4a7c3f', '#416e38'];
const PAVEMENT_COLORS_BASE = ['#5b5b5b', '#616161', '#585858'];
const COIN_COLOR_BASE = '#f7d64c';
const COIN_OUTLINE_BASE = '#cfa12f';
const COIN_HIGHLIGHT_BASE = '#fff2a6';

/**
 * Apply time of day tint to a hex color
 */
const applyTintToColor = (hexColor: string, tint: { r: number; g: number; b: number }): string => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Apply tint
  const newR = Math.floor(Math.min(255, r * tint.r));
  const newG = Math.floor(Math.min(255, g * tint.g));
  const newB = Math.floor(Math.min(255, b * tint.b));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

const tileKey = (x: number, y: number) => `${x},${y}`;

const useProjectedScene = (
  gameState: GameState,
  width: number,
  height: number
): ProjectedScene => {
  const { player, tiles, collectibles, npcs, props, vehicles, projectiles } = gameState;
  const playerX = player.position.x;
  const playerY = player.position.y;

  return useMemo(() => {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const playerCenterX = playerX;
    const playerCenterY = playerY;
    const playerIso = worldToIsometric({ x: playerCenterX, y: playerCenterY, z: 0 });

    const roadSet = new Set<string>();
    for (const tile of tiles) {
      if (tile.type === 'road') {
        roadSet.add(tileKey(tile.x, tile.y));
      }
    }

    const projectedTiles: ProjectedTile[] = [];
    const projectedCoins: ProjectedCoin[] = [];
    const projectedNPCs: ProjectedNPC[] = [];
    const projectedVehicles: ProjectedVehicle[] = [];

    for (const tile of tiles) {
      const worldPos = { x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE, z: 0 };
      const iso = worldToIsometric(worldPos);
      const screenX = iso.x - playerIso.x + halfWidth;
      const screenY = iso.y - playerIso.y + halfHeight;

      if (
        screenX + TILE_SIZE < -CULL_MARGIN ||
        screenX > width + CULL_MARGIN ||
        screenY + TILE_SIZE < -CULL_MARGIN ||
        screenY > height + CULL_MARGIN
      ) {
        continue;
      }

      // Check for road neighbors for both road and pavement tiles
      const neighbors: RoadNeighbors = {
        left: roadSet.has(tileKey(tile.x - 1, tile.y)),
        right: roadSet.has(tileKey(tile.x + 1, tile.y)),
        top: roadSet.has(tileKey(tile.x, tile.y - 1)),
        bottom: roadSet.has(tileKey(tile.x, tile.y + 1)),
      };

      projectedTiles.push({
        tile,
        screenX,
        screenY,
        depth: tile.x + tile.y,
        neighbors,
      });
    }

    projectedTiles.sort((a, b) => {
      if (a.depth !== b.depth) {
        return a.depth - b.depth;
      }
      if (a.tile.y !== b.tile.y) {
        return a.tile.y - b.tile.y;
      }
      return a.tile.x - b.tile.x;
    });
    for (const collectible of collectibles) {
      if (collectible.collected) {
        continue;
      }

      const iso = worldToIsometric({
        x: collectible.position.x,
        y: collectible.position.y,
        z: 0,
      });

      const screenX = iso.x - playerIso.x + halfWidth;
      const screenY = iso.y - playerIso.y + halfHeight;
      const radius = collectible.radius;

      if (
        screenX + radius < -CULL_MARGIN ||
        screenX - radius > width + CULL_MARGIN ||
        screenY + radius < -CULL_MARGIN ||
        screenY - radius > height + CULL_MARGIN
      ) {
        continue;
      }

      const depth =
        collectible.position.x / TILE_SIZE + collectible.position.y / TILE_SIZE;

      const projectedCoin: ProjectedCoin = {
        coin: collectible,
        screenX,
        screenY,
        depth,
      };

      projectedCoins.push(projectedCoin);
    }

    const playerScreenPos = {
      x: halfWidth,
      y: halfHeight,
    };

    for (const npc of npcs) {
      const iso = worldToIsometric({ x: npc.position.x, y: npc.position.y, z: 0 });
      const screenX = iso.x - playerIso.x + halfWidth;
      const screenY = iso.y - playerIso.y + halfHeight;
      const radius = npc.size / 2;

      if (
        screenX + radius < -CULL_MARGIN ||
        screenX - radius > width + CULL_MARGIN ||
        screenY + radius < -CULL_MARGIN ||
        screenY - radius > height + CULL_MARGIN
      ) {
        continue;
      }

      projectedNPCs.push({
        npc,
        screenX,
        screenY,
        radius,
      });
    }

    const projectedProps: ProjectedProp[] = [];
    for (const prop of props) {
      const iso = worldToIsometric({ x: prop.position.x, y: prop.position.y, z: 0 });
      const screenX = iso.x - playerIso.x + halfWidth;
      const screenY = iso.y - playerIso.y + halfHeight;

      if (
        screenX + prop.size < -CULL_MARGIN ||
        screenX - prop.size > width + CULL_MARGIN ||
        screenY + prop.size < -CULL_MARGIN ||
        screenY - prop.size > height + CULL_MARGIN
      ) {
        continue;
      }

      projectedProps.push({
        prop,
        screenX,
        screenY,
        depth: prop.position.x + prop.position.y,
      });
    }

    // Project vehicles
    for (const vehicle of vehicles) {
      const iso = worldToIsometric({ x: vehicle.position.x, y: vehicle.position.y, z: 0 });
      const screenX = iso.x - playerIso.x + halfWidth;
      const screenY = iso.y - playerIso.y + halfHeight;
      const radius = vehicle.size / 2;

      if (
        screenX + radius < -CULL_MARGIN ||
        screenX - radius > width + CULL_MARGIN ||
        screenY + radius < -CULL_MARGIN ||
        screenY - radius > height + CULL_MARGIN
      ) {
        continue;
      }

      projectedVehicles.push({
        vehicle,
        screenX,
        screenY,
        depth: vehicle.position.x + vehicle.position.y,
      });
    }

    // Project projectiles
    const projectedProjectiles: ProjectedProjectile[] = [];
    for (const projectile of projectiles) {
      const iso = worldToIsometric({ x: projectile.position.x, y: projectile.position.y, z: 0 });
      const screenX = iso.x - playerIso.x + halfWidth;
      const screenY = iso.y - playerIso.y + halfHeight;

      // Cull projectiles outside the screen
      if (
        screenX < -CULL_MARGIN ||
        screenX > width + CULL_MARGIN ||
        screenY < -CULL_MARGIN ||
        screenY > height + CULL_MARGIN
      ) {
        continue;
      }

      projectedProjectiles.push({
        x: screenX,
        y: screenY,
        rotation: projectile.rotation,
        weapon: projectile.weapon,
      });
    }

    return {
      tiles: projectedTiles,
      playerScreenPos,
      coins: projectedCoins,
      npcs: projectedNPCs,
      props: projectedProps,
      vehicles: projectedVehicles,
      projectiles: projectedProjectiles,
    };
  }, [tiles, collectibles, npcs, props, vehicles, projectiles, playerX, playerY, width, height]);
};

export const GameRenderer: React.FC<GameRendererProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebGameRenderer {...props} />;
  }
  return <SkiaGameRenderer {...props} />;
};

type RenderItem =
  | { kind: 'surface'; depth: number; tile: ProjectedTile }
  | { kind: 'building'; depth: number; tile: ProjectedTile }
  | { kind: 'coin'; depth: number; coin: ProjectedCoin }
  | { kind: 'npc'; depth: number; npc: ProjectedNPC }
  | { kind: 'prop'; depth: number; prop: ProjectedProp }
  | { kind: 'vehicle'; depth: number; vehicle: ProjectedVehicle }
  | { kind: 'projectile'; depth: number; projectile: ProjectedProjectile }
  | { kind: 'player'; depth: number };

const buildRenderQueue = (
  tiles: ProjectedTile[],
  coins: ProjectedCoin[],
  npcs: ProjectedNPC[],
  props: ProjectedProp[],
  vehicles: ProjectedVehicle[],
  projectiles: ProjectedProjectile[],
  playerScreenY: number
): RenderItem[] => {
  const queue: RenderItem[] = [];

  for (const tile of tiles) {
    queue.push({ kind: 'surface', depth: tile.screenY - TILE_SIZE, tile });
    if (tile.tile.type === 'building') {
      queue.push({ kind: 'building', depth: tile.screenY + TILE_SIZE * 0.75, tile });
    }
  }

  for (const coin of coins) {
    queue.push({ kind: 'coin', depth: coin.screenY - coin.coin.radius, coin });
  }

  for (const npc of npcs) {
    queue.push({ kind: 'npc', depth: npc.screenY, npc });
  }

  for (const prop of props) {
    queue.push({ kind: 'prop', depth: prop.screenY, prop });
  }

  for (const vehicle of vehicles) {
    queue.push({ kind: 'vehicle', depth: vehicle.screenY, vehicle });
  }

  for (const projectile of projectiles) {
    queue.push({ kind: 'projectile', depth: projectile.y, projectile });
  }

  queue.push({ kind: 'player', depth: playerScreenY });

  queue.sort((a, b) => a.depth - b.depth);
  return queue;
};

const SkiaGameRenderer: React.FC<GameRendererProps> = ({
  gameState,
  width,
  height,
}) => {
  const { player } = gameState;
  const { tiles, coins, npcs, props, vehicles, projectiles, playerScreenPos } = useProjectedScene(
    gameState,
    width,
    height
  );

  const renderQueue = useMemo(
    () => buildRenderQueue(tiles, coins, npcs, props, vehicles, projectiles, playerScreenPos.y),
    [tiles, coins, npcs, props, vehicles, projectiles, playerScreenPos.y]
  );

  // Get time of day tint and ambient light
  const timeTint = getTimeOfDayTint(gameState.timeOfDay);
  const ambientLight = getAmbientLightColor(gameState.timeOfDay);
  
  // Apply tint to base colors
  const GRASS_COLORS = GRASS_COLORS_BASE.map(c => applyTintToColor(c, timeTint));
  const PAVEMENT_COLORS = PAVEMENT_COLORS_BASE.map(c => applyTintToColor(c, timeTint));
  const COIN_COLOR = applyTintToColor(COIN_COLOR_BASE, timeTint);
  const COIN_OUTLINE = applyTintToColor(COIN_OUTLINE_BASE, timeTint);
  const COIN_HIGHLIGHT = applyTintToColor(COIN_HIGHLIGHT_BASE, timeTint);
  
  // Apply tint to background color
  const bgR = Math.floor(26 * timeTint.r);
  const bgG = Math.floor(26 * timeTint.g);
  const bgB = Math.floor(26 * timeTint.b);
  const backgroundColor = `rgb(${bgR}, ${bgG}, ${bgB})`;
  
  return (
    <Canvas style={{ width, height, backgroundColor }}>
      {/* Ambient light overlay */}
      <Rect x={0} y={0} width={width} height={height} color={ambientLight} />
      <Group>
        {renderQueue.map((item, index) => {
          switch (item.kind) {
            case 'surface': {
              const { tile, screenX, screenY, neighbors } = item.tile;
              if (tile.type === 'water') {
                return (
                  <IsometricWater
                    key={`water-${tile.x}-${tile.y}-${index}`}
                    tile={tile}
                    screenX={screenX}
                    screenY={screenY}
                  />
                );
              }
              if (tile.type === 'bridge') {
                return (
                  <IsometricBridge
                    key={`bridge-${tile.x}-${tile.y}-${index}`}
                    tile={tile}
                    screenX={screenX}
                    screenY={screenY}
                    neighbors={neighbors}
                  />
                );
              }
              if (tile.type === 'grass' || tile.type === 'pavement' || tile.type === 'building') {
                return (
                  <IsometricGrass
                    key={`surface-${tile.x}-${tile.y}-${index}`}
                    tile={tile}
                    screenX={screenX}
                    screenY={screenY}
                  />
                );
              }
              if (tile.type === 'road') {
                return (
                  <IsometricRoad
                    key={`road-${tile.x}-${tile.y}-${index}`}
                    tile={tile}
                    screenX={screenX}
                    screenY={screenY}
                    neighbors={neighbors}
                  />
                );
              }
              return null;
            }
            case 'building': {
              const { tile, screenX, screenY } = item.tile;
              return (
                <IsometricBuilding
                  key={`building-${tile.x}-${tile.y}-${index}`}
                  tile={tile}
                  screenX={screenX}
                  screenY={screenY}
                />
              );
            }
          case 'coin': {
            const { coin, screenX, screenY } = item.coin;
            return (
              <Group key={`coin-${coin.id}-${index}`}>
                <Circle cx={screenX} cy={screenY} r={coin.radius} color={COIN_COLOR} />
                  <Circle
                    cx={screenX}
                    cy={screenY}
                    r={coin.radius}
                    color={COIN_OUTLINE}
                    style="stroke"
                    strokeWidth={2}
                  />
                  <Circle
                    cx={screenX}
                    cy={screenY - coin.radius * 0.4}
                    r={coin.radius * 0.45}
                    color={COIN_HIGHLIGHT}
                  />
                </Group>
              );
            }
            case 'npc': {
              const { npc, screenX, screenY, radius } = item.npc;
              return (
                <Circle
                  key={`npc-${npc.id}-${index}`}
                  cx={screenX}
                  cy={screenY}
                  r={radius}
                  color={npc.color}
                />
              );
            }
            case 'prop': {
              const { prop, screenX, screenY } = item.prop;
              return renderSkiaProp(prop.type, screenX, screenY, index);
            }
            case 'vehicle': {
              const { vehicle, screenX, screenY } = item.vehicle;
              return renderSkiaVehicle(vehicle, screenX, screenY, index);
            }
            case 'projectile': {
              const { projectile } = item;
              return (
                <Group key={`projectile-${index}`}>
                  <Circle
                    cx={projectile.x}
                    cy={projectile.y}
                    r={3}
                    color="#FFD700"
                  />
                </Group>
              );
            }
            case 'player':
              return (
                <PlayerSprite
                  key="player"
                  player={player}
                  screenX={playerScreenPos.x}
                  screenY={playerScreenPos.y}
                />
              );
          }
        })}
      </Group>
    </Canvas>
  );
};

const WebGameRenderer: React.FC<GameRendererProps> = ({
  gameState,
  width,
  height,
}) => {
  const { player } = gameState;
  const { tiles, coins, npcs, props, vehicles, projectiles, playerScreenPos } = useProjectedScene(
    gameState,
    width,
    height
  );

  const renderQueue = useMemo(
    () => buildRenderQueue(tiles, coins, npcs, props, vehicles, projectiles, playerScreenPos.y),
    [tiles, coins, npcs, props, vehicles, projectiles, playerScreenPos.y]
  );

  // Get time of day tint and ambient light
  const timeTint = getTimeOfDayTint(gameState.timeOfDay);
  const ambientLight = getAmbientLightColor(gameState.timeOfDay);
  
  // Apply tint to base colors
  const GRASS_COLORS = GRASS_COLORS_BASE.map(c => applyTintToColor(c, timeTint));
  const PAVEMENT_COLORS = PAVEMENT_COLORS_BASE.map(c => applyTintToColor(c, timeTint));
  const COIN_COLOR = applyTintToColor(COIN_COLOR_BASE, timeTint);
  const COIN_OUTLINE = applyTintToColor(COIN_OUTLINE_BASE, timeTint);
  const COIN_HIGHLIGHT = applyTintToColor(COIN_HIGHLIGHT_BASE, timeTint);
  
  // Apply tint to background color
  const bgR = Math.floor(26 * timeTint.r);
  const bgG = Math.floor(26 * timeTint.g);
  const bgB = Math.floor(26 * timeTint.b);
  const backgroundColor = `rgb(${bgR}, ${bgG}, ${bgB})`;
  
  return (
    <View style={[webStyles.root, { width, height, backgroundColor }]}> 
      {/* Ambient light overlay */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: ambientLight,
          pointerEvents: 'none',
        }}
      />
      {renderQueue.map((item, index) => {
        switch (item.kind) {
          case 'surface': {
            const { tile, screenX, screenY, neighbors } = item.tile;
            if (tile.type === 'water') {
              return renderWebWater(tile, screenX, screenY, index);
            }
            if (tile.type === 'bridge') {
              return renderWebBridge(tile, screenX, screenY, neighbors, index);
            }
            return renderWebSurface(tile, screenX, screenY, neighbors, index, GRASS_COLORS, PAVEMENT_COLORS);
          }
          case 'building': {
            const { tile, screenX, screenY } = item.tile;
            return renderWebBuilding(tile, screenX, screenY, index);
          }
          case 'coin': {
            const { coin, screenX, screenY } = item.coin;
            return renderWebCoin(coin, screenX, screenY, index, COIN_COLOR, COIN_OUTLINE, COIN_HIGHLIGHT);
          }
          case 'npc': {
            const { npc, screenX, screenY, radius } = item.npc;
            return renderWebNPC(npc, screenX, screenY, radius, index);
          }
          case 'prop': {
            const { prop, screenX, screenY } = item.prop;
            return renderWebProp(prop, screenX, screenY, index);
          }
          case 'vehicle': {
            const { vehicle, screenX, screenY } = item.vehicle;
            return renderWebVehicle(vehicle, screenX, screenY, index);
          }
          case 'projectile': {
            const { projectile } = item;
            return (
              <View
                key={`projectile-${index}`}
                style={{
                  position: 'absolute',
                  left: projectile.x - 3,
                  top: projectile.y - 3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#FFD700',
                }}
              />
            );
          }
          case 'player':
            return (
              <PlayerSpriteWeb
                key="player"
                player={player}
                screenX={playerScreenPos.x}
                screenY={playerScreenPos.y}
              />
            );
        }
      })}
    </View>
  );
};

const shouldHaveTrafficLight = (tile: Tile, neighbors: RoadNeighbors): boolean => {
  if (tile.type !== 'road') return false;
  
  // Count road connections
  const connectionCount = [neighbors.left, neighbors.right, neighbors.top, neighbors.bottom].filter(Boolean).length;
  
  // Traffic lights at 4-way intersections (major crossroads)
  if (connectionCount === 4) {
    // Use deterministic seeding - place traffic lights at some intersections
    const seed = tile.x * 73 + tile.y * 37;
    return seed % 3 === 0; // ~33% of 4-way intersections
  }
  
  return false;
};

const renderTrafficLight = (
  tileX: number, 
  tileY: number, 
  corner: number
) => {
  const lightSize = TILE_SIZE * 0.1;
  const poleHeight = TILE_SIZE * 0.25;
  
  // Use tile position and corner to create a deterministic offset for light cycles
  const cycleOffset = (tileX * 73 + tileY * 37 + corner * 11) % 12;
  const currentTime = Date.now();
  const cycleTime = (Math.floor(currentTime / 1000) + cycleOffset) % 12; // 12 second cycle
  
  // Traffic light states: 0-5 = red, 6-7 = yellow, 8-11 = green
  const isRed = cycleTime < 6;
  const isYellow = cycleTime >= 6 && cycleTime < 8;
  const isGreen = cycleTime >= 8;
  
  return (
    <>
      {/* Traffic light pole */}
      <View
        style={{
          width: 3,
          height: poleHeight,
          backgroundColor: '#444',
        }}
      />
      {/* Traffic light box */}
      <View
        style={{
          width: lightSize,
          height: lightSize * 2.8,
          backgroundColor: '#222',
          borderWidth: 1,
          borderColor: '#000',
          borderRadius: 1,
          marginTop: -lightSize * 2.8,
          marginLeft: -lightSize / 2 + 1.5,
        }}
      >
        {/* Red light */}
        <View
          style={{
            width: lightSize * 0.7,
            height: lightSize * 0.7,
            borderRadius: (lightSize * 0.7) / 2,
            backgroundColor: isRed ? '#ff4444' : '#331111',
            margin: lightSize * 0.15,
          }}
        />
        {/* Yellow light */}
        <View
          style={{
            width: lightSize * 0.7,
            height: lightSize * 0.7,
            borderRadius: (lightSize * 0.7) / 2,
            backgroundColor: isYellow ? '#ffdd44' : '#333311',
            margin: lightSize * 0.15,
          }}
        />
        {/* Green light */}
        <View
          style={{
            width: lightSize * 0.7,
            height: lightSize * 0.7,
            borderRadius: (lightSize * 0.7) / 2,
            backgroundColor: isGreen ? '#44ff44' : '#113311',
            margin: lightSize * 0.15,
          }}
        />
      </View>
    </>
  );
};

const WATER_COLORS_WEB = ['#2a5a7a', '#2d5d7d', '#28587a', '#2c5b7c'];
const WATER_HIGHLIGHT_WEB = '#3a7a9a';
const WATER_DARK_WEB = '#1a4a6a';

const WaterTile: React.FC<{ tile: Tile; screenX: number; screenY: number; key: number }> = ({
  tile,
  screenX,
  screenY,
  key,
}) => {
  const seed = tile.x * 73 + tile.y * 37;
  const colorVariant = seed % WATER_COLORS_WEB.length;
  const baseColor = WATER_COLORS_WEB[colorVariant];
  const [time, setTime] = React.useState(0);
  
  React.useEffect(() => {
    let animationFrame: number;
    const startTime = performance.now();
    
    const animate = () => {
      const currentTime = performance.now();
      setTime((currentTime - startTime) / 1000);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);
  
  // Animated wave positions
  const waveSpeed1 = 0.5 + (seed % 10) / 20;
  const waveSpeed2 = 0.8 + (seed % 7) / 15;
  const waveSpeed3 = 0.3 + (seed % 13) / 25;
  
  const wave1Y = TILE_SIZE * 0.2 + Math.sin(time * waveSpeed1 + seed * 0.1) * 3;
  const wave2Y = TILE_SIZE * 0.5 + Math.sin(time * waveSpeed2 + seed * 0.15 + Math.PI / 3) * 2.5;
  const wave3Y = TILE_SIZE * 0.7 + Math.sin(time * waveSpeed3 + seed * 0.2 + Math.PI / 2) * 2;
  
  const wave1X = Math.sin(time * 0.4 + seed * 0.05) * 2;
  const wave2X = Math.sin(time * 0.6 + seed * 0.08 + Math.PI / 4) * 1.5;
  
  const shimmerOpacity = 0.3 + Math.sin(time * 2 + seed * 0.1) * 0.15;
  const highlightOpacity = 0.4 + Math.sin(time * 1.5 + seed * 0.12) * 0.2;
  
  return (
    <View
      key={`water-${tile.x}-${tile.y}-${key}`}
      style={[
        webStyles.tileBase,
        {
          left: screenX,
          top: screenY,
          backgroundColor: baseColor,
        },
      ]}
    >
      {/* Darker water layer for depth */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: TILE_SIZE * 0.6,
          width: TILE_SIZE,
          height: TILE_SIZE * 0.4,
          backgroundColor: WATER_DARK_WEB,
          opacity: 0.3,
        }}
      />
      
      {/* Animated wave 1 */}
      <View
        style={{
          position: 'absolute',
          left: wave1X,
          top: wave1Y,
          width: TILE_SIZE,
          height: TILE_SIZE * 0.25,
          backgroundColor: WATER_HIGHLIGHT_WEB,
          opacity: highlightOpacity,
        }}
      />
      
      {/* Animated wave 2 */}
      <View
        style={{
          position: 'absolute',
          left: wave2X,
          top: wave2Y,
          width: TILE_SIZE * 0.8,
          height: TILE_SIZE * 0.2,
          backgroundColor: WATER_HIGHLIGHT_WEB,
          opacity: shimmerOpacity,
        }}
      />
      
      {/* Animated wave 3 */}
      <View
        style={{
          position: 'absolute',
          left: TILE_SIZE * 0.1,
          top: wave3Y,
          width: TILE_SIZE * 0.7,
          height: TILE_SIZE * 0.15,
          backgroundColor: WATER_HIGHLIGHT_WEB,
          opacity: 0.25 + Math.sin(time * 1.2 + seed * 0.1) * 0.1,
        }}
      />
      
      {/* Shimmer/reflection effect */}
      <View
        style={{
          position: 'absolute',
          left: TILE_SIZE * 0.3,
          top: TILE_SIZE * 0.15 + Math.sin(time * 1.8 + seed * 0.2) * 2,
          width: TILE_SIZE * 0.4,
          height: TILE_SIZE * 0.3,
          backgroundColor: '#4a9aba',
          opacity: 0.2 + Math.sin(time * 2.5 + seed * 0.15) * 0.15,
        }}
      />
    </View>
  );
};

const renderWebWater = (tile: Tile, screenX: number, screenY: number, key: number) => {
  return <WaterTile tile={tile} screenX={screenX} screenY={screenY} key={key} />;
};

const renderWebBridge = (
  tile: Tile,
  screenX: number,
  screenY: number,
  neighbors: RoadNeighbors,
  key: number
) => {
  const isHorizontal = neighbors.left || neighbors.right;
  const bridgeWidth = isHorizontal ? TILE_SIZE : TILE_SIZE * 0.6;
  const bridgeHeight = isHorizontal ? TILE_SIZE * 0.6 : TILE_SIZE;
  const bridgeX = isHorizontal ? 0 : (TILE_SIZE - bridgeWidth) / 2;
  const bridgeY = isHorizontal ? (TILE_SIZE - bridgeHeight) / 2 : 0;
  const BRIDGE_COLOR = '#4a4a4a';
  const BRIDGE_BORDER = '#3a3a3a';
  const WATER_COLOR = '#2a5a7a';

  return (
    <View
      key={`bridge-${tile.x}-${tile.y}-${key}`}
      style={[
        webStyles.tileBase,
        {
          left: screenX,
          top: screenY,
        },
      ]}
    >
      {/* Water background */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundColor: WATER_COLOR,
        }}
      />
      
      {/* Bridge deck */}
      <View
        style={{
          position: 'absolute',
          left: bridgeX,
          top: bridgeY,
          width: bridgeWidth,
          height: bridgeHeight,
          backgroundColor: BRIDGE_COLOR,
          borderWidth: 2,
          borderColor: BRIDGE_BORDER,
        }}
      />
      
      {/* Bridge planks/segments */}
      {isHorizontal ? (
        <>
          <View
            style={{
              position: 'absolute',
              left: bridgeX + bridgeWidth * 0.25,
              top: bridgeY,
              width: 2,
              height: bridgeHeight,
              backgroundColor: BRIDGE_BORDER,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: bridgeX + bridgeWidth * 0.5,
              top: bridgeY,
              width: 2,
              height: bridgeHeight,
              backgroundColor: BRIDGE_BORDER,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: bridgeX + bridgeWidth * 0.75,
              top: bridgeY,
              width: 2,
              height: bridgeHeight,
              backgroundColor: BRIDGE_BORDER,
            }}
          />
        </>
      ) : (
        <>
          <View
            style={{
              position: 'absolute',
              left: bridgeX,
              top: bridgeY + bridgeHeight * 0.25,
              width: bridgeWidth,
              height: 2,
              backgroundColor: BRIDGE_BORDER,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: bridgeX,
              top: bridgeY + bridgeHeight * 0.5,
              width: bridgeWidth,
              height: 2,
              backgroundColor: BRIDGE_BORDER,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: bridgeX,
              top: bridgeY + bridgeHeight * 0.75,
              width: bridgeWidth,
              height: 2,
              backgroundColor: BRIDGE_BORDER,
            }}
          />
        </>
      )}
    </View>
  );
};

const renderWebSurface = (
  tile: Tile,
  screenX: number,
  screenY: number,
  neighbors: RoadNeighbors,
  key: number,
  grassColors: string[] = GRASS_COLORS_BASE,
  pavementColors: string[] = PAVEMENT_COLORS_BASE
) => {
  if (tile.type === 'grass' || tile.type === 'pavement' || tile.type === 'building') {
    // Buildings should have pavement underneath
    const palette = (tile.type === 'pavement' || tile.type === 'building') ? pavementColors : grassColors;
    const colorVariant = (tile.x + tile.y) % palette.length;
    const baseColor = palette[colorVariant];
    
    // Check if this is a pavement tile adjacent to roads
    const isPavement = tile.type === 'pavement' || tile.type === 'building';
    const hasCurbTop = isPavement && neighbors.top;
    const hasCurbBottom = isPavement && neighbors.bottom;
    const hasCurbLeft = isPavement && neighbors.left;
    const hasCurbRight = isPavement && neighbors.right;
    
    return (
      <View
        key={`surface-${tile.x}-${tile.y}-${key}`}
        style={[
          webStyles.tileBase,
          {
            left: screenX,
            top: screenY,
            backgroundColor: baseColor,
          },
        ]}
      >
        {/* Curb edges */}
        {hasCurbTop && <View style={webStyles.curbTop} />}
        {hasCurbBottom && <View style={webStyles.curbBottom} />}
        {hasCurbLeft && <View style={webStyles.curbLeft} />}
        {hasCurbRight && <View style={webStyles.curbRight} />}
      </View>
    );
  }

  if (tile.type === 'road') {
    // Use roadConnections if available, otherwise fallback to neighbors
    const left = tile.roadConnections?.west ?? neighbors.left;
    const right = tile.roadConnections?.east ?? neighbors.right;
    const top = tile.roadConnections?.north ?? neighbors.top;
    const bottom = tile.roadConnections?.south ?? neighbors.bottom;
    
    // Count connections to determine road type
    const connectionCount = [left, right, top, bottom].filter(Boolean).length;
    
    // Determine road markings based on connection type
    const isHorizontal = (left || right) && !top && !bottom;
    const isVertical = (top || bottom) && !left && !right;
    const isCorner = connectionCount === 2 && (
      (left && top) || (left && bottom) || (right && top) || (right && bottom)
    );
    const isTJunction = connectionCount === 3;
    const isCrossroads = connectionCount === 4;
    
    // Crosswalks on straight roads that are adjacent to intersections
    // Simple check: straight road (2 opposite connections) near complex intersections
    const isHorizontalRoad = left && right && !top && !bottom;
    const isVerticalRoad = top && bottom && !left && !right;
    
    // Crosswalk appears on straight road tiles with specific coordinates
    // (one tile before the intersection grid lines)
    const hasIntersectionNearby = connectionCount === 2 && (
      (isHorizontalRoad && (tile.x + 1) % 6 === 0) ||  // One tile before vertical road
      (isHorizontalRoad && (tile.x - 1) % 6 === 0) ||  // One tile after vertical road
      (isVerticalRoad && (tile.y + 1) % 6 === 0) ||    // One tile before horizontal road
      (isVerticalRoad && (tile.y - 1) % 6 === 0)       // One tile after horizontal road
    );
    
    const isCrosswalkHorizontal = isHorizontalRoad && hasIntersectionNearby;
    const isCrosswalkVertical = isVerticalRoad && hasIntersectionNearby;
    
    const hasTrafficLight = shouldHaveTrafficLight(tile, neighbors);
    
    return (
      <React.Fragment key={`road-frag-${tile.x}-${tile.y}-${key}`}>
        <View
          key={`road-${tile.x}-${tile.y}-${key}`}
          style={[webStyles.tileBase, webStyles.road, { left: screenX, top: screenY }]}
        >
          {/* Horizontal road markings */}
          {isHorizontal && !isCrosswalkHorizontal && (
            <View style={webStyles.roadStripeHorizontal} />
          )}
          
          {/* Vertical road markings */}
          {isVertical && !isCrosswalkVertical && (
            <View style={webStyles.roadStripeVertical} />
          )}
          
          {/* Crosswalk stripes - only on straight roads before intersections, 50% width */}
          {isCrosswalkHorizontal && (
            <>
              <View style={[webStyles.crosswalkStripe, { 
                top: TILE_SIZE * 0.2, 
                height: TILE_SIZE * 0.08,
                left: TILE_SIZE * 0.25,
                right: TILE_SIZE * 0.25,
              }]} />
              <View style={[webStyles.crosswalkStripe, { 
                top: TILE_SIZE * 0.4, 
                height: TILE_SIZE * 0.08,
                left: TILE_SIZE * 0.25,
                right: TILE_SIZE * 0.25,
              }]} />
              <View style={[webStyles.crosswalkStripe, { 
                top: TILE_SIZE * 0.6, 
                height: TILE_SIZE * 0.08,
                left: TILE_SIZE * 0.25,
                right: TILE_SIZE * 0.25,
              }]} />
              <View style={[webStyles.crosswalkStripe, { 
                top: TILE_SIZE * 0.8, 
                height: TILE_SIZE * 0.08,
                left: TILE_SIZE * 0.25,
                right: TILE_SIZE * 0.25,
              }]} />
            </>
          )}
          {isCrosswalkVertical && (
            <>
              <View style={[webStyles.crosswalkStripeVertical, { 
                left: TILE_SIZE * 0.2, 
                width: TILE_SIZE * 0.08,
                top: TILE_SIZE * 0.25,
                bottom: TILE_SIZE * 0.25,
              }]} />
              <View style={[webStyles.crosswalkStripeVertical, { 
                left: TILE_SIZE * 0.4, 
                width: TILE_SIZE * 0.08,
                top: TILE_SIZE * 0.25,
                bottom: TILE_SIZE * 0.25,
              }]} />
              <View style={[webStyles.crosswalkStripeVertical, { 
                left: TILE_SIZE * 0.6, 
                width: TILE_SIZE * 0.08,
                top: TILE_SIZE * 0.25,
                bottom: TILE_SIZE * 0.25,
              }]} />
              <View style={[webStyles.crosswalkStripeVertical, { 
                left: TILE_SIZE * 0.8, 
                width: TILE_SIZE * 0.08,
                top: TILE_SIZE * 0.25,
                bottom: TILE_SIZE * 0.25,
              }]} />
            </>
          )}
          
          {/* Corner markings */}
          {isCorner && left && top && (
            <View style={webStyles.roadCornerNW} />
          )}
          {isCorner && right && top && (
            <View style={webStyles.roadCornerNE} />
          )}
          {isCorner && left && bottom && (
            <View style={webStyles.roadCornerSW} />
          )}
          {isCorner && right && bottom && (
            <View style={webStyles.roadCornerSE} />
          )}
          
          {/* Traffic lights at major intersections - fixed position within tile */}
          {hasTrafficLight && (
            <>
              <View style={{ position: 'absolute', right: 5, top: 5 }}>
                {renderTrafficLight(tile.x, tile.y, 0)}
              </View>
              <View style={{ position: 'absolute', left: 5, top: 5 }}>
                {renderTrafficLight(tile.x, tile.y, 1)}
              </View>
              <View style={{ position: 'absolute', left: 5, bottom: 5 }}>
                {renderTrafficLight(tile.x, tile.y, 2)}
              </View>
              <View style={{ position: 'absolute', right: 5, bottom: 5 }}>
                {renderTrafficLight(tile.x, tile.y, 3)}
              </View>
            </>
          )}
        </View>
      </React.Fragment>
    );
  }

  return null;
};

const renderWebBuilding = (tile: Tile, screenX: number, screenY: number, key: number) => {
  const style = computeBuildingStyle(tile, screenX, screenY);
  const buildingHeight = Math.max(1, tile.buildingHeight || 1);
  const floorHeight = style.body.height / buildingHeight;

  return (
    <React.Fragment key={`building-${tile.x}-${tile.y}-${key}`}>
      {/* Shadow */}
      <View
        style={[
          webStyles.buildingShadow,
          {
            left: style.shadow.x,
            top: style.shadow.y,
            width: style.shadow.width,
            height: style.shadow.height,
          },
        ]}
      />
      
      {/* Building body with color ramp per floor */}
      {style.facadeColors.map((color, index) => {
        const floorY = style.body.y + (buildingHeight - index - 1) * floorHeight;
        return (
          <View
            key={`floor-${index}`}
            style={{
              position: 'absolute',
              left: style.body.x,
              top: floorY,
              width: style.body.width,
              height: floorHeight,
              backgroundColor: color,
            }}
          />
        );
      })}
      
      {/* Body border */}
      <View
        style={[
          webStyles.buildingBody,
          {
            left: style.body.x,
            top: style.body.y,
            width: style.body.width,
            height: style.body.height,
            backgroundColor: 'transparent',
            borderColor: style.bodyBorderColor,
            borderWidth: 1,
          },
        ]}
      />
      
      {/* Windows */}
      {style.windows.map((windowRect, index) => (
        <View
          key={`window-${index}`}
          style={{
            position: 'absolute',
            left: windowRect.x,
            top: windowRect.y,
            width: windowRect.width,
            height: windowRect.height,
            borderRadius: 2,
            backgroundColor: style.windowColor,
          }}
        />
      ))}
      
      {/* Building details (doors, stairs, rooftop props) */}
      {style.details.map((detail, index) => (
        <View
          key={`detail-${index}`}
          style={{
            position: 'absolute',
            left: detail.rect.x,
            top: detail.rect.y,
            width: detail.rect.width,
            height: detail.rect.height,
            backgroundColor: detail.color || '#666666',
          }}
        />
      ))}
      
      {/* Roof */}
      <View
        style={[
          webStyles.buildingRoof,
          {
            left: style.roof.x,
            top: style.roof.y,
            width: style.roof.width,
            height: style.roof.height,
            backgroundColor: style.roofColor,
          },
        ]}
      />
    </React.Fragment>
  );
};

const renderWebCoin = (
  coin: Collectible,
  screenX: number,
  screenY: number,
  key: number,
  coinColor: string = COIN_COLOR_BASE,
  coinOutline: string = COIN_OUTLINE_BASE,
  coinHighlight: string = COIN_HIGHLIGHT_BASE
) => (
  <View
    key={`coin-${coin.id}-${key}`}
    style={[
      webStyles.coin,
      {
        left: screenX - coin.radius,
        top: screenY - coin.radius,
        width: coin.radius * 2,
        height: coin.radius * 2,
        borderRadius: coin.radius,
        backgroundColor: coinColor,
        borderColor: coinOutline,
      },
    ]}
  >
    <View
      style={[
        webStyles.coinHighlight,
        {
          width: coin.radius,
          height: coin.radius,
          borderRadius: coin.radius / 2,
          backgroundColor: coinHighlight,
        },
      ]}
    />
  </View>
);

const renderWebNPC = (npc: NPC, screenX: number, screenY: number, radius: number, key: number) => (
  <View
    key={`npc-${npc.id}-${key}`}
    style={{
      position: 'absolute',
      left: screenX - radius,
      top: screenY - radius,
      width: radius * 2,
      height: radius * 2,
      borderRadius: radius,
      backgroundColor: npc.color,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.25)',
    }}
  />
);

const renderSkiaVehicle = (vehicle: Vehicle, screenX: number, screenY: number, key: number) => {
  const halfWidth = vehicle.size / 2;
  const halfHeight = vehicle.size * 0.6 / 2; // Vehicle is taller than wide
  const shadowOffset = 3;
  
  return (
    <Group key={`vehicle-${vehicle.id}-${key}`}>
      {/* Shadow - simple offset rectangle */}
      <Rect
        x={screenX - halfWidth + shadowOffset}
        y={screenY - halfHeight + shadowOffset}
        width={vehicle.size}
        height={vehicle.size * 0.6}
        color="rgba(0,0,0,0.3)"
      />
      
      {/* Vehicle body - rotated group */}
      <Group
        transform={[
          { translateX: screenX },
          { translateY: screenY },
          { rotate: vehicle.rotation },
          { translateX: -screenX },
          { translateY: -screenY },
        ]}
      >
        {/* Vehicle body */}
        <Rect
          x={screenX - halfWidth}
          y={screenY - halfHeight}
          width={vehicle.size}
          height={vehicle.size * 0.6}
          color={vehicle.color}
        />
        
        {/* Vehicle outline */}
        <Rect
          x={screenX - halfWidth}
          y={screenY - halfHeight}
          width={vehicle.size}
          height={vehicle.size * 0.6}
          color="#000000"
          style="stroke"
          strokeWidth={2}
        />
        
        {/* Windshield */}
        <Rect
          x={screenX - halfWidth * 0.6}
          y={screenY - halfHeight * 0.5}
          width={vehicle.size * 0.5}
          height={vehicle.size * 0.15}
          color="#7fb3d3"
        />
      </Group>
    </Group>
  );
};

const renderSkiaProp = (propType: PropType, screenX: number, screenY: number, key: number) => {
  const size = 20; // Default prop size
  const halfSize = size / 2;

  switch (propType) {
    case 'tree':
      return (
        <Group key={`prop-${key}`}>
          {/* Tree trunk */}
          <Rect
            x={screenX - 3}
            y={screenY}
            width={6}
            height={halfSize}
            color="#4a3728"
          />
          {/* Tree foliage */}
          <Circle
            cx={screenX}
            cy={screenY - halfSize * 0.3}
            r={halfSize * 0.7}
            color="#2d5016"
          />
        </Group>
      );

    case 'lamp-post':
      return (
        <Group key={`prop-${key}`}>
          {/* Post */}
          <Rect
            x={screenX - 2}
            y={screenY - size}
            width={4}
            height={size}
            color="#555555"
          />
          {/* Light */}
          <RoundedRect
            x={screenX - 6}
            y={screenY - size - 6}
            width={12}
            height={6}
            r={3}
            color="#f0e68c"
          />
        </Group>
      );

    case 'bench':
      return (
        <RoundedRect
          key={`prop-${key}`}
          x={screenX - halfSize}
          y={screenY - halfSize * 0.25}
          width={size}
          height={size * 0.5}
          r={2}
          color="#8b4513"
        />
      );

    case 'trash-bin':
      return (
        <RoundedRect
          key={`prop-${key}`}
          x={screenX - halfSize * 0.6}
          y={screenY - halfSize}
          width={halfSize * 1.2}
          height={size}
          r={2}
          color="#444444"
        />
      );

    default:
      return null;
  }
};

const renderWebVehicle = (vehicle: Vehicle, screenX: number, screenY: number, key: number) => {
  const halfWidth = vehicle.size / 2;
  const halfHeight = vehicle.size * 0.6 / 2;
  
  return (
    <View
      key={`vehicle-${vehicle.id}-${key}`}
      style={{
        position: 'absolute',
        left: screenX - halfWidth,
        top: screenY - halfHeight,
        width: vehicle.size,
        height: vehicle.size * 0.6,
        backgroundColor: vehicle.color,
        borderWidth: 2,
        borderColor: '#000000',
        transform: [{ rotate: `${vehicle.rotation}rad` }],
      }}
    >
      {/* Windshield */}
      <View
        style={{
          position: 'absolute',
          left: halfWidth * 0.4,
          top: halfHeight * 0.2,
          width: vehicle.size * 0.5,
          height: vehicle.size * 0.15,
          backgroundColor: '#7fb3d3',
          borderRadius: 2,
        }}
      />
      {/* Vehicle shadow */}
      <View
        style={{
          position: 'absolute',
          left: 3,
          top: 3,
          width: vehicle.size,
          height: vehicle.size * 0.6,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: -1,
        }}
      />
    </View>
  );
};

const renderWebProp = (prop: Prop, screenX: number, screenY: number, key: number) => {
  const halfSize = prop.size / 2;

  switch (prop.type) {
    case 'tree':
      return (
        <View
          key={`prop-${prop.id}-${key}`}
          style={{
            position: 'absolute',
            left: screenX - halfSize,
            top: screenY - halfSize,
          }}
        >
          {/* Tree trunk */}
          <View
            style={{
              position: 'absolute',
              left: halfSize - 3,
              top: halfSize,
              width: 6,
              height: halfSize,
              backgroundColor: '#4a3728',
            }}
          />
          {/* Tree foliage */}
          <View
            style={{
              position: 'absolute',
              left: halfSize - halfSize * 0.7,
              top: halfSize * 0.2,
              width: halfSize * 1.4,
              height: halfSize * 1.4,
              borderRadius: halfSize * 0.7,
              backgroundColor: '#2d5016',
              borderWidth: 1,
              borderColor: '#1f3a0f',
            }}
          />
        </View>
      );

    case 'lamp-post':
      return (
        <View
          key={`prop-${prop.id}-${key}`}
          style={{
            position: 'absolute',
            left: screenX - 2,
            top: screenY - halfSize,
          }}
        >
          {/* Post */}
          <View
            style={{
              width: 4,
              height: prop.size,
              backgroundColor: '#555',
            }}
          />
          {/* Light */}
          <View
            style={{
              position: 'absolute',
              top: -6,
              left: -4,
              width: 12,
              height: 6,
              backgroundColor: '#f0e68c',
              borderRadius: 3,
            }}
          />
        </View>
      );

    case 'bench':
      return (
        <View
          key={`prop-${prop.id}-${key}`}
          style={{
            position: 'absolute',
            left: screenX - halfSize,
            top: screenY - halfSize * 0.5,
            width: prop.size,
            height: prop.size * 0.5,
            backgroundColor: '#8b4513',
            borderWidth: 1,
            borderColor: '#5d2e0a',
            borderRadius: 2,
          }}
        />
      );

    case 'trash-bin':
      return (
        <View
          key={`prop-${prop.id}-${key}`}
          style={{
            position: 'absolute',
            left: screenX - halfSize * 0.6,
            top: screenY - halfSize,
            width: halfSize * 1.2,
            height: prop.size,
            backgroundColor: '#444',
            borderWidth: 1,
            borderColor: '#222',
            borderRadius: 2,
          }}
        />
      );

    default:
      return null;
  }
};

const webStyles = StyleSheet.create({
  root: {
    position: 'relative',
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  tileBase: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  grass: {},
  pavement: {},
  curbTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#555',
  },
  curbBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#555',
  },
  curbLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#555',
  },
  curbRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#555',
  },
  crosswalkStripe: {
    position: 'absolute',
    left: TILE_SIZE * 0.1,
    right: TILE_SIZE * 0.1,
    height: TILE_SIZE * 0.12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  crosswalkStripeVertical: {
    position: 'absolute',
    top: TILE_SIZE * 0.1,
    bottom: TILE_SIZE * 0.1,
    width: TILE_SIZE * 0.12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  road: {
    backgroundColor: '#2a2a2a',
  },
  roadStripeHorizontal: {
    position: 'absolute',
    left: TILE_SIZE * 0.25,
    width: TILE_SIZE * 0.5,
    top: TILE_SIZE / 2 - 1,
    height: 2,
    backgroundColor: '#e0c030',
  },
  roadStripeVertical: {
    position: 'absolute',
    top: TILE_SIZE * 0.25,
    height: TILE_SIZE * 0.5,
    left: TILE_SIZE / 2 - 1,
    width: 2,
    backgroundColor: '#e0c030',
  },
  roadIntersection: {
    position: 'absolute',
    left: TILE_SIZE / 2 - (TILE_SIZE * 0.2) / 2,
    top: TILE_SIZE / 2 - (TILE_SIZE * 0.2) / 2,
    width: TILE_SIZE * 0.2,
    height: TILE_SIZE * 0.2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: TILE_SIZE * 0.02,
  },
  roadCornerNW: {
    position: 'absolute',
    right: TILE_SIZE * 0.375,
    bottom: TILE_SIZE * 0.375,
    width: TILE_SIZE * 0.25,
    height: TILE_SIZE * 0.25,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#e0c030',
    borderBottomRightRadius: TILE_SIZE * 0.15,
  },
  roadCornerNE: {
    position: 'absolute',
    left: TILE_SIZE * 0.375,
    bottom: TILE_SIZE * 0.375,
    width: TILE_SIZE * 0.25,
    height: TILE_SIZE * 0.25,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#e0c030',
    borderBottomLeftRadius: TILE_SIZE * 0.15,
  },
  roadCornerSW: {
    position: 'absolute',
    right: TILE_SIZE * 0.375,
    top: TILE_SIZE * 0.375,
    width: TILE_SIZE * 0.25,
    height: TILE_SIZE * 0.25,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: '#e0c030',
    borderTopRightRadius: TILE_SIZE * 0.15,
  },
  roadCornerSE: {
    position: 'absolute',
    left: TILE_SIZE * 0.375,
    top: TILE_SIZE * 0.375,
    width: TILE_SIZE * 0.25,
    height: TILE_SIZE * 0.25,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: '#e0c030',
    borderTopLeftRadius: TILE_SIZE * 0.15,
  },
  coin: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  coinHighlight: {
    opacity: 0.75,
  },
  buildingShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  buildingBody: {
    position: 'absolute',
    borderWidth: 1,
  },
  buildingRoof: {
    position: 'absolute',
  },
});
