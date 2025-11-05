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
import { MapEditor } from './src/components/MapEditor';
import { DebugOverlay } from './src/components/DebugOverlay';
import { GameState, Vector2, VehicleInput, WeaponId } from './src/types/Game';
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
  const currentInputRef = useRef<Vector2>({ x: 0, y: 0 });

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

  const startGame = useCallback(async (cityId: CityId | null = null) => {
    // Load city data if cityId is provided
    const cityData = cityId ? await loadCityById(cityId) : null;
    
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

  // Unified input update - converts current input to player or vehicle input
  const updateInput = useCallback((input: Vector2) => {
    if (!gameLoopRef.current) {
      return;
    }
    
    currentInputRef.current = input;
    
    // Get current game state directly from game loop to avoid dependency
    const currentGameState = gameLoopRef.current.getState();
    const isInVehicle = !!currentGameState?.player.inVehicle;
    
    if (isInVehicle) {
      // Convert to vehicle input: forward/backward and steering
      const inputLength = Math.hypot(input.x, input.y);
      
      if (inputLength < 0.05) {
        // No input
        gameLoopRef.current.setVehicleInput({ acceleration: 0, steering: 0 });
        gameLoopRef.current.setInput({ x: 0, y: 0 });
      } else {
        // Y axis = acceleration (negative Y = forward in screen space)
        const acceleration = Math.max(-1, Math.min(1, -input.y));
        // X axis = steering
        const steering = Math.max(-1, Math.min(1, input.x));
        
        gameLoopRef.current.setVehicleInput({ acceleration, steering });
        gameLoopRef.current.setInput({ x: 0, y: 0 });
      }
    } else {
      // Player movement - direct input
      const inputLength = Math.hypot(input.x, input.y);
      
      if (inputLength < 0.05) {
        gameLoopRef.current.setInput({ x: 0, y: 0 });
        gameLoopRef.current.setVehicleInput({ acceleration: 0, steering: 0 });
      } else {
        // Normalize if needed
        const normalizedInput = inputLength > 1 
          ? { x: input.x / inputLength, y: input.y / inputLength }
          : input;
        
        gameLoopRef.current.setInput(normalizedInput);
        gameLoopRef.current.setVehicleInput({ acceleration: 0, steering: 0 });
      }
    }
  }, []);

  const handleJoystickInputChange = useCallback(
    (input: Vector2) => {
      updateInput(input);
    },
    [updateInput]
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

    const computeKeyboardInput = () => {
      if (!gameLoopRef.current) {
        return;
      }
      
      const currentGameState = gameLoopRef.current.getState();
      const isInVehicle = !!currentGameState?.player.inVehicle;
      
      if (isInVehicle) {
        // Vehicle controls
        let y = 0; // acceleration
        let x = 0; // steering
        
        // Forward acceleration (ArrowUp or W)
        if (pressed.has('ArrowUp') || pressed.has('KeyW')) {
          y = -1; // Negative Y = forward
        }
        
        // Brake/reverse (ArrowDown, S, or Space)
        if (pressed.has('ArrowDown') || pressed.has('KeyS') || pressed.has('Space')) {
          y = 1; // Positive Y = backward
        }
        
        // Steer left (ArrowLeft or A)
        if (pressed.has('ArrowLeft') || pressed.has('KeyA')) {
          x = -1;
        }
        
        // Steer right (ArrowRight or D)
        if (pressed.has('ArrowRight') || pressed.has('KeyD')) {
          x = 1;
        }
        
        updateInput({ x, y });
      } else {
        // Player movement - use WASD or arrows
        let x = 0;
        let y = 0;

        if (pressed.has('ArrowUp') || pressed.has('KeyW')) y -= 1;
        if (pressed.has('ArrowDown') || pressed.has('KeyS')) y += 1;
        if (pressed.has('ArrowLeft') || pressed.has('KeyA')) x -= 1;
        if (pressed.has('ArrowRight') || pressed.has('KeyD')) x += 1;

        updateInput({ x, y });
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const { code } = event;
      
      // Handle ESC key for pause
      if (code === 'Escape') {
        event.preventDefault();
        handlePause();
        return;
      }

      // Handle F3 or Backquote for debug overlay
      if (code === 'F3' || code === 'Backquote') {
        event.preventDefault();
        setShowDebugOverlay((prev) => !prev);
        return;
      }
      
      // Get current game state for context
      const currentGameState = gameLoopRef.current?.getState();
      const isInVehicle = currentGameState?.player.inVehicle;
      
      // Handle weapon selection (only when not in vehicle)
      if (!isInVehicle) {
        // Direct weapon selection with number keys
        if (code === 'Digit1') {
          event.preventDefault();
          handleWeaponSelect('fist');
          return;
        }
        if (code === 'Digit2') {
          event.preventDefault();
          handleWeaponSelect('pistol');
          return;
        }
        if (code === 'Digit3') {
          event.preventDefault();
          handleWeaponSelect('knife');
          return;
        }
        if (code === 'Digit4') {
          event.preventDefault();
          handleWeaponSelect('bat');
          return;
        }
        
        // Cycle weapons with Q/E
        if (code === 'KeyQ' || code === 'KeyE') {
          event.preventDefault();
          const weapons = currentGameState?.weapons || [];
          const currentWeapon = currentGameState?.selectedWeapon || 'fist';
          const currentIndex = weapons.findIndex((w) => w === currentWeapon);
          
          if (code === 'KeyQ') {
            // Previous weapon
            const prevWeapon = weapons[(currentIndex - 1 + weapons.length) % weapons.length];
            handleWeaponSelect(prevWeapon);
          } else {
            // Next weapon
            const nextWeapon = weapons[(currentIndex + 1) % weapons.length];
            handleWeaponSelect(nextWeapon);
          }
          return;
        }
      }

      // Handle movement keys
      const isMovementKey = code === 'ArrowUp' || code === 'ArrowDown' || 
                           code === 'ArrowLeft' || code === 'ArrowRight' ||
                           code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD';
      
      // Handle spacebar for vehicle brake or shooting
      if (code === 'Space') {
        event.preventDefault();
        if (isInVehicle) {
          // Use spacebar for brake when in vehicle
          if (!pressed.has(code)) {
            pressed.add(code);
            computeKeyboardInput();
          }
        } else {
          // Use spacebar for shooting when on foot
          gameLoopRef.current?.setShoot(true);
        }
        return;
      }
      
      if (isMovementKey) {
        event.preventDefault();
        if (!pressed.has(code)) {
          pressed.add(code);
          computeKeyboardInput();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const { code } = event;
      
      // Handle spacebar release for shooting
      if (code === 'Space') {
        event.preventDefault();
        gameLoopRef.current?.setShoot(false);
        // Also remove from pressed set if it was there for vehicle brake
        if (pressed.has(code)) {
          pressed.delete(code);
          computeKeyboardInput();
        }
        return;
      }
      
      if (pressed.has(code)) {
        event.preventDefault();
        pressed.delete(code);
        computeKeyboardInput();
      }
    };

    const handleBlur = () => {
      if (pressed.size === 0) {
        return;
      }
      pressed.clear();
      updateInput({ x: 0, y: 0 });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [updateInput, handlePause, currentScreen]);

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

  if (currentScreen === 'map-editor') {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <MapEditor 
          onClose={() => setCurrentScreen('main')}
          onCitySaved={() => {
            // Force refresh of city list when returning to menu
            console.log('City saved, will refresh list when returning to menu');
          }}
        />
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
        weaponInventory={gameState.player.weaponInventory}
        onWeaponSelect={handleWeaponSelect}
        isInVehicle={!!gameState.player.inVehicle}
        vehicleSpeed={
          gameState.player.inVehicle
            ? gameState.vehicles.find((v) => v.id === gameState.player.inVehicle)?.speed || 0
            : 0
        }
        vehicleMaxSpeed={
          gameState.player.inVehicle
            ? gameState.vehicles.find((v) => v.id === gameState.player.inVehicle)?.maxSpeed || 280
            : 280
        }
        onExitVehicle={() => {
          if (gameLoopRef.current) {
            gameLoopRef.current.exitVehicle();
          }
        }}
        timeOfDay={gameState.timeOfDay}
        gameState={gameState}
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
