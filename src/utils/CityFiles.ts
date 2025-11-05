/**
 * List of available city files
 */
export const AVAILABLE_CITIES = [
  { id: 'prague', name: 'Prague', file: require('../../assets/cities/prague.json') },
  { id: 'new-york', name: 'New York', file: require('../../assets/cities/new-york.json') },
  { id: 'los-angeles', name: 'Los Angeles', file: require('../../assets/cities/los-angeles.json') },
  { id: 'tokyo', name: 'Tokyo', file: require('../../assets/cities/tokyo.json') },
  { id: 'london', name: 'London', file: require('../../assets/cities/london.json') },
  { id: 'dubai', name: 'Dubai', file: require('../../assets/cities/dubai.json') },
  { id: 'paris', name: 'Paris', file: require('../../assets/cities/paris.json') },
] as const;

export type CityId = typeof AVAILABLE_CITIES[number]['id'];

/**
 * Load city data by ID
 */
export const loadCityById = (cityId: CityId | null): any => {
  if (!cityId) {
    return null;
  }
  
  const city = AVAILABLE_CITIES.find(c => c.id === cityId);
  if (!city) {
    return null;
  }
  
  return city.file;
};

/**
 * Get city name by ID
 */
export const getCityName = (cityId: CityId | null): string => {
  if (!cityId) {
    return 'Random City';
  }
  
  const city = AVAILABLE_CITIES.find(c => c.id === cityId);
  return city ? city.name : 'Random City';
};

