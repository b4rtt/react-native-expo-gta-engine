import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CreditsScreenProps {
  onBack: () => void;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ onBack }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.menu}>
        <Text style={styles.title}>CREDITS</Text>
        
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GTA Engine</Text>
            <Text style={styles.creditText}>A GTA 2-inspired prototype</Text>
            <Text style={styles.creditText}>Built with React Native & Expo</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technologies</Text>
            <Text style={styles.creditText}>• React Native</Text>
            <Text style={styles.creditText}>• Expo</Text>
            <Text style={styles.creditText}>• React Native Skia</Text>
            <Text style={styles.creditText}>• TypeScript</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <Text style={styles.creditText}>• Isometric city rendering</Text>
            <Text style={styles.creditText}>• Procedural map generation</Text>
            <Text style={styles.creditText}>• NPC AI & pathfinding</Text>
            <Text style={styles.creditText}>• Collectible system</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.footerText}>Inspired by Grand Theft Auto 2</Text>
            <Text style={styles.footerText}>© 2024</Text>
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
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  creditText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 6,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
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

