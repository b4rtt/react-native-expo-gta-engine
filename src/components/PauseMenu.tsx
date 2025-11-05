import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface PauseMenuProps {
  onResume: () => void;
  onSettings?: () => void;
  onExit?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ 
  onResume, 
  onSettings, 
  onExit,
  onSave,
  onLoad,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.menu}>
        <Text style={styles.title}>PAUSED</Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={onResume}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>RESUME</Text>
        </TouchableOpacity>

        {onSave && (
          <TouchableOpacity 
            style={styles.button} 
            onPress={onSave}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>SAVE GAME</Text>
          </TouchableOpacity>
        )}

        {onLoad && (
          <TouchableOpacity 
            style={styles.button} 
            onPress={onLoad}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>LOAD GAME</Text>
          </TouchableOpacity>
        )}

        {onSettings && (
          <TouchableOpacity 
            style={styles.button} 
            onPress={onSettings}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>SETTINGS</Text>
          </TouchableOpacity>
        )}

        {onExit && (
          <TouchableOpacity 
            style={[styles.button, styles.exitButton]} 
            onPress={onExit}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>EXIT</Text>
          </TouchableOpacity>
        )}

        {Platform.OS === 'web' && (
          <Text style={styles.hint}>Press ESC to resume</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  menu: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFD700',
    padding: 32,
    minWidth: 300,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 32,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginVertical: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  exitButton: {
    borderColor: '#ff4444',
  },
  buttonText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  hint: {
    color: '#888',
    fontSize: 14,
    marginTop: 24,
    fontStyle: 'italic',
  },
});

