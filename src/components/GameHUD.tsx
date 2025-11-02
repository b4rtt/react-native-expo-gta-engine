import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameStats } from '../types/Game';

interface GameHUDProps {
  stats: GameStats;
}

export const GameHUD: React.FC<GameHUDProps> = ({ stats }) => {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.panel}>
        <Text style={styles.label}>Coins</Text>
        <Text style={styles.value}>{stats.coinsCollected}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 24,
    left: 24,
  },
  panel: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  label: {
    color: '#ffd966',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});

