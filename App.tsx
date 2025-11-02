import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GameLoop } from './src/systems/GameLoop';
import { GameRenderer } from './src/components/GameRenderer';
import { VirtualJoystick } from './src/components/VirtualJoystick';
import { GameHUD } from './src/components/GameHUD';
import { GameState, Vector2, WeaponId } from './src/types/Game';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [screenSize, setScreenSize] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });
  const gameLoopRef = useRef<GameLoop | null>(null);

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

  const handleInputChange = (input: Vector2) => {
    if (gameLoopRef.current) {
      gameLoopRef.current.setInput(input);
    }
  };

  const handleWeaponSelect = (weapon: WeaponId) => {
    if (gameLoopRef.current) {
      gameLoopRef.current.setSelectedWeapon(weapon);
    }
  };

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
      <VirtualJoystick onInputChange={handleInputChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
});
