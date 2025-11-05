import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GameLoop } from './src/systems/GameLoop';
import { Alert } from 'react-native';
import { GameRenderer } from './src/components/GameRenderer';
import { VirtualJoystick } from './src/components/VirtualJoystick';
import { GameHUD } from './src/components/GameHUD';
import { PauseMenu } from './src/components/PauseMenu';
import { MainMenu, MenuScreen } from './src/components/MainMenu';
import { OptionsScreen } from './src/components/OptionsScreen';
import { CreditsScreen } from './src/components/CreditsScreen';
import { DebugOverlay } from './src/components/DebugOverlay';
import { GameState, Vector2, WeaponId } from './src/types/Game';
import { loadCityById, CityId } from './src/utils/CityFiles';

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
  const [currentScreen, setCurrentScreen] = useState<MenuScreen | 'game'>('main');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const [hasSave, setHasSave] = useState(false);
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

    // Check if save exists
    GameLoop.hasSave().then(setHasSave);

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

    return () => {
      subscription.remove();
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const startGame = useCallback((cityId: CityId | null = null) => {
    // Load city data if cityId is provided
    const cityData = cityId ? loadCityById(cityId) : null;
    
    // Initialize game loop only when starting the game
    if (!gameLoopRef.current) {
      const gameLoop = new GameLoop((state) => {
        setGameState(state);
      }, cityData);
      gameLoop.setScreenSize(screenSize.width, screenSize.height);
      gameLoop.start();
      gameLoopRef.current = gameLoop;
    } else {
      // If game loop already exists, we need to create a new one with the selected city
      // Stop the old one first
      gameLoopRef.current.stop();
      const gameLoop = new GameLoop((state) => {
        setGameState(state);
      }, cityData);
      gameLoop.setScreenSize(screenSize.width, screenSize.height);
      gameLoop.start();
      gameLoopRef.current = gameLoop;
    }
    setCurrentScreen('game');
  }, [screenSize.width, screenSize.height]);

  const exitToMainMenu = useCallback(() => {
    if (gameLoopRef.current) {
      gameLoopRef.current.pause();
    }
    // Refresh save status when returning to menu
    GameLoop.hasSave().then(setHasSave);
    setCurrentScreen('main');
  }, []);

  const handleSave = useCallback(async () => {
    if (!gameLoopRef.current) {
      return;
    }
    const success = await gameLoopRef.current.save();
    if (success) {
      setHasSave(true);
      Alert.alert('Game Saved', 'Your progress has been saved successfully.');
    } else {
      Alert.alert('Save Failed', 'Failed to save game. Please try again.');
    }
  }, []);

  const handleLoad = useCallback(async () => {
    if (!gameLoopRef.current) {
      // Need to create game loop first
      const gameLoop = new GameLoop((state) => {
        setGameState(state);
      });
      gameLoop.setScreenSize(screenSize.width, screenSize.height);
      const success = await gameLoop.load();
      if (success) {
        gameLoop.start();
        gameLoopRef.current = gameLoop;
        setCurrentScreen('game');
      } else {
        Alert.alert('Load Failed', 'No save file found or failed to load game.');
      }
      return;
    }

    const success = await gameLoopRef.current.load();
    if (success) {
      Alert.alert('Game Loaded', 'Your progress has been loaded successfully.');
    } else {
      Alert.alert('Load Failed', 'Failed to load game. Save file may be corrupted.');
    }
  }, [screenSize.width, screenSize.height]);

  const loadGameFromMenu = useCallback(async () => {
    // Initialize game loop if needed
    if (!gameLoopRef.current) {
      const gameLoop = new GameLoop((state) => {
        setGameState(state);
      });
      gameLoop.setScreenSize(screenSize.width, screenSize.height);
      const success = await gameLoop.load();
      if (success) {
        gameLoop.start();
        gameLoopRef.current = gameLoop;
        setCurrentScreen('game');
      } else {
        Alert.alert('Load Failed', 'No save file found or failed to load game.');
      }
    } else {
      // Game loop exists, just load
      await handleLoad();
      setCurrentScreen('game');
    }
  }, [screenSize.width, screenSize.height, handleLoad]);

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
    if (Platform.OS !== 'web' || currentScreen !== 'game') {
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
      
      // Handle ESC key for pause (only in game)
      if (code === 'Escape') {
        event.preventDefault();
        handlePause();
        return;
      }

      // Handle F3 or Backquote (`) for debug overlay toggle
      if (code === 'F3' || code === 'Backquote') {
        event.preventDefault();
        setShowDebugOverlay((prev) => !prev);
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
  }, [updateCombinedInput, handlePause, currentScreen]);

  // Render menu screens
  if (currentScreen === 'main' || currentScreen === 'select-city') {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <MainMenu
          onStartGame={startGame}
          onLoadGame={loadGameFromMenu}
          onShowOptions={() => setCurrentScreen('options')}
          onShowCredits={() => setCurrentScreen('credits')}
          hasSave={hasSave}
          currentScreen={currentScreen}
          onScreenChange={setCurrentScreen}
        />
      </View>
    );
  }

  if (currentScreen === 'options') {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <OptionsScreen onBack={() => setCurrentScreen('main')} />
      </View>
    );
  }

  if (currentScreen === 'credits') {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <CreditsScreen onBack={() => setCurrentScreen('main')} />
      </View>
    );
  }

  // Render game (currentScreen === 'game')
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
        isInVehicle={!!gameState.player.inVehicle}
        onExitVehicle={() => {
          if (gameLoopRef.current) {
            gameLoopRef.current.exitVehicle();
          }
        }}
        timeOfDay={gameState.timeOfDay}
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
        <PauseMenu 
          onResume={handlePause}
          onExit={exitToMainMenu}
          onSave={handleSave}
          onLoad={handleLoad}
        />
      )}

      {/* Debug overlay */}
      {showDebugOverlay && (
        <DebugOverlay
          gameState={gameState}
          width={screenSize.width}
          height={screenSize.height}
          showCollisionBoxes={showDebugOverlay}
        />
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
    left: 20,
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
