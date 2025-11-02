import { Collectible, Tile, Vector2 } from '../types/Game';
import { TILE_SIZE } from './Isometric';

const COIN_RADIUS = TILE_SIZE * 0.2;
const COIN_VALUE = 1;

const isValidCoinTile = (tile: Tile): boolean => {
  return tile.type === 'grass' || tile.type === 'pavement';
};

export const generateCoins = (tiles: Tile[], maxCoins: number = 40): Collectible[] => {
  const coins: Collectible[] = [];

  for (const tile of tiles) {
    if (!isValidCoinTile(tile)) {
      continue;
    }

    const seed = tile.x * 73 + tile.y * 101;
    if (seed % 7 !== 0) {
      continue;
    }

    const coin: Collectible = {
      id: `coin-${tile.x}-${tile.y}`,
      type: 'coin',
      position: {
        x: tile.x * TILE_SIZE + TILE_SIZE / 2,
        y: tile.y * TILE_SIZE + TILE_SIZE / 2,
      },
      radius: COIN_RADIUS,
      value: COIN_VALUE,
      collected: false,
    };

    coins.push(coin);

    if (coins.length >= maxCoins) {
      break;
    }
  }

  return coins;
};

export const resolveCoinCollection = (
  collectibles: Collectible[],
  playerPosition: Vector2,
  playerRadius: number
): { collectibles: Collectible[]; collectedValue: number } => {
  let collectedValue = 0;
  let hasChange = false;

  const updatedCollectibles = collectibles.map((coin) => {
    if (coin.collected) {
      return coin;
    }

    const dx = coin.position.x - playerPosition.x;
    const dy = coin.position.y - playerPosition.y;
    const combinedRadius = playerRadius + coin.radius;

    if (dx * dx + dy * dy <= combinedRadius * combinedRadius) {
      collectedValue += coin.value;
      hasChange = true;
      return {
        ...coin,
        collected: true,
      };
    }

    return coin;
  });

  return {
    collectibles: hasChange ? updatedCollectibles : collectibles,
    collectedValue,
  };
};
