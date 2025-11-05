import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
import { AVAILABLE_CITIES, CityId, loadCityById } from '../utils/CityFiles';
import { loadCityFromJSON } from '../utils/CityLoader';

type TileCode = 'g' | 'p' | 'r' | 'b' | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8' | 'b9' | 'w' | 'x';

interface MapEditorProps {
  onClose?: () => void;
}

const TILE_TYPES: { code: TileCode; name: string; color: string }[] = [
  { code: 'g', name: 'Grass', color: '#4a7c4a' },
  { code: 'p', name: 'Pavement', color: '#888888' },
  { code: 'r', name: 'Road', color: '#333333' },
  { code: 'b', name: 'Building (1)', color: '#8b4513' },
  { code: 'b1', name: 'Building (1)', color: '#8b4513' },
  { code: 'b2', name: 'Building (2)', color: '#654321' },
  { code: 'b3', name: 'Building (3)', color: '#5c3d1f' },
  { code: 'b4', name: 'Building (4)', color: '#4a2c1a' },
  { code: 'b5', name: 'Building (5)', color: '#3a1f14' },
  { code: 'b6', name: 'Building (6)', color: '#2a150f' },
  { code: 'b7', name: 'Building (7)', color: '#1a0c0a' },
  { code: 'b8', name: 'Building (8)', color: '#100705' },
  { code: 'b9', name: 'Building (9)', color: '#080403' },
  { code: 'w', name: 'Water', color: '#1e90ff' },
  { code: 'x', name: 'Bridge', color: '#444444' },
];

