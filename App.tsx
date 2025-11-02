import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GameLoop } from './src/systems/GameLoop';
import { GameRenderer } from './src/components/GameRenderer';
import { VirtualJoystick } from './src/components/VirtualJoystick';
import { GameHUD } from './src/components/GameHUD';
import { PauseMenu } from './src/components/PauseMenu';
import { GameState, Vector2, WeaponId } from './src/types/Game';

const KEYBOARD_DIRECTIONS: Record<string, Vector2> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [screenSize, setScreenSize] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });
  const gameLoopRef = useRef<GameLoop | null>(null);
  const joystickInputRef = useRef<Vector2>({ x: 0, y: 0 });
  const keyboardInputRef = useRef<Vector2>({ x: 0, y: 0 });

  useEffect(() => {
    // Lock screen orientation to landscape
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    // Handle screen size changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenSize({
        width: window.width,
        height: window.height,
      });
      if (gameLoopRef.current) {
        gameLoopRef.current.setScreenSize(window.width, window.height);
      }
    });

    // Initialize game loop
    const gameLoop = new GameLoop((state) => {
      setGameState(state);
    });
    gameLoop.setScreenSize(screenSize.width, screenSize.height);
    gameLoop.start();
    gameLoopRef.current = gameLoop;

    return () => {
      subscription.remove();
      gameLoop.stop();
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const updateCombinedInput = useCallback(() => {
    if (!gameLoopRef.current) {
      return;
    }
    const combined = {
      x: joystickInputRef.current.x + keyboardInputRef.current.x,
      y: joystickInputRef.current.y + keyboardInputRef.current.y,
    };

    const length = Math.hypot(combined.x, combined.y);
    const clamped =
      length > 1
        ? { x: combined.x / length, y: combined.y / length }
        : combined;

    gameLoopRef.current.setInput(clamped);
  }, []);

  const handleJoystickInputChange = useCallback(
    (input: Vector2) => {
      joystickInputRef.current = input;
      updateCombinedInput();
    },
    [updateCombinedInput]
  );

  const handleWeaponSelect = (weapon: WeaponId) => {
    if (gameLoopRef.current) {
      gameLoopRef.current.setSelectedWeapon(weapon);
    }
  };

  const handlePause = useCallback(() => {
    if (gameLoopRef.current) {
      gameLoopRef.current.togglePause();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const pressed = new Set<string>();

    const recomputeKeyboardInput = () => {
      let x = 0;
      let y = 0;

      pressed.forEach((code) => {
        const dir = KEYBOARD_DIRECTIONS[code];
        if (!dir) return;
        x += dir.x;
        y += dir.y;
      });

      if (x === 0 && y === 0) {
        keyboardInputRef.current = { x: 0, y: 0 };
      } else {
        const length = Math.hypot(x, y);
        keyboardInputRef.current = {
          x: x / (length || 1),
          y: y / (length || 1),
        };
      }

      updateCombinedInput();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const { code } = event;
      
      // Handle ESC key for pause
      if (code === 'Escape') {
        event.preventDefault();
        handlePause();
        return;
      }

      if (!KEYBOARD_DIRECTIONS[code]) {
        return;
      }

      event.preventDefault();
      if (!pressed.has(code)) {
        pressed.add(code);
        recomputeKeyboardInput();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const { code } = event;
      if (!pressed.has(code)) {
        return;
      }
      event.preventDefault();
      pressed.delete(code);
      recomputeKeyboardInput();
    };

    const handleBlur = () => {
      if (pressed.size === 0) {
        return;
      }
      pressed.clear();
      keyboardInputRef.current = { x: 0, y: 0 };
      updateCombinedInput();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [updateCombinedInput, handlePause]);

  if (!gameState) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <GameRenderer
        gameState={gameState}
        width={screenSize.width}
        height={screenSize.height}
      />
      <GameHUD
        stats={gameState.stats}
        weapons={gameState.weapons}
        selectedWeapon={gameState.selectedWeapon}
        onWeaponSelect={handleWeaponSelect}
      />
      <VirtualJoystick onInputChange={handleJoystickInputChange} />
      
      {/* Pause button */}
      <TouchableOpacity
        style={styles.pauseButton}
        onPress={handlePause}
        activeOpacity={0.7}
      >
        <Text style={styles.pauseButtonText}>⏸</Text>
      </TouchableOpacity>

      {/* Pause menu overlay */}
      {gameState.isPaused && (
        <PauseMenu onResume={handlePause} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  pauseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pauseButtonText: {
    fontSize: 24,
    color: '#FFD700',
  },
});
