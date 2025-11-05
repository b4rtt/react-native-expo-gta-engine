import { Storage } from './Storage';

const CUSTOM_CITIES_STORAGE_KEY = 'gta-engine-custom-cities';

/**
 * Built-in city files
 */
const BUILT_IN_CITIES = [
  { id: 'prague', name: 'Prague', file: require('../../assets/cities/prague.json') },
  { id: 'new-york', name: 'New York', file: require('../../assets/cities/new-york.json') },
  { id: 'los-angeles', name: 'Los Angeles', file: require('../../assets/cities/los-angeles.json') },
  { id: 'tokyo', name: 'Tokyo', file: require('../../assets/cities/tokyo.json') },
  { id: 'london', name: 'London', file: require('../../assets/cities/london.json') },
  { id: 'dubai', name: 'Dubai', file: require('../../assets/cities/dubai.json') },
  { id: 'paris', name: 'Paris', file: require('../../assets/cities/paris.json') },
] as const;

export type BuiltInCityId = typeof BUILT_IN_CITIES[number]['id'];

/**
 * Custom city from localStorage
 */
export interface CustomCity {
  id: string;
  name: string;
  data: any; // JSON data
}

/**
 * Get all custom cities from localStorage
 */
export const getCustomCities = async (): Promise<CustomCity[]> => {
  try {
    const json = await Storage.load(CUSTOM_CITIES_STORAGE_KEY);
    if (!json) {
      return [];
    }
    return JSON.parse(json) as CustomCity[];
  } catch (error) {
    console.error('Failed to load custom cities:', error);
    return [];
  }
};

/**
 * Save custom city to localStorage
 */
export const saveCustomCity = async (id: string, name: string, data: any): Promise<boolean> => {
  try {
    const customCities = await getCustomCities();
    const existingIndex = customCities.findIndex(c => c.id === id);
    
    const city: CustomCity = { id, name, data };
    
    if (existingIndex >= 0) {
      customCities[existingIndex] = city;
    } else {
      customCities.push(city);
    }
    
    await Storage.save(CUSTOM_CITIES_STORAGE_KEY, JSON.stringify(customCities));
    return true;
  } catch (error) {
    console.error('Failed to save custom city:', error);
    return false;
  }
};

/**
 * Delete custom city from localStorage
 */
export const deleteCustomCity = async (id: string): Promise<boolean> => {
  try {
    const customCities = await getCustomCities();
    const filtered = customCities.filter(c => c.id !== id);
    await Storage.save(CUSTOM_CITIES_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete custom city:', error);
    return false;
  }
};

/**
 * Get all available cities (built-in + custom)
 */
export const getAllCities = async (): Promise<Array<{ id: string; name: string; isCustom: boolean }>> => {
  try {
    const builtIn = BUILT_IN_CITIES.map(c => ({ id: c.id, name: c.name, isCustom: false }));
    const customCities = await getCustomCities();
    console.log('getAllCities - Custom cities from storage:', customCities);
    const custom = customCities.map(c => ({ id: c.id, name: c.name, isCustom: true }));
    const all = [...builtIn, ...custom];
    console.log('getAllCities - Total cities:', all.length, 'Built-in:', builtIn.length, 'Custom:', custom.length);
    return all;
  } catch (error) {
    console.error('getAllCities error:', error);
    // Return at least built-in cities on error
    return BUILT_IN_CITIES.map(c => ({ id: c.id, name: c.name, isCustom: false }));
  }
};

/**
 * List of available city files (static for backward compatibility)
 * Use getAllCities() for dynamic list including custom cities
 */
export const AVAILABLE_CITIES = BUILT_IN_CITIES;

export type CityId = BuiltInCityId | string; // Allow custom city IDs

/**
 * Load city data by ID (supports both built-in and custom cities)
 */
export const loadCityById = async (cityId: CityId | null): Promise<any> => {
  if (!cityId) {
    return null;
  }
  
  // Try built-in cities first
  const builtInCity = BUILT_IN_CITIES.find(c => c.id === cityId);
  if (builtInCity) {
    return builtInCity.file;
  }
  
  // Try custom cities from localStorage
  try {
    const customCities = await getCustomCities();
    const customCity = customCities.find(c => c.id === cityId);
    if (customCity) {
      return customCity.data;
    }
  } catch (error) {
    console.error('Failed to load custom city:', error);
  }
  
  return null;
};

/**
 * Get city name by ID (supports both built-in and custom cities)
 */
export const getCityName = async (cityId: CityId | null): Promise<string> => {
  if (!cityId) {
    return 'Random City';
  }
  
  // Try built-in cities first
  const builtInCity = BUILT_IN_CITIES.find(c => c.id === cityId);
  if (builtInCity) {
    return builtInCity.name;
  }
  
  // Try custom cities
  try {
    const customCities = await getCustomCities();
    const customCity = customCities.find(c => c.id === cityId);
    if (customCity) {
      return customCity.name;
    }
  } catch (error) {
    console.error('Failed to get custom city name:', error);
  }
  
  return 'Random City';
};

