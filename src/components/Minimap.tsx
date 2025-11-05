import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GameState, Tile, Vehicle, NPC } from '../types/Game';
import { TILE_SIZE } from '../utils/Isometric';

interface MinimapProps {
  gameState: GameState;
  size?: number;
}

export const Minimap: React.FC<MinimapProps> = ({ gameState, size = 150 }) => {
  const { player, tiles, vehicles, npcs } = gameState;
  
  // Calculate map bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const tile of tiles) {
    const worldX = tile.x * TILE_SIZE;
    const worldY = tile.y * TILE_SIZE;
    minX = Math.min(minX, worldX);
    minY = Math.min(minY, worldY);
    maxX = Math.max(maxX, worldX + TILE_SIZE);
    maxY = Math.max(maxY, worldY + TILE_SIZE);
  }
  
  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;
  const scale = size / Math.max(worldWidth, worldHeight);
  
  // Helper function to convert world coordinates to minimap coordinates
  const worldToMinimap = (worldX: number, worldY: number) => ({
    x: (worldX - minX) * scale,
    y: (worldY - minY) * scale,
  });
  
  // Render tiles
  const renderTiles = () => {
    const tileElements: JSX.Element[] = [];
    
    for (const tile of tiles) {
      const worldX = tile.x * TILE_SIZE;
      const worldY = tile.y * TILE_SIZE;
      const pos = worldToMinimap(worldX, worldY);
      const tileSize = TILE_SIZE * scale;
      
      let color = '#2d5016'; // Default grass
      
      switch (tile.type) {
        case 'road':
          color = '#4a4a4a';
          break;
        case 'pavement':
          color = '#6b6b6b';
          break;
        case 'building':
          color = '#8b4513';
          break;
        case 'water':
          color = '#1e90ff';
          break;
        case 'bridge':
          color = '#696969';
          break;
      }
      
      tileElements.push(
        <View
          key={`tile-${tile.x}-${tile.y}`}
          style={[
            styles.tile,
            {
              left: pos.x,
              top: pos.y,
              width: Math.max(1, tileSize),
              height: Math.max(1, tileSize),
              backgroundColor: color,
            },
          ]}
        />
      );
    }
    
    return tileElements;
  };
  
  // Render player
  const renderPlayer = () => {
    const pos = worldToMinimap(player.position.x, player.position.y);
    return (
      <View
        key="player"
        style={[
          styles.player,
          {
            left: pos.x - 3,
            top: pos.y - 3,
          },
        ]}
      />
    );
  };
  
  // Render vehicles
  const renderVehicles = () => {
    return vehicles.map((vehicle) => {
      const pos = worldToMinimap(vehicle.position.x, vehicle.position.y);
      return (
        <View
          key={vehicle.id}
          style={[
            styles.vehicle,
            {
              left: pos.x - 2,
              top: pos.y - 2,
              backgroundColor: vehicle.isPolice ? '#0047AB' : '#ffcc00',
            },
          ]}
        />
      );
    });
  };
  
  // Render NPCs (only if not too many)
  const renderNPCs = () => {
    if (npcs.length > 50) return null; // Don't render if too many for performance
    
    return npcs.map((npc) => {
      const pos = worldToMinimap(npc.position.x, npc.position.y);
      return (
        <View
          key={npc.id}
          style={[
            styles.npc,
            {
              left: pos.x - 1,
              top: pos.y - 1,
            },
          ]}
        />
      );
    });
  };
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.map}>
        {renderTiles()}
        {renderVehicles()}
        {renderNPCs()}
        {renderPlayer()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  tile: {
    position: 'absolute',
  },
  player: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff00',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  vehicle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  npc: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff',
    opacity: 0.6,
  },
});

