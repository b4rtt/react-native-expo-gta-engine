import { Prop, Tile, PropType } from '../types/Game';
import { TILE_SIZE } from './Isometric';

export const generateProps = (tiles: Tile[]): Prop[] => {
  const props: Prop[] = [];
  let propId = 0;

  for (const tile of tiles) {
    const seed = tile.x * 73 + tile.y * 37;
    const tileWorldX = tile.x * TILE_SIZE;
    const tileWorldY = tile.y * TILE_SIZE;

    // Trees on grass tiles (not near buildings)
    if (tile.type === 'grass') {
      // 15% chance of tree
      if (seed % 7 === 0) {
        const offsetX = ((seed * 17) % TILE_SIZE) - TILE_SIZE / 2;
        const offsetY = ((seed * 23) % TILE_SIZE) - TILE_SIZE / 2;
        
        props.push({
          id: `prop-${propId++}`,
          type: 'tree',
          position: {
            x: tileWorldX + TILE_SIZE / 2 + offsetX * 0.4,
            y: tileWorldY + TILE_SIZE / 2 + offsetY * 0.4,
          },
          rotation: (seed % 4) * (Math.PI / 2),
          size: 28 + (seed % 12), // 28-40 pixels
        });
      }
    }

    // Lamp posts on pavement near roads
    if (tile.type === 'pavement') {
      // 8% chance of lamp post
      if (seed % 13 === 0) {
        props.push({
          id: `prop-${propId++}`,
          type: 'lamp-post',
          position: {
            x: tileWorldX + TILE_SIZE / 2,
            y: tileWorldY + TILE_SIZE / 2,
          },
          rotation: 0,
          size: 16,
        });
      }
      
      // Benches
      if (seed % 17 === 2) {
        props.push({
          id: `prop-${propId++}`,
          type: 'bench',
          position: {
            x: tileWorldX + TILE_SIZE / 2 + ((seed % 2) - 0.5) * 8,
            y: tileWorldY + TILE_SIZE / 2,
          },
          rotation: (seed % 2) * Math.PI / 2,
          size: 24,
        });
      }
      
      // Trash bins
      if (seed % 19 === 3) {
        props.push({
          id: `prop-${propId++}`,
          type: 'trash-bin',
          position: {
            x: tileWorldX + TILE_SIZE / 2,
            y: tileWorldY + TILE_SIZE / 2 + ((seed % 2) - 0.5) * 8,
          },
          rotation: 0,
          size: 16,
        });
      }
    }
  }

  return props;
};

