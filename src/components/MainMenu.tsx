import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { AVAILABLE_CITIES, CityId, getAllCities } from '../utils/CityFiles';

export type MenuScreen = 'main' | 'options' | 'credits' | 'select-city' | 'map-editor';

interface MainMenuProps {
  onStartGame: (cityId: CityId | null) => void;
  onLoadGame?: () => void;
  onShowOptions: () => void;
  onShowCredits: () => void;
  hasSave?: boolean;
  currentScreen?: MenuScreen;
  onScreenChange?: (screen: MenuScreen) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onLoadGame,
  onShowOptions,
  onShowCredits,
  hasSave = false,
  currentScreen = 'main',
  onScreenChange,
}) => {
  const [selectedCity, setSelectedCity] = useState<CityId | null>(null);
  const [allCities, setAllCities] = useState<Array<{ id: string; name: string; isCustom: boolean }>>([]);

  // Load all cities (built-in + custom) on mount and when screen changes
  const loadCities = useCallback(async () => {
    try {
      const cities = await getAllCities();
      console.log('Loaded cities:', cities);
      setAllCities(cities);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  }, []);

  useEffect(() => {
    // Always reload cities when entering select-city screen
    if (currentScreen === 'select-city') {
      console.log('Loading cities for select-city screen');
      loadCities();
    }
  }, [currentScreen, loadCities]);

  // Also reload when component mounts (if already on select-city screen)
  useEffect(() => {
    if (currentScreen === 'select-city') {
      loadCities();
    }
  }, []); // Empty deps - only on mount

  const handleScreenChange = (screen: MenuScreen) => {
    if (onScreenChange) {
      onScreenChange(screen);
    }
  };

  const handleStartGame = () => {
    onStartGame(selectedCity);
  };

  if (currentScreen === 'select-city') {
    return (
      <View style={styles.overlay}>
        <View style={styles.menu}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>SELECT CITY</Text>
              <Text style={styles.subtitle}>Choose your starting location</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadCities}
              activeOpacity={0.7}
            >
              <Text style={styles.refreshButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.cityList} contentContainerStyle={styles.cityListContent}>
            <TouchableOpacity
              style={[styles.cityButton, selectedCity === null && styles.cityButtonSelected]}
              onPress={() => setSelectedCity(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cityButtonText, selectedCity === null && styles.cityButtonTextSelected]}>
                Random City
              </Text>
            </TouchableOpacity>
            
            {allCities.length === 0 ? (
              <Text style={styles.emptyText}>Loading cities...</Text>
            ) : (
              allCities.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={[styles.cityButton, selectedCity === city.id && styles.cityButtonSelected]}
                  onPress={() => setSelectedCity(city.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cityButtonText, selectedCity === city.id && styles.cityButtonTextSelected]}>
                    {city.name} {city.isCustom && '★'}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <View style={styles.cityActions}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { marginRight: 12 }]}
              onPress={() => handleScreenChange('main')}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>BACK</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { marginLeft: 12 }]}
              onPress={handleStartGame}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>START</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.menu}>
        <Text style={styles.title}>GTA ENGINE</Text>
        <Text style={styles.subtitle}>Prototype</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={() => handleScreenChange('select-city')}
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

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => handleScreenChange('map-editor')}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>MAP EDITOR</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 20,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
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
  cityList: {
    maxHeight: 400,
    width: '100%',
    marginVertical: 20,
  },
  cityListContent: {
    alignItems: 'stretch',
  },
  cityButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 4,
    alignItems: 'center',
  },
  cityButtonSelected: {
    backgroundColor: '#3a3a2a',
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  cityButtonText: {
    color: '#aaa',
    fontSize: 18,
    fontWeight: '600',
  },
  cityButtonTextSelected: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  cityActions: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  secondaryButton: {
    backgroundColor: '#2a2a2a',
    flex: 1,
  },
});

