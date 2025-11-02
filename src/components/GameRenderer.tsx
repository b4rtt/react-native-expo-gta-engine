import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';
import { GameState, Tile, Collectible } from '../types/Game';
import { IsometricGrass } from './IsometricGrass';
import { IsometricRoad, RoadNeighbors } from './IsometricRoad';
import { IsometricBuilding } from './IsometricBuilding';
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

interface ProjectedScene {
  tiles: ProjectedTile[];
  playerScreenPos: { x: number; y: number };
  playerDepth: number;
  coinsByTile: Map<string, ProjectedCoin[]>;
}

const CULL_MARGIN = TILE_SIZE * 2;
const GRASS_COLORS = ['#3d6b34', '#4a7c3f', '#416e38'];
const PAVEMENT_COLORS = ['#5b5b5b', '#616161', '#585858'];
const BUILDING_BASE_COLORS = ['#5a4a4a', '#4a5a5a', '#4a4a5a', '#5a5a4a', '#4a4a4a'];
const COIN_COLOR = '#f7d64c';
const COIN_OUTLINE = '#cfa12f';
const COIN_HIGHLIGHT = '#fff2a6';

const tileKey = (x: number, y: number) => `${x},${y}`;

const useProjectedScene = (
  gameState: GameState,
  width: number,
  height: number
): ProjectedScene => {
  const { player, tiles, collectibles } = gameState;
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
    const coinsByTile = new Map<string, ProjectedCoin[]>();

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

      const neighbors: RoadNeighbors =
        tile.type === 'road'
          ? {
              left: roadSet.has(tileKey(tile.x - 1, tile.y)),
              right: roadSet.has(tileKey(tile.x + 1, tile.y)),
              top: roadSet.has(tileKey(tile.x, tile.y - 1)),
              bottom: roadSet.has(tileKey(tile.x, tile.y + 1)),
            }
          : { left: false, right: false, top: false, bottom: false };

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

      const tileX = Math.floor(collectible.position.x / TILE_SIZE);
      const tileY = Math.floor(collectible.position.y / TILE_SIZE);
      const key = tileKey(tileX, tileY);
      const existing = coinsByTile.get(key);
      if (existing) {
        existing.push(projectedCoin);
      } else {
        coinsByTile.set(key, [projectedCoin]);
      }
    }

    const playerScreenPos = {
      x: halfWidth,
      y: halfHeight,
    };

    const playerDepth =
      playerCenterX / TILE_SIZE + playerCenterY / TILE_SIZE;

    return {
      tiles: projectedTiles,
      playerScreenPos,
      playerDepth,
      coinsByTile,
    };
  }, [tiles, collectibles, playerX, playerY, width, height]);
};

export const GameRenderer: React.FC<GameRendererProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebGameRenderer {...props} />;
  }
  return <SkiaGameRenderer {...props} />;
};

