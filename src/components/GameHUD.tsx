import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameStats } from '../types/Game';

const MAX_WANTED_STARS = 6;

const formatCash = (value: number) => `$${value.toLocaleString('en-US')}`;

interface GameHUDProps {
  stats: GameStats;
}

export const GameHUD: React.FC<GameHUDProps> = ({ stats }) => {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.wantedOverlay}>
        <View style={styles.wantedBackground}>
          <View style={styles.starRow}>
            {Array.from({ length: MAX_WANTED_STARS }).map((_, index) => {
              const active = index < stats.wantedLevel;
              return (
                <Text
                  key={index}
                  style={[styles.wantedStar, active ? styles.wantedStarActive : styles.wantedStarDisabled]}
                >
                  ★
                </Text>
              );
            })}
          </View>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.healthContainer}>
          <Text style={styles.sectionLabel}>Health</Text>
          <View style={styles.healthBarBackground}>
            <View
              style={[
                styles.healthBarFill,
                {
                  width: `${Math.max(0, Math.min(1, stats.health / stats.maxHealth)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.cashContainer}>
          <Text style={styles.sectionLabel}>Cash</Text>
          <Text style={styles.cashValue}>{formatCash(stats.cash)}</Text>
        </View>
        <View style={styles.coinContainer}>
          <Text style={styles.sectionLabel}>Coins</Text>
          <Text style={styles.coinValue}>{stats.coinsCollected}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  wantedOverlay: {
    alignItems: 'center',
    marginBottom: 12,
  },
  wantedBackground: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionLabel: {
    color: '#ffd966',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  healthContainer: {
    width: 180,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  healthBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    backgroundColor: '#ff5252',
  },
  cashContainer: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: 130,
  },
  cashValue: {
    color: '#a2ff5f',
    fontSize: 18,
    fontWeight: '700',
  },
  coinContainer: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: 110,
  },
  coinValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  wantedStar: {
    fontSize: 20,
    marginHorizontal: 3,
  },
  wantedStarActive: {
    color: '#ffd966',
  },
  wantedStarDisabled: {
    color: 'rgba(255,255,255,0.2)',
  },
});
