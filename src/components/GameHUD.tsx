import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GameStats, WeaponId, TimeOfDay } from '../types/Game';
import { formatTime } from '../utils/TimeOfDay';

const MAX_WANTED_STARS = 6;

const formatCash = (value: number) => `$${value.toLocaleString('en-US')}`;

const WEAPON_ICONS: Record<WeaponId, string> = {
  fist: '👊',
  pistol: '🔫',
  knife: '🔪',
  bat: '🪓',
};

interface GameHUDProps {
  stats: GameStats;
  weapons: WeaponId[];
  selectedWeapon: WeaponId;
  onWeaponSelect: (weapon: WeaponId) => void;
  isInVehicle?: boolean;
  vehicleSpeed?: number;
  vehicleMaxSpeed?: number;
  onExitVehicle?: () => void;
  timeOfDay?: TimeOfDay;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  weapons,
  selectedWeapon,
  onWeaponSelect,
  isInVehicle = false,
  vehicleSpeed = 0,
  vehicleMaxSpeed = 280,
  onExitVehicle,
  timeOfDay,
}) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Exit vehicle button */}
      {isInVehicle && onExitVehicle && (
        <TouchableOpacity
          style={styles.exitVehicleButton}
          onPress={onExitVehicle}
          activeOpacity={0.7}
        >
          <Text style={styles.exitVehicleText}>🚪 Vystoupit</Text>
        </TouchableOpacity>
      )}
      {/* Time display */}
      {timeOfDay && (
        <View style={styles.timeContainer} pointerEvents="none">
          <Text style={styles.timeText}>{formatTime(timeOfDay)}</Text>
          <Text style={styles.timeOfDayText}>{timeOfDay.timeOfDay.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.topRightContainer} pointerEvents="none">
        <View style={styles.healthContainer}>
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
          <Text style={styles.healthLabel}>HP {stats.health}</Text>
        </View>
        <View style={styles.moneyStack}>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>CASH</Text>
            <Text style={styles.valueNumber}>{formatCash(stats.cash)}</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>COINS</Text>
            <Text style={styles.valueNumber}>{stats.coinsCollected}</Text>
          </View>
        </View>
      </View>
      <View style={styles.wantedRow} pointerEvents="none">
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
      {isInVehicle ? (
        <View style={styles.speedometerWidget}>
          <View style={styles.speedometerDisplay}>
            <Text style={styles.speedometerLabel}>SPEED</Text>
            <Text style={styles.speedometerValue}>
              {Math.round(vehicleSpeed)}
            </Text>
            <View style={styles.speedometerBar}>
              <View
                style={[
                  styles.speedometerBarFill,
                  {
                    width: `${Math.min(100, (vehicleSpeed / vehicleMaxSpeed) * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.weaponWidget}>
          <TouchableOpacity
            style={styles.weaponDisplay}
            onPress={() => {
              const currentIndex = weapons.findIndex((w) => w === selectedWeapon);
              const nextWeapon = weapons[(currentIndex + 1) % weapons.length];
              onWeaponSelect(nextWeapon);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.weaponIconFrame}>
              <Text style={styles.weaponEmoji}>{WEAPON_ICONS[selectedWeapon]}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topRightContainer: {
    position: 'absolute',
    top: 72,
    right: 16,
    alignItems: 'flex-end',
    gap: 10,
  },
  healthContainer: {
    width: 156,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  healthBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    backgroundColor: '#ff5252',
  },
  healthLabel: {
    marginTop: 4,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  moneyStack: {
    width: 156,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLabel: {
    color: '#ffd966',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  valueNumber: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  wantedRow: {
    position: 'absolute',
    top: 20,
    right: 16,
    flexDirection: 'row',
  },
  wantedStar: {
    fontSize: 20,
    marginLeft: 3,
  },
  wantedStarActive: {
    color: '#ffd966',
  },
  wantedStarDisabled: {
    color: 'rgba(255,255,255,0.25)',
  },
  weaponWidget: {
    position: 'absolute',
    left: 20,
    bottom: 32,
  },
  weaponDisplay: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  weaponIconFrame: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weaponEmoji: {
    fontSize: 34,
  },
  speedometerWidget: {
    position: 'absolute',
    left: 20,
    bottom: 32,
  },
  speedometerDisplay: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    minWidth: 100,
    alignItems: 'center',
  },
  speedometerLabel: {
    color: '#ffd966',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  speedometerValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  speedometerBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  speedometerBarFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 3,
  },
  exitVehicleButton: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(200, 50, 50, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  exitVehicleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timeContainer: {
    position: 'absolute',
    top: 20,
    left: 80, // Position to the right of pause button (50px width + 30px gap)
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  timeText: {
    color: '#ffd966',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  timeOfDayText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 1,
    opacity: 0.8,
  },
});
