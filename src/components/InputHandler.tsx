import React, { useRef, useState } from 'react';
import { View, PanResponder, Dimensions, LayoutChangeEvent } from 'react-native';
import { Vector2 } from '../types/Game';
import { clamp } from '../utils/Math';

interface InputHandlerProps {
  onInputChange: (input: Vector2) => void;
  children: React.ReactNode;
}

export const InputHandler: React.FC<InputHandlerProps> = ({
  onInputChange,
  children,
}) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        touchStartRef.current = { x: locationX, y: locationY };
        handleTouch(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        handleTouch(locationX, locationY);
      },
      onPanResponderRelease: () => {
        touchStartRef.current = null;
        onInputChange({ x: 0, y: 0 });
      },
    })
  ).current;

  const handleTouch = (x: number, y: number) => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return;
    }

    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;

    // Calculate direction from center to touch position
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Small dead zone to prevent accidental movement
    if (dist < 10) {
      onInputChange({ x: 0, y: 0 });
      return;
    }

    // Normalize direction vector (unit vector)
    const normalizedX = dx / dist;
    const normalizedY = dy / dist;

    // Scale based on distance (further = stronger input)
    const maxDist = Math.max(containerSize.width, containerSize.height) / 2;
    const scale = Math.min(dist / maxDist, 1);

    const input = {
      x: normalizedX * scale,
      y: normalizedY * scale,
    };

    // Debug output
    console.log('Touch input:', input, 'at position:', { x, y }, 'center:', { centerX, centerY });

    onInputChange(input);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      {children}
      {/* Touch overlay - positioned absolutely over the canvas */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        {...panResponder.panHandlers}
      />
    </View>
  );
};

