import React from 'react';
import { Group, Image, useImage, Rect, Skia } from '@shopify/react-native-skia';
import { Player } from '../types/Game';
import { getSpriteCoords, SPRITE_SIZE } from '../utils/SpriteAnimation';

interface PlayerSpriteProps {
  player: Player;
  screenX: number;
  screenY: number;
}

const PLAYER_SIZE = SPRITE_SIZE;

export const PlayerSprite: React.FC<PlayerSpriteProps> = ({
  player,
  screenX,
  screenY,
}) => {
  const { animation } = player;
  const direction = animation.direction;
  const animationType = animation.type;
  const frame = animation.currentFrame;

  // Load the spritesheet image
  const spritesheet = useImage(require('../../assets/character-spritesheet.png'));

  // Get the sprite coordinates in the spritesheet
  const { col, row } = getSpriteCoords(direction, animationType, frame);

  // Calculate source rectangle in the spritesheet
  const srcX = col * SPRITE_SIZE;
  const srcY = row * SPRITE_SIZE;

  // Calculate destination position (centered)
  const halfSize = PLAYER_SIZE / 2;
  const destX = screenX - halfSize;
  let destY = screenY - halfSize;
  
  // For back walk frames from row 1, shift sprite up 2px to hide row 2 artifacts
  const isBackWalkFromRow1 = direction === 'back' && animationType === 'walk' && row === 1;
  if (isBackWalkFromRow1) {
    destY = destY - 2; // Shift sprite up 2px to hide row 2 artifacts
  }

  // For left direction, we need to mirror the sprite horizontally
  const shouldMirror = direction === 'left';

  // If image hasn't loaded yet, show a fallback rectangle
  if (!spritesheet) {
    return (
      <Group>
        <Rect
          x={destX}
          y={destY}
          width={PLAYER_SIZE}
          height={PLAYER_SIZE}
          color="#ff0000"
          opacity={0.5}
        />
      </Group>
    );
  }

  // Debug: Try rendering the full spritesheet first to see if image loads
  // If you see the full spritesheet, the image is loading correctly
  // Comment this out once confirmed
  const showFullSpritesheet = false; // Set to true to debug
  if (showFullSpritesheet) {
    return (
      <Group>
        <Image
          image={spritesheet}
          x={destX - 100}
          y={destY - 100}
          width={SPRITE_SIZE * 6}
          height={SPRITE_SIZE * 3}
          fit="contain"
        />
      </Group>
    );
  }

  // Extract sprite from spritesheet using precise clipping
  // Use integer pixel values to avoid sub-pixel rendering artifacts
  const srcXInt = Math.floor(srcX);
  const srcYInt = Math.floor(srcY);
  const destXInt = Math.floor(destX);
  const destYInt = Math.floor(destY);
  
  // Calculate offset to position the sprite correctly
  const spritesheetOffsetX = destXInt - srcXInt;
  // Ensure precise Y offset - round to prevent sub-pixel rendering
  // This is especially important for back walk which switches between rows
  const spritesheetOffsetY = Math.round(destYInt - srcYInt);
  
  // Create tight clipping rect - use exact integer pixel boundaries
  // For back walk frames from row 1, reduce height by 2px to prevent seeing bottom row artifacts
  // This happens when switching from row 1 to row 2 - row 1 sprites show part of row 2
  const clipHeight = isBackWalkFromRow1 
    ? PLAYER_SIZE - 2  // Reduce by 2px for row 1 frames to hide row 2 artifacts
    : (direction === 'back' && animationType === 'walk')
    ? PLAYER_SIZE - 1  // Reduce by 1px for other back walk frames
    : PLAYER_SIZE;
  const clipRect = Skia.XYWHRect(
    destXInt,
    destYInt,
    PLAYER_SIZE,
    clipHeight
  );

  return (
    <Group clip={clipRect}>
      {shouldMirror ? (
        <Group
          transform={[
            { translateX: screenX },
            { scaleX: -1 },
            { translateX: -screenX }
          ]}
        >
          <Image
            image={spritesheet}
            x={spritesheetOffsetX}
            y={spritesheetOffsetY}
            width={SPRITE_SIZE * 6}
            height={SPRITE_SIZE * 3}
            fit="none"
          />
        </Group>
      ) : (
        <Image
          image={spritesheet}
          x={spritesheetOffsetX}
          y={spritesheetOffsetY}
          width={SPRITE_SIZE * 6}
          height={SPRITE_SIZE * 3}
          fit="none"
        />
      )}
    </Group>
  );
};