const SkiaGameRenderer: React.FC<GameRendererProps> = ({
  gameState,
  width,
  height,
}) => {
  const { player } = gameState;
  const { tiles, playerScreenPos, playerDepth, coinsByTile } = useProjectedScene(
    gameState,
    width,
    height
  );

  const renderPlayer = () => (
    <Circle
      cx={playerScreenPos.x}
      cy={playerScreenPos.y}
      r={player.size / 2}
      color="#4CAF50"
    />
  );

  let playerRendered = false;

  return (
    <Canvas style={{ width, height, backgroundColor: '#1a1a1a' }}>
      <Group>
        {tiles.map(({ tile, screenX, screenY, neighbors, depth }) => {
          const renderPlayerNow = !playerRendered && playerDepth <= depth;
          if (renderPlayerNow) {
            playerRendered = true;
          }
          const coinsForTile = coinsByTile.get(tileKey(tile.x, tile.y));

          return (
            <React.Fragment key={`tile-${tile.x}-${tile.y}`}>
              {renderPlayerNow && renderPlayer()}
              {(tile.type === 'grass' || tile.type === 'pavement') && (
                <IsometricGrass tile={tile} screenX={screenX} screenY={screenY} />
              )}
              {tile.type === 'road' && (
                <IsometricRoad
                  tile={tile}
                  screenX={screenX}
                  screenY={screenY}
                  neighbors={neighbors}
                />
              )}
              {coinsForTile?.map(({ coin, screenX: coinX, screenY: coinY }) => (
                <Group key={coin.id}>
                  <Circle cx={coinX} cy={coinY} r={coin.radius} color={COIN_COLOR} />
                  <Circle
                    cx={coinX}
                    cy={coinY}
                    r={coin.radius}
                    color={COIN_OUTLINE}
                    style="stroke"
                    strokeWidth={2}
                  />
                  <Circle
                    cx={coinX}
                    cy={coinY - coin.radius * 0.4}
                    r={coin.radius * 0.45}
                    color={COIN_HIGHLIGHT}
                  />
                </Group>
              ))}
              {tile.type === 'building' && (
                <IsometricBuilding
                  tile={tile}
                  screenX={screenX}
                  screenY={screenY}
                />
              )}
            </React.Fragment>
          );
        })}
        {!playerRendered && renderPlayer()}
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
  const { tiles, playerScreenPos, playerDepth, coinsByTile } = useProjectedScene(
    gameState,
    width,
    height
  );

  const renderPlayer = () => (
    <View
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

  let playerRendered = false;

  return (
    <View style={[webStyles.root, { width, height }]}>
      {tiles.map(({ tile, screenX, screenY, neighbors, depth }) => {
        const renderPlayerNow = !playerRendered && playerDepth <= depth;
        if (renderPlayerNow) {
          playerRendered = true;
        }
        const coinsForTile = coinsByTile.get(tileKey(tile.x, tile.y));

        return (
          <React.Fragment key={`tile-${tile.x}-${tile.y}`}>
            {renderPlayerNow && renderPlayer()}
            {renderWebTile(tile, screenX, screenY, neighbors, coinsForTile)}
          </React.Fragment>
        );
      })}
      {!playerRendered && renderPlayer()}
    </View>
  );
};

const renderWebTile = (
  tile: Tile,
  screenX: number,
  screenY: number,
  neighbors: RoadNeighbors,
  coinsForTile?: ProjectedCoin[]
) => {
  const coinElements = coinsForTile?.map(({ coin, screenX: coinX, screenY: coinY }) => (
    <View
      key={coin.id}
      style={[
        webStyles.coin,
        {
          left: coinX - coin.radius,
          top: coinY - coin.radius,
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
  ));

  if (tile.type === 'grass' || tile.type === 'pavement') {
    const palette = tile.type === 'pavement' ? PAVEMENT_COLORS : GRASS_COLORS;
    const colorVariant = (tile.x + tile.y) % palette.length;
    const baseColor = palette[colorVariant];
    return (
      <>
        <View
          style={[
            webStyles.tileBase,
            tile.type === 'pavement' ? webStyles.pavement : webStyles.grass,
            {
              left: screenX,
              top: screenY,
              backgroundColor: baseColor,
            },
          ]}
        />
        {coinElements}
      </>
    );
  }

  if (tile.type === 'road') {
    return (
      <>
        <View
          style={[webStyles.tileBase, webStyles.road, { left: screenX, top: screenY }]}
        >
          {(neighbors.left || neighbors.right) && (
            <View style={webStyles.roadStripeHorizontal} />
          )}
          {(neighbors.top || neighbors.bottom) && (
            <View style={webStyles.roadStripeVertical} />
          )}
          {(neighbors.left || neighbors.right) &&
            (neighbors.top || neighbors.bottom) && (
              <View style={webStyles.roadIntersection} />
            )}
        </View>
        {coinElements}
      </>
    );
  }

  const buildingHeight = tile.buildingHeight || 1;
  const footprint = TILE_SIZE * 0.8;
  const offset = (TILE_SIZE - footprint) / 2;
  const elevation = buildingHeight * (TILE_SIZE / 6);
  const colorVariant =
    ((tile.x * 7 + tile.y * 13) % BUILDING_BASE_COLORS.length + BUILDING_BASE_COLORS.length) %
    BUILDING_BASE_COLORS.length;
  const baseColor = BUILDING_BASE_COLORS[colorVariant];
  const darker = adjustBrightness(baseColor, 0.85);
  const lighter = adjustBrightness(baseColor, 1.3);

  return (
    <>
      <View
        style={[
          webStyles.buildingShadow,
          {
            left: screenX + offset + 4,
            top: screenY + offset + 4,
            width: footprint,
            height: footprint,
          },
        ]}
      />
      <View
        style={[
          webStyles.buildingBody,
          {
            left: screenX + offset,
            top: screenY + offset - elevation,
            width: footprint,
            height: footprint + elevation,
            backgroundColor: baseColor,
            borderColor: darker,
          },
        ]}
      />
      <View
        style={[
          webStyles.buildingRoof,
          {
            left: screenX + offset,
            top: screenY + offset - elevation,
            width: footprint,
            height: footprint,
            backgroundColor: lighter,
          },
        ]}
      />
      {coinElements}
    </>
  );
};

const adjustBrightness = (hexColor: string, factor: number): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));
  const newB = Math.min(255, Math.floor(b * factor));

  return `#${newR.toString(16).padStart(2, '0')}${newG
    .toString(16)
    .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
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
  grass: {
    borderWidth: 1,
    borderColor: '#1f3d1c',
  },
  pavement: {
    borderWidth: 1,
    borderColor: '#2e2e2e',
  },
  road: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#1b1b1b',
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
