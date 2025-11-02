import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';
import { GameState, Tile, Collectible, NPC, Prop } from '../types/Game';
import { IsometricGrass } from './IsometricGrass';
import { IsometricRoad, RoadNeighbors } from './IsometricRoad';
import { IsometricBuilding } from './IsometricBuilding';
import { computeBuildingStyle } from '../utils/BuildingStyle';
import { worldToIsometric, TILE_SIZE } from '../utils/Isometric';

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

interface ProjectedScene {
  tiles: ProjectedTile[];
  playerScreenPos: { x: number; y: number };
  coins: ProjectedCoin[];
  npcs: ProjectedNPC[];
  props: ProjectedProp[];
}

const CULL_MARGIN = TILE_SIZE * 2;
const GRASS_COLORS = ['#3d6b34', '#4a7c3f', '#416e38'];
const PAVEMENT_COLORS = ['#5b5b5b', '#616161', '#585858'];
const COIN_COLOR = '#f7d64c';
const COIN_OUTLINE = '#cfa12f';
const COIN_HIGHLIGHT = '#fff2a6';

const tileKey = (x: number, y: number) => `${x},${y}`;

const useProjectedScene = (
  gameState: GameState,
  width: number,
  height: number
): ProjectedScene => {
  const { player, tiles, collectibles, npcs, props } = gameState;
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

    return {
      tiles: projectedTiles,
      playerScreenPos,
      coins: projectedCoins,
      npcs: projectedNPCs,
      props: projectedProps,
    };
  }, [tiles, collectibles, npcs, props, playerX, playerY, width, height]);
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
  | { kind: 'player'; depth: number };

