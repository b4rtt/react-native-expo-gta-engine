import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface OptionsScreenProps {
  onBack: () => void;
}

export const OptionsScreen: React.FC<OptionsScreenProps> = ({ onBack }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.menu}>
        <Text style={styles.title}>OPTIONS</Text>
        
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Controls</Text>
            <Text style={styles.optionText}>• Virtual Joystick (Mobile)</Text>
            <Text style={styles.optionText}>• Arrow Keys / WASD (Web)</Text>
            <Text style={styles.optionText}>• ESC to pause</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gameplay</Text>
            <Text style={styles.optionText}>• Collect coins to earn cash</Text>
            <Text style={styles.optionText}>• Avoid collisions with buildings</Text>
            <Text style={styles.optionText}>• NPCs wander the city</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Graphics</Text>
            <Text style={styles.optionText}>• Isometric view</Text>
            <Text style={styles.optionText}>• Dynamic city generation</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>BACK</Text>
        </TouchableOpacity>
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
    padding: 32,
    minWidth: 400,
    maxWidth: 500,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 24,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 4,
  },
  content: {
    width: '100%',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  optionText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
    paddingLeft: 8,
  },
  button: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});