export const MapEditor: React.FC<MapEditorProps> = ({ onClose }) => {
  const [width, setWidth] = useState(25);
  const [height, setHeight] = useState(25);
  const [selectedTile, setSelectedTile] = useState<TileCode>('g');
  const [layout, setLayout] = useState<string[][]>(() => {
    // Initialize with grass
    const initial: string[][] = [];
    for (let y = 0; y < 25; y++) {
      initial[y] = [];
      for (let x = 0; x < 25; x++) {
        initial[y][x] = 'g';
      }
    }
    return initial;
  });
  const [cityName, setCityName] = useState('new-city');

  const handleTileClick = useCallback((x: number, y: number) => {
    setLayout(prev => {
      const newLayout = prev.map(row => [...row]);
      if (!newLayout[y]) {
        newLayout[y] = [];
      }
      newLayout[y][x] = selectedTile;
      return newLayout;
    });
  }, [selectedTile]);

  const handleResize = useCallback((newWidth: number, newHeight: number) => {
    setLayout(prev => {
      const newLayout: string[][] = [];
      for (let y = 0; y < newHeight; y++) {
        newLayout[y] = [];
        for (let x = 0; x < newWidth; x++) {
          newLayout[y][x] = prev[y]?.[x] || 'g';
        }
      }
      return newLayout;
    });
    setWidth(newWidth);
    setHeight(newHeight);
  }, []);

  const handleLoadCity = useCallback((cityId: CityId) => {
    const cityData = loadCityById(cityId);
    if (cityData) {
      const result = loadCityFromJSON(cityData);
      if (result) {
        setWidth(result.width);
        setHeight(result.height);
        // Convert tiles back to layout format
        const newLayout: string[][] = [];
        for (let y = 0; y < result.height; y++) {
          newLayout[y] = [];
          for (let x = 0; x < result.width; x++) {
            const tile = result.tiles.find(t => t.x === x && t.y === y);
            if (tile) {
              if (tile.type === 'building') {
                newLayout[y][x] = tile.buildingHeight ? `b${tile.buildingHeight}` : 'b';
              } else {
                newLayout[y][x] = tile.type.charAt(0) as string;
              }
            } else {
              newLayout[y][x] = 'g';
            }
          }
        }
        setLayout(newLayout);
        setCityName(cityId);
      }
    }
  }, []);

  const handleExport = useCallback(() => {
    const jsonData = {
      width,
      height,
      layout,
    };
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    // Create download link for web
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.document) {
      try {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${cityName}.json`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download file:', error);
        console.log('JSON Data:', jsonString);
        alert('Failed to download. JSON data logged to console.');
      }
    } else {
      // For React Native, log to console
      console.log('=== CITY JSON DATA ===');
      console.log(jsonString);
      console.log('=== END JSON DATA ===');
      if (Platform.OS !== 'web') {
        // In React Native, you might want to use a library like react-native-share
        // For now, just log to console
        alert('JSON data logged to console. Copy it from there.');
      }
    }
  }, [width, height, layout, cityName]);

  const handleClear = useCallback(() => {
    const newLayout: string[][] = [];
    for (let y = 0; y < height; y++) {
      newLayout[y] = [];
      for (let x = 0; x < width; x++) {
        newLayout[y][x] = 'g';
      }
    }
    setLayout(newLayout);
  }, [width, height]);

  const handleFill = useCallback(() => {
    setLayout(prev => prev.map(row => row.map(() => selectedTile)));
  }, [selectedTile]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MAP EDITOR</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <Text style={styles.label}>Width:</Text>
            <TextInput
              style={styles.input}
              value={width.toString()}
              onChangeText={(text) => {
                const val = parseInt(text, 10);
                if (!isNaN(val) && val > 0 && val <= 50) {
                  handleResize(val, height);
                }
              }}
              keyboardType="numeric"
            />
            <Text style={styles.label}>Height:</Text>
            <TextInput
              style={styles.input}
              value={height.toString()}
              onChangeText={(text) => {
                const val = parseInt(text, 10);
                if (!isNaN(val) && val > 0 && val <= 50) {
                  handleResize(width, val);
                }
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={styles.label}>City Name:</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={cityName}
              onChangeText={setCityName}
              placeholder="city-name"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleClear}>
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleFill}>
              <Text style={styles.buttonText}>Fill All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleExport}>
              <Text style={styles.buttonText}>Export JSON</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tile Type Selector */}
        <View style={styles.tileSelector}>
          <Text style={styles.sectionTitle}>Tile Types</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tileGrid}>
              {TILE_TYPES.map(tile => (
                <TouchableOpacity
                  key={tile.code}
                  style={[
                    styles.tileButton,
                    selectedTile === tile.code && styles.tileButtonSelected,
                    { backgroundColor: tile.color }
                  ]}
                  onPress={() => setSelectedTile(tile.code)}
                >
                  <Text style={styles.tileButtonText}>{tile.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Load Existing Cities */}
        <View style={styles.loadSection}>
          <Text style={styles.sectionTitle}>Load Existing City</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cityGrid}>
              {AVAILABLE_CITIES.map(city => (
                <TouchableOpacity
                  key={city.id}
                  style={styles.cityButton}
                  onPress={() => handleLoadCity(city.id)}
                >
                  <Text style={styles.cityButtonText}>{city.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Map Grid */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Map Grid ({width}×{height})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {layout.map((row, y) => (
                <View key={y} style={styles.row}>
                  {row.map((cell, x) => {
                    const tileType = TILE_TYPES.find(t => t.code === cell) || TILE_TYPES[0];
                    return (
                      <TouchableOpacity
                        key={`${x}-${y}`}
                        style={[
                          styles.cell,
                          { backgroundColor: tileType.color }
                        ]}
                        onPress={() => handleTileClick(x, y)}
                      >
                        <Text style={styles.cellText}>{cell}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  controls: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 80,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 4,
    padding: 8,
    color: '#fff',
    fontSize: 16,
    minWidth: 60,
    marginRight: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#3a3a3a',
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4a4a2a',
    borderColor: '#FFD700',
  },
  buttonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tileSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tileGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  tileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#555',
    minWidth: 100,
    alignItems: 'center',
  },
  tileButtonSelected: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  tileButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadSection: {
    marginBottom: 16,
  },
  cityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  cityButton: {
    backgroundColor: '#3a3a3a',
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cityButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  mapSection: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

