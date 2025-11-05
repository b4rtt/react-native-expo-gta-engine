import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Player } from '../types/Game';
import { getSpriteCoords, SPRITE_SIZE } from '../utils/SpriteAnimation';

interface PlayerSpriteWebProps {
  player: Player;
  screenX: number;
  screenY: number;
}

const PLAYER_SIZE = SPRITE_SIZE;

export const PlayerSpriteWeb: React.FC<PlayerSpriteWebProps> = ({
  player,
  screenX,
  screenY,
}) => {
  const { animation } = player;
  const direction = animation.direction;
  const animationType = animation.type;
  const frame = animation.currentFrame;

  // Get the sprite coordinates in the spritesheet
  const { col, row } = getSpriteCoords(direction, animationType, frame);

  // Calculate source rectangle in the spritesheet - use integer values
  const srcX = Math.floor(col * SPRITE_SIZE);
  let srcY = Math.floor(row * SPRITE_SIZE);

  // Calculate destination position (centered) - use integer values
  const halfSize = PLAYER_SIZE / 2;
  const destX = Math.floor(screenX - halfSize);
  let destY = Math.floor(screenY - halfSize);

  // For back walk frames from row 1, shift container up 2px to hide row 2 artifacts
  const isBackWalkFromRow1 = direction === 'back' && animationType === 'walk' && row === 1;
  if (isBackWalkFromRow1) {
    destY = destY - 2; // Shift container up 2px to hide row 2 artifacts
  }

  let spriteTopOffset = -srcY;

  // For left direction, we need to mirror the sprite horizontally
  const shouldMirror = direction === 'left';

  // Calculate container height - reduce for back walk row 1 to hide artifacts
  const containerHeight = isBackWalkFromRow1 
    ? PLAYER_SIZE - 2  // Reduce by 2px for row 1 frames
    : (direction === 'back' && animationType === 'walk')
    ? PLAYER_SIZE - 1  // Reduce by 1px for other back walk frames
    : PLAYER_SIZE;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      left: destX,
      top: destY,
      width: PLAYER_SIZE,
      height: containerHeight,
      overflow: 'hidden',
      transform: shouldMirror ? [{ scaleX: -1 }] : undefined,
    },
    sprite: {
      width: SPRITE_SIZE * 6, // Full spritesheet width (6 columns)
      height: SPRITE_SIZE * 3, // Full spritesheet height (3 rows)
      position: 'absolute',
      left: -srcX, // Precise offset for sprite position
      top: spriteTopOffset, // Adjusted offset for back walk row 1 to hide artifacts
    },
  });

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/character-spritesheet.png')}
        style={styles.sprite}
        resizeMode="stretch"
      />
    </View>
  );
};

