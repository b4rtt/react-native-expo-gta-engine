import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

export type MenuScreen = 'main' | 'options' | 'credits';

interface MainMenuProps {
  onStartGame: () => void;
  onLoadGame?: () => void;
  onShowOptions: () => void;
  onShowCredits: () => void;
  hasSave?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onLoadGame,
  onShowOptions,
  onShowCredits,
  hasSave = false,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.menu}>
        <Text style={styles.title}>GTA ENGINE</Text>
        <Text style={styles.subtitle}>Prototype</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={onStartGame}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>START GAME</Text>
        </TouchableOpacity>

        {hasSave && onLoadGame && (
          <TouchableOpacity 
            style={styles.button} 
            onPress={onLoadGame}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>LOAD GAME</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.button} 
          onPress={onShowOptions}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>OPTIONS</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={onShowCredits}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>CREDITS</Text>
        </TouchableOpacity>

        {Platform.OS === 'web' && (
          <Text style={styles.hint}>Use arrow keys or WASD to move</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  menu: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFD700',
    padding: 40,
    minWidth: 320,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 40,
    letterSpacing: 2,
  },
  button: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginVertical: 8,
    minWidth: 220,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3a3a2a',
    borderWidth: 3,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  hint: {
    color: '#666',
    fontSize: 12,
    marginTop: 32,
    fontStyle: 'italic',
  },
});

