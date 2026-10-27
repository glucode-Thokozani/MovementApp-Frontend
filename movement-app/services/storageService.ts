import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage key constants used across the application.
 */
export const STORAGE_KEYS = {
  HAS_COMPLETED_ONBOARDING: '@movement_has_completed_onboarding',
  ONBOARDING_DATA: '@movement_onboarding_data',
} as const;

/**
 * Dependency Inversion Principle abstraction for key-value persistence.
 */
export interface IStorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clearAll?(): Promise<void>;
}

/**
 * Concrete storage implementation powered by @react-native-async-storage/async-storage.
 */
export class AsyncStorageService implements IStorageService {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn(`[AsyncStorageService] Failed to read key: ${key}`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn(`[AsyncStorageService] Failed to write key: ${key}`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`[AsyncStorageService] Failed to remove key: ${key}`, error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn('[AsyncStorageService] Failed to clear storage', error);
    }
  }
}

// Default singleton instance
export const storageService = new AsyncStorageService();
export default storageService;
