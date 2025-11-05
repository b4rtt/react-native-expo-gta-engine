import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Canvas, Rect, Circle, Group } from '@shopify/react-native-skia';
import { GameState } from '../types/Game';
import { worldToIsometric, TILE_SIZE } from '../utils/Isometric';

interface DebugOverlayProps {
  gameState: GameState;
  width: number;
  height: number;
  showCollisionBoxes: boolean;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  gameState,
  width,
  height,
  showCollisionBoxes,
}) => {
  const { player, npcs, tiles, fps } = gameState;
  const playerTileX = Math.floor(player.position.x / TILE_SIZE);
  const playerTileY = Math.floor(player.position.y / TILE_SIZE);

  // Calculate player screen position (center of screen)
  const playerIso = worldToIsometric({ x: player.position.x, y: player.position.y, z: 0 });
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.overlay}>
        {/* FPS Counter */}
        <View style={styles.debugPanel}>
          <Text style={styles.debugText}>FPS: {fps ? Math.round(fps) : '--'}</Text>
          <Text style={styles.debugText}>
            Tile: ({playerTileX}, {playerTileY})
          </Text>
          <Text style={styles.debugText}>
            World: ({Math.round(player.position.x)}, {Math.round(player.position.y)})
          </Text>
          <Text style={styles.debugText}>
            Velocity: ({player.velocity.x.toFixed(2)}, {player.velocity.y.toFixed(2)})
          </Text>
        </View>

        {/* Collision Boxes */}
        {showCollisionBoxes && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Player collision box */}
            <View
              style={[
                styles.collisionBox,
                {
                  left: halfWidth - player.size / 2,
                  top: halfHeight - player.size / 2,
                  width: player.size,
                  height: player.size,
                  borderColor: '#00ff00',
                },
              ]}
            />

            {/* NPC collision boxes */}
            {npcs.map((npc) => {
              const npcIso = worldToIsometric({ x: npc.position.x, y: npc.position.y, z: 0 });
              const screenX = npcIso.x - playerIso.x + halfWidth;
              const screenY = npcIso.y - playerIso.y + halfHeight;

              // Cull NPCs outside viewport
              if (
                screenX + npc.size < 0 ||
                screenX > width ||
                screenY + npc.size < 0 ||
                screenY > height
              ) {
                return null;
              }

              return (
                <View
                  key={npc.id}
                  style={[
                    styles.collisionBox,
                    {
                      left: screenX - npc.size / 2,
                      top: screenY - npc.size / 2,
                      width: npc.size,
                      height: npc.size,
                      borderColor: '#ff00ff',
                    },
                  ]}
                />
              );
            })}

            {/* Building collision boxes */}
            {tiles
              .filter((tile) => tile.type === 'building')
              .map((tile) => {
                const worldPos = { x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE, z: 0 };
                const iso = worldToIsometric(worldPos);
                const screenX = iso.x - playerIso.x + halfWidth;
                const screenY = iso.y - playerIso.y + halfHeight;

                // Cull buildings outside viewport
                if (
                  screenX + TILE_SIZE < 0 ||
                  screenX > width ||
                  screenY + TILE_SIZE < 0 ||
                  screenY > height
                ) {
                  return null;
                }

                return (
                  <View
                    key={`building-${tile.x}-${tile.y}`}
                    style={[
                      styles.collisionBox,
                      {
                        left: screenX,
                        top: screenY,
                        width: TILE_SIZE,
                        height: TILE_SIZE,
                        borderColor: '#ff0000',
                      },
                    ]}
                  />
                );
              })}
          </View>
        )}
      </View>
    );
  }

  // Skia version for native
  return (
    <View style={styles.overlay}>
      {/* FPS Counter */}
      <View style={styles.debugPanel}>
        <Text style={styles.debugText}>FPS: {fps ? Math.round(fps) : '--'}</Text>
        <Text style={styles.debugText}>
          Tile: ({playerTileX}, {playerTileY})
        </Text>
        <Text style={styles.debugText}>
          World: ({Math.round(player.position.x)}, {Math.round(player.position.y)})
        </Text>
        <Text style={styles.debugText}>
          Velocity: ({player.velocity.x.toFixed(2)}, {player.velocity.y.toFixed(2)})
        </Text>
      </View>

      {/* Collision Boxes - Skia */}
      {showCollisionBoxes && (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Group>
            {/* Player collision box */}
            <Rect
              x={halfWidth - player.size / 2}
              y={halfHeight - player.size / 2}
              width={player.size}
              height={player.size}
              color="#00ff00"
              style="stroke"
              strokeWidth={2}
            />

            {/* NPC collision boxes */}
            {npcs.map((npc) => {
              const npcIso = worldToIsometric({ x: npc.position.x, y: npc.position.y, z: 0 });
              const screenX = npcIso.x - playerIso.x + halfWidth;
              const screenY = npcIso.y - playerIso.y + halfHeight;

              // Cull NPCs outside viewport
              if (
                screenX + npc.size < 0 ||
                screenX > width ||
                screenY + npc.size < 0 ||
                screenY > height
              ) {
                return null;
              }

              return (
                <Rect
                  key={npc.id}
                  x={screenX - npc.size / 2}
                  y={screenY - npc.size / 2}
                  width={npc.size}
                  height={npc.size}
                  color="#ff00ff"
                  style="stroke"
                  strokeWidth={2}
                />
              );
            })}

            {/* Building collision boxes */}
            {tiles
              .filter((tile) => tile.type === 'building')
              .map((tile) => {
                const worldPos = { x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE, z: 0 };
                const iso = worldToIsometric(worldPos);
                const screenX = iso.x - playerIso.x + halfWidth;
                const screenY = iso.y - playerIso.y + halfHeight;

                // Cull buildings outside viewport
                if (
                  screenX + TILE_SIZE < 0 ||
                  screenX > width ||
                  screenY + TILE_SIZE < 0 ||
                  screenY > height
                ) {
                  return null;
                }

                return (
                  <Rect
                    key={`building-${tile.x}-${tile.y}`}
                    x={screenX}
                    y={screenY}
                    width={TILE_SIZE}
                    height={TILE_SIZE}
                    color="#ff0000"
                    style="stroke"
                    strokeWidth={2}
                  />
                );
              })}
          </Group>
        </Canvas>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 10000,
  },
  debugPanel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    minWidth: 200,
  },
  debugText: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    marginVertical: 2,
  },
  collisionBox: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
});

