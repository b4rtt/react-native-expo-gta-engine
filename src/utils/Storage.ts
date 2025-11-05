const SAVE_KEY = 'gta-engine-save';

/**
 * Get localStorage - works on web and React Native Web
 */
function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

/**
 * Cross-platform storage utility
 * Uses localStorage (works on web and React Native Web)
 */
export const Storage = {
  async save(key: string, value: string): Promise<void> {
    const storage = getStorage();
    if (!storage) {
      throw new Error('localStorage is not available');
    }
    try {
      storage.setItem(key, value);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  },

  async load(key: string): Promise<string | null> {
    const storage = getStorage();
    if (!storage) {
      console.warn('localStorage is not available');
      return null;
    }
    try {
      return storage.getItem(key);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    const storage = getStorage();
    if (!storage) {
      return;
    }
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      throw error;
    }
  },
};

export const SAVE_KEY_CONSTANT = SAVE_KEY;