const buildRenderQueue = (
  tiles: ProjectedTile[],
  coins: ProjectedCoin[],
  npcs: ProjectedNPC[],
  props: ProjectedProp[],
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
  const { tiles, coins, npcs, props, playerScreenPos } = useProjectedScene(
    gameState,
    width,
    height
  );

  const renderQueue = useMemo(
    () => buildRenderQueue(tiles, coins, npcs, props, playerScreenPos.y),
    [tiles, coins, npcs, props, playerScreenPos.y]
  );

  return (
    <Canvas style={{ width, height, backgroundColor: '#1a1a1a' }}>
      <Group>
        {renderQueue.map((item, index) => {
          switch (item.kind) {
            case 'surface': {
              const { tile, screenX, screenY, neighbors } = item.tile;
              if (tile.type === 'grass' || tile.type === 'pavement') {
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
            case 'player':
              return (
                <Circle
                  key="player"
                  cx={playerScreenPos.x}
                  cy={playerScreenPos.y}
                  r={player.size / 2}
                  color="#4CAF50"
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
  const { tiles, coins, npcs, props, playerScreenPos } = useProjectedScene(
    gameState,
    width,
    height
  );

  const renderQueue = useMemo(
    () => buildRenderQueue(tiles, coins, npcs, props, playerScreenPos.y),
    [tiles, coins, npcs, props, playerScreenPos.y]
  );

  return (
    <View style={[webStyles.root, { width, height }]}> 
      {renderQueue.map((item, index) => {
        switch (item.kind) {
          case 'surface': {
            const { tile, screenX, screenY, neighbors } = item.tile;
            return renderWebSurface(tile, screenX, screenY, neighbors, index);
          }
          case 'building': {
            const { tile, screenX, screenY } = item.tile;
            return renderWebBuilding(tile, screenX, screenY, index);
          }
          case 'coin': {
            const { coin, screenX, screenY } = item.coin;
            return renderWebCoin(coin, screenX, screenY, index);
          }
          case 'npc': {
            const { npc, screenX, screenY, radius } = item.npc;
            return renderWebNPC(npc, screenX, screenY, radius, index);
          }
          case 'prop': {
            const { prop, screenX, screenY } = item.prop;
            return renderWebProp(prop, screenX, screenY, index);
          }
          case 'player':
            return (
              <View
                key="player"
                style={{
                  position: 'absolute',
                  left: playerScreenPos.x - player.size / 2,
                  top: playerScreenPos.y - player.size / 2,
                  width: player.size,
                  height: player.size,
                  borderRadius: player.size / 2,
                  backgroundColor: '#4CAF50',
                  borderWidth: 2,
                  borderColor: '#2e7d32',
                }}
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

const renderTrafficLight = (screenX: number, screenY: number, key: number) => {
  const lightSize = TILE_SIZE * 0.15;
  const poleHeight = TILE_SIZE * 0.4;
  
  return (
    <View key={`traffic-light-${key}`} style={{ position: 'absolute', left: screenX, top: screenY }}>
      {/* Traffic light pole */}
      <View
        style={{
          position: 'absolute',
          left: TILE_SIZE * 0.85,
          top: TILE_SIZE * 0.1,
          width: 4,
          height: poleHeight,
          backgroundColor: '#333',
        }}
      />
      {/* Traffic light box */}
      <View
        style={{
          position: 'absolute',
          left: TILE_SIZE * 0.85 - lightSize / 2 + 2,
          top: TILE_SIZE * 0.1,
          width: lightSize,
          height: lightSize * 3,
          backgroundColor: '#222',
          borderWidth: 1,
          borderColor: '#000',
          borderRadius: 2,
        }}
      >
        {/* Red light */}
        <View
          style={{
            width: lightSize * 0.6,
            height: lightSize * 0.6,
            borderRadius: (lightSize * 0.6) / 2,
            backgroundColor: '#ff4444',
            margin: lightSize * 0.2,
          }}
        />
        {/* Yellow light */}
        <View
          style={{
            width: lightSize * 0.6,
            height: lightSize * 0.6,
            borderRadius: (lightSize * 0.6) / 2,
            backgroundColor: '#444',
            margin: lightSize * 0.2,
          }}
        />
        {/* Green light */}
        <View
          style={{
            width: lightSize * 0.6,
            height: lightSize * 0.6,
            borderRadius: (lightSize * 0.6) / 2,
            backgroundColor: '#444',
            margin: lightSize * 0.2,
          }}
        />
      </View>
    </View>
  );
};

const renderWebSurface = (
  tile: Tile,
  screenX: number,
  screenY: number,
  neighbors: RoadNeighbors,
  key: number
) => {
  if (tile.type === 'grass' || tile.type === 'pavement') {
    const palette = tile.type === 'pavement' ? PAVEMENT_COLORS : GRASS_COLORS;
    const colorVariant = (tile.x + tile.y) % palette.length;
    const baseColor = palette[colorVariant];
    
    // Check if this is a pavement tile adjacent to roads
    const isPavement = tile.type === 'pavement';
    const hasCurbTop = isPavement && neighbors.top;
    const hasCurbBottom = isPavement && neighbors.bottom;
    const hasCurbLeft = isPavement && neighbors.left;
    const hasCurbRight = isPavement && neighbors.right;
    
    // Check if this is a crosswalk (pavement between two parallel roads)
    const isHorizontalCrosswalk = isPavement && neighbors.left && neighbors.right;
    const isVerticalCrosswalk = isPavement && neighbors.top && neighbors.bottom;
    
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
        
        {/* Crosswalk stripes */}
        {isHorizontalCrosswalk && (
          <>
            <View style={[webStyles.crosswalkStripe, { top: TILE_SIZE * 0.2 }]} />
            <View style={[webStyles.crosswalkStripe, { top: TILE_SIZE * 0.4 }]} />
            <View style={[webStyles.crosswalkStripe, { top: TILE_SIZE * 0.6 }]} />
            <View style={[webStyles.crosswalkStripe, { top: TILE_SIZE * 0.8 }]} />
          </>
        )}
        {isVerticalCrosswalk && (
          <>
            <View style={[webStyles.crosswalkStripeVertical, { left: TILE_SIZE * 0.2 }]} />
            <View style={[webStyles.crosswalkStripeVertical, { left: TILE_SIZE * 0.4 }]} />
            <View style={[webStyles.crosswalkStripeVertical, { left: TILE_SIZE * 0.6 }]} />
            <View style={[webStyles.crosswalkStripeVertical, { left: TILE_SIZE * 0.8 }]} />
          </>
        )}
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
    
    const hasTrafficLight = shouldHaveTrafficLight(tile, neighbors);
    
    return (
      <React.Fragment key={`road-frag-${tile.x}-${tile.y}-${key}`}>
        <View
          key={`road-${tile.x}-${tile.y}-${key}`}
          style={[webStyles.tileBase, webStyles.road, { left: screenX, top: screenY }]}
        >
          {/* Horizontal road markings */}
          {(isHorizontal || isCrossroads || isTJunction) && (left || right) && (
            <View style={webStyles.roadStripeHorizontal} />
          )}
          
          {/* Vertical road markings */}
          {(isVertical || isCrossroads || isTJunction) && (top || bottom) && (
            <View style={webStyles.roadStripeVertical} />
          )}
          
          {/* Intersection marking (center dot) */}
          {(isCrossroads || isTJunction) && (
            <View style={webStyles.roadIntersection} />
          )}
          
          {/* Corner markings - add subtle corner lines */}
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
        </View>
        
        {/* Traffic light at major intersections */}
        {hasTrafficLight && renderTrafficLight(screenX, screenY, key)}
      </React.Fragment>
    );
  }

  return null;
};

const renderWebBuilding = (tile: Tile, screenX: number, screenY: number, key: number) => {
  const style = computeBuildingStyle(tile, screenX, screenY);

  return (
    <React.Fragment key={`building-${tile.x}-${tile.y}-${key}`}>
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
      <View
        style={[
          webStyles.buildingBody,
          {
            left: style.body.x,
            top: style.body.y,
            width: style.body.width,
            height: style.body.height,
            backgroundColor: style.bodyColor,
            borderColor: style.bodyBorderColor,
          },
        ]}
      />
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
    </React.Fragment>
  );
};

const renderWebCoin = (coin: Collectible, screenX: number, screenY: number, key: number) => (
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
    left: TILE_SIZE * 0.1,
    width: TILE_SIZE * 0.8,
    top: TILE_SIZE / 2 - 1,
    height: 2,
    backgroundColor: '#e0c030',
  },
  roadStripeVertical: {
    position: 'absolute',
    top: TILE_SIZE * 0.1,
    height: TILE_SIZE * 0.8,
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
    left: TILE_SIZE * 0.15,
    top: TILE_SIZE * 0.15,
    width: TILE_SIZE * 0.35,
    height: TILE_SIZE * 0.35,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: '#e0c030',
    borderTopLeftRadius: TILE_SIZE * 0.2,
  },
  roadCornerNE: {
    position: 'absolute',
    right: TILE_SIZE * 0.15,
    top: TILE_SIZE * 0.15,
    width: TILE_SIZE * 0.35,
    height: TILE_SIZE * 0.35,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: '#e0c030',
    borderTopRightRadius: TILE_SIZE * 0.2,
  },
  roadCornerSW: {
    position: 'absolute',
    left: TILE_SIZE * 0.15,
    bottom: TILE_SIZE * 0.15,
    width: TILE_SIZE * 0.35,
    height: TILE_SIZE * 0.35,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#e0c030',
    borderBottomLeftRadius: TILE_SIZE * 0.2,
  },
  roadCornerSE: {
    position: 'absolute',
    right: TILE_SIZE * 0.15,
    bottom: TILE_SIZE * 0.15,
    width: TILE_SIZE * 0.35,
    height: TILE_SIZE * 0.35,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#e0c030',
    borderBottomRightRadius: TILE_SIZE * 0.2,
  },
  coin: {
    position: 'absolute',
    backgroundColor: COIN_COLOR,
    borderWidth: 2,
    borderColor: COIN_OUTLINE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinHighlight: {
    backgroundColor: COIN_HIGHLIGHT,
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
