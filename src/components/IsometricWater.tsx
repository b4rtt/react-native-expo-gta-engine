import React, { useEffect, useState } from 'react';
import { Group, Rect } from '@shopify/react-native-skia';
import { Tile } from '../types/Game';
import { TILE_SIZE } from '../utils/Isometric';

interface IsometricWaterProps {
  tile: Tile;
  screenX: number;
  screenY: number;
}

const WATER_COLORS = ['#2a5a7a', '#2d5d7d', '#28587a', '#2c5b7c'];
const WATER_HIGHLIGHT = '#3a7a9a';
const WATER_DARK = '#1a4a6a';

export const IsometricWater: React.FC<IsometricWaterProps> = ({
  tile,
  screenX,
  screenY,
}) => {
  const seed = tile.x * 73 + tile.y * 37;
  const colorVariant = seed % WATER_COLORS.length;
  const baseColor = WATER_COLORS[colorVariant];
  
  const [time, setTime] = useState(0);
  
  useEffect(() => {
    let animationFrame: number;
    const startTime = performance.now();
    
    const animate = () => {
      const currentTime = performance.now();
      setTime((currentTime - startTime) / 1000); // Time in seconds
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);
  
  // Animated wave positions based on time
  const waveSpeed1 = 0.5 + (seed % 10) / 20; // Varying speeds per tile
  const waveSpeed2 = 0.8 + (seed % 7) / 15;
  const waveSpeed3 = 0.3 + (seed % 13) / 25;
  
  const wave1Y = screenY + TILE_SIZE * 0.2 + Math.sin(time * waveSpeed1 + seed * 0.1) * 3;
  const wave2Y = screenY + TILE_SIZE * 0.5 + Math.sin(time * waveSpeed2 + seed * 0.15 + Math.PI / 3) * 2.5;
  const wave3Y = screenY + TILE_SIZE * 0.7 + Math.sin(time * waveSpeed3 + seed * 0.2 + Math.PI / 2) * 2;
  
  // Horizontal wave movement
  const wave1X = screenX + Math.sin(time * 0.4 + seed * 0.05) * 2;
  const wave2X = screenX + Math.sin(time * 0.6 + seed * 0.08 + Math.PI / 4) * 1.5;
  
  // Animated opacity for shimmer effect
  const shimmerOpacity = 0.3 + Math.sin(time * 2 + seed * 0.1) * 0.15;
  const highlightOpacity = 0.4 + Math.sin(time * 1.5 + seed * 0.12) * 0.2;

  return (
    <Group>
      {/* Base water color with slight variation */}
      <Rect
        x={screenX}
        y={screenY}
        width={TILE_SIZE}
        height={TILE_SIZE}
        color={baseColor}
      />
      
      {/* Darker water layer for depth */}
      <Rect
        x={screenX}
        y={screenY + TILE_SIZE * 0.6}
        width={TILE_SIZE}
        height={TILE_SIZE * 0.4}
        color={WATER_DARK}
        opacity={0.3}
      />
      
      {/* Animated wave 1 - top wave */}
      <Rect
        x={wave1X}
        y={wave1Y}
        width={TILE_SIZE}
        height={TILE_SIZE * 0.25}
        color={WATER_HIGHLIGHT}
        opacity={highlightOpacity}
      />
      
      {/* Animated wave 2 - middle wave */}
      <Rect
        x={wave2X}
        y={wave2Y}
        width={TILE_SIZE * 0.8}
        height={TILE_SIZE * 0.2}
        color={WATER_HIGHLIGHT}
        opacity={shimmerOpacity}
      />
      
      {/* Animated wave 3 - bottom wave */}
      <Rect
        x={screenX + TILE_SIZE * 0.1}
        y={wave3Y}
        width={TILE_SIZE * 0.7}
        height={TILE_SIZE * 0.15}
        color={WATER_HIGHLIGHT}
        opacity={0.25 + Math.sin(time * 1.2 + seed * 0.1) * 0.1}
      />
      
      {/* Shimmer/reflection effect */}
      <Rect
        x={screenX + TILE_SIZE * 0.3}
        y={screenY + TILE_SIZE * 0.15 + Math.sin(time * 1.8 + seed * 0.2) * 2}
        width={TILE_SIZE * 0.4}
        height={TILE_SIZE * 0.3}
        color="#4a9aba"
        opacity={0.2 + Math.sin(time * 2.5 + seed * 0.15) * 0.15}
      />
    </Group>
  );
};

