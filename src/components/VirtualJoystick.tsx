import React, { useRef, useState, useEffect } from 'react';
import { View, PanResponder, StyleSheet, Dimensions } from 'react-native';
import { Vector2 } from '../types/Game';

interface VirtualJoystickProps {
  onInputChange: (input: Vector2) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onInputChange,
}) => {
  const [screenSize, setScreenSize] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });
  
  // Joystick position - bottom right corner
  const joystickSize = 110;
  const joystickRadius = joystickSize / 2;
  const stickRadius = 22;
  const maxDistance = joystickRadius - stickRadius - 5; // Max distance stick can move
  
  const centerX = screenSize.width - joystickRadius - 30; // 30px from right edge
  const centerY = screenSize.height - joystickRadius - 30; // 30px from bottom edge
  
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const stickVisualRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const DEADZONE = 0.12;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenSize({
        width: window.width,
        height: window.height,
      });
    });

    return () => {
      subscription?.remove();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const updateStickVisual = (nextPosition: { x: number; y: number }) => {
    stickVisualRef.current = nextPosition;
    if (rafRef.current !== null) {
      return;
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setStickPosition(stickVisualRef.current);
    });
  };

  const resetStick = () => {
    updateStickVisual({ x: 0, y: 0 });
    onInputChange({ x: 0, y: 0 });
    touchStartRef.current = null;
    setIsActive(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        // locationX/locationY are relative to the View
        const touchX = centerX - joystickRadius + locationX;
        const touchY = centerY - joystickRadius + locationY;
        
        // Check if touch started within joystick area
        const dx = touchX - centerX;
        const dy = touchY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= joystickRadius + 20) { // 20px tolerance
          touchStartRef.current = { x: touchX, y: touchY };
          setIsActive(true);
          handleTouch(touchX, touchY);
        }
      },
      onPanResponderMove: (evt) => {
        if (touchStartRef.current) {
          const { locationX, locationY } = evt.nativeEvent;
          const touchX = centerX - joystickRadius + locationX;
          const touchY = centerY - joystickRadius + locationY;
          handleTouch(touchX, touchY);
        }
      },
      onPanResponderRelease: () => {
        resetStick();
      },
      onPanResponderTerminate: () => {
        // Also handle when touch is cancelled
        resetStick();
      },
    })
  ).current;

  const handleTouch = (touchX: number, touchY: number) => {
    // Calculate relative position from joystick center
    const dx = touchX - centerX;
    const dy = touchY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp to max distance
    let clampedDistance = Math.min(distance, maxDistance);
    
    // Normalize direction
    let normalizedX = 0;
    let normalizedY = 0;
    
    if (distance > 0) {
      normalizedX = dx / distance;
      normalizedY = dy / distance;
    }

    // Calculate stick position
    const stickX = normalizedX * clampedDistance;
    const stickY = normalizedY * clampedDistance;

    updateStickVisual({ x: stickX, y: stickY });

    // Calculate input (scale by distance for analog feel)
    const inputScale = clampedDistance / maxDistance;
    if (inputScale < DEADZONE) {
      onInputChange({ x: 0, y: 0 });
      return;
    }

    const adjustedScale = (inputScale - DEADZONE) / (1 - DEADZONE);
    const input = {
      x: normalizedX * adjustedScale,
      y: normalizedY * adjustedScale,
    };

    onInputChange(input);
  };

  return (
    <View
      style={[
        styles.joystickContainer,
        {
          left: centerX - joystickRadius,
          top: centerY - joystickRadius,
          width: joystickSize,
          height: joystickSize,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Outer circle (background) */}
      <View
        style={[
          styles.joystickBackground,
              {
                width: joystickSize,
                height: joystickSize,
                borderRadius: joystickRadius,
                backgroundColor: isActive ? 'rgba(162,255,95,0.18)' : 'rgba(12, 17, 25, 0.45)',
                borderColor: isActive ? 'rgba(162,255,95,0.55)' : 'rgba(255, 255, 255, 0.25)',
              },
            ]}
      />
      
      {/* Inner stick */}
      <View
        style={[
          styles.joystickStick,
          {
            width: stickRadius * 2,
            height: stickRadius * 2,
            borderRadius: stickRadius,
            transform: [
              { translateX: stickPosition.x },
              { translateY: stickPosition.y },
            ],
            backgroundColor: isActive ? 'rgba(162,255,95,0.9)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isActive ? 'rgba(162,255,95,1)' : 'rgba(255, 255, 255, 1)',
          },
        ]}
      />
      <View
        style={[
          styles.centerDot,
          {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: isActive ? 'rgba(162,255,95,0.8)' : 'rgba(255,255,255,0.6)',
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  joystickContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000, // Android
  },
  joystickBackground: {
    borderWidth: 2,
    position: 'absolute',
  },
  joystickStick: {
    borderWidth: 2,
  },
  centerDot: {
    position: 'absolute',
  },
});
