import { TimeOfDay } from '../types/Game';

// Game time constants
const SECONDS_PER_GAME_HOUR = 60; // 1 real second = 1 game minute, so 1 hour = 60 seconds
const SECONDS_PER_GAME_DAY = SECONDS_PER_GAME_HOUR * 24; // 24 minutes = 1 full day cycle

/**
 * Create initial time of day (start at 12:00 noon)
 */
export const createTimeOfDay = (hour: number = 12, minute: number = 0): TimeOfDay => {
  return calculateTimeOfDay(hour, minute);
};

/**
 * Calculate time of day classification and light level from hour and minute
 */
export const calculateTimeOfDay = (hour: number, minute: number): TimeOfDay => {
  // Normalize hour to 0-23
  const normalizedHour = ((hour % 24) + 24) % 24;
  const normalizedMinute = Math.max(0, Math.min(59, Math.floor(minute)));
  
  // Calculate time period
  let timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  let lightLevel: number;
  
  // Dawn: 5:00 - 7:00 (sunrise)
  // Day: 7:00 - 18:00 (full daylight)
  // Dusk: 18:00 - 20:00 (sunset)
  // Night: 20:00 - 5:00 (dark)
  
  if (normalizedHour >= 5 && normalizedHour < 7) {
    // Dawn - gradually getting brighter
    timeOfDay = 'dawn';
    const dawnProgress = (normalizedHour - 5) + normalizedMinute / 60; // 0-2 hours
    lightLevel = 0.3 + (dawnProgress / 2) * 0.5; // 0.3 to 0.8
  } else if (normalizedHour >= 7 && normalizedHour < 18) {
    // Day - full brightness
    timeOfDay = 'day';
    lightLevel = 1.0;
  } else if (normalizedHour >= 18 && normalizedHour < 20) {
    // Dusk - gradually getting darker
    timeOfDay = 'dusk';
    const duskProgress = (normalizedHour - 18) + normalizedMinute / 60; // 0-2 hours
    lightLevel = 1.0 - (duskProgress / 2) * 0.5; // 1.0 to 0.5
  } else {
    // Night - dark (20:00 - 5:00)
    timeOfDay = 'night';
    // Night is darkest around midnight (0:00), slightly brighter near dawn/dusk
    const hoursFromMidnight = normalizedHour >= 20 
      ? normalizedHour - 20 
      : normalizedHour + 4; // Wrap around midnight
    const nightProgress = hoursFromMidnight / 9; // 0-1 (9 hours of night)
    // Darkest at midnight (0.2), slightly brighter near edges (0.3)
    lightLevel = 0.2 + Math.sin(nightProgress * Math.PI) * 0.1;
  }
  
  return {
    hour: normalizedHour,
    minute: normalizedMinute,
    timeOfDay,
    lightLevel: Math.max(0.1, Math.min(1.0, lightLevel)), // Clamp between 0.1 and 1.0
  };
};

/**
 * Update time of day based on elapsed real time
 * @param currentTime Current time of day
 * @param deltaTime Real time elapsed in seconds
 * @param timeScale Multiplier for time speed (default 1.0 = 1 game minute per real second)
 * @returns Updated time of day
 */
export const updateTimeOfDay = (
  currentTime: TimeOfDay,
  deltaTime: number,
  timeScale: number = 1.0
): TimeOfDay => {
  // Convert real seconds to game minutes
  const gameMinutesElapsed = deltaTime * timeScale;
  
  // Add minutes to current time
  let newMinute = currentTime.minute + gameMinutesElapsed;
  let newHour = currentTime.hour;
  
  // Handle minute overflow
  while (newMinute >= 60) {
    newMinute -= 60;
    newHour += 1;
  }
  
  // Handle hour overflow (wrap around 24 hours)
  while (newHour >= 24) {
    newHour -= 24;
  }
  
  return calculateTimeOfDay(newHour, newMinute);
};

/**
 * Format time as HH:MM string
 */
export const formatTime = (time: TimeOfDay): string => {
  const hourStr = String(time.hour).padStart(2, '0');
  const minuteStr = String(time.minute).padStart(2, '0');
  return `${hourStr}:${minuteStr}`;
};

/**
 * Get color tint based on time of day for palette shifts
 */
export const getTimeOfDayTint = (time: TimeOfDay): { r: number; g: number; b: number } => {
  const { timeOfDay, lightLevel } = time;
  
  switch (timeOfDay) {
    case 'dawn':
      // Warm orange/red tint
      return {
        r: 1.0 + (1.0 - lightLevel) * 0.3,
        g: 0.9 + (1.0 - lightLevel) * 0.2,
        b: 0.7 + (1.0 - lightLevel) * 0.3,
      };
    case 'day':
      // Neutral (no tint)
      return { r: 1.0, g: 1.0, b: 1.0 };
    case 'dusk':
      // Warm orange/red tint (same as dawn)
      return {
        r: 1.0 + (1.0 - lightLevel) * 0.3,
        g: 0.9 + (1.0 - lightLevel) * 0.2,
        b: 0.7 + (1.0 - lightLevel) * 0.3,
      };
    case 'night':
      // Cool blue tint, darker
      return {
        r: 0.4 * lightLevel,
        g: 0.5 * lightLevel,
        b: 0.7 * lightLevel,
      };
  }
};

/**
 * Get ambient light color based on time of day
 */
export const getAmbientLightColor = (time: TimeOfDay): string => {
  const { timeOfDay, lightLevel } = time;
  
  switch (timeOfDay) {
    case 'dawn':
      return `rgba(255, 200, 150, ${lightLevel * 0.3})`;
    case 'day':
      return `rgba(255, 255, 255, ${lightLevel * 0.2})`;
    case 'dusk':
      return `rgba(255, 180, 120, ${lightLevel * 0.3})`;
    case 'night':
      return `rgba(100, 120, 200, ${lightLevel * 0.4})`;
  }
};

