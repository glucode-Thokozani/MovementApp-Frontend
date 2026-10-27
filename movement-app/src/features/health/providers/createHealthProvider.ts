import { Platform } from 'react-native';
import type { HealthProvider } from '../domain/HealthProvider';
import { HEALTH_CONFIG } from '../config/healthConfig';
import {
  MockHealthProvider,
  type MockHealthProviderOptions,
} from './MockHealthProvider';
import { HealthKitProvider } from './HealthKitProvider';
import { HealthConnectProvider } from './HealthConnectProvider';

/**
 * Options for configuring health provider factory creation.
 */
export interface CreateHealthProviderOptions {
  /**
   * Explicitly force usage of the mock provider regardless of platform or feature flags.
   */
  forceMock?: boolean;

  /**
   * Optional configuration options passed to MockHealthProvider when instantiated.
   */
  mockOptions?: MockHealthProviderOptions;

  /**
   * Optional platform override for testing or cross-platform emulation.
   */
  platformOverride?: 'ios' | 'android' | 'windows' | 'macos' | 'web';
}

let activeProviderInstance: HealthProvider | null = null;

/**
 * Factory function creating the appropriate HealthProvider instance based on runtime environment,
 * feature flags, and operating system.
 *
 * Strict Architecture Rule: Platform selection is encapsulated entirely within this provider module.
 */
export function createHealthProvider(
  options: CreateHealthProviderOptions = {}
): HealthProvider {
  // If explicitly forced, or mock-in-dev flag is active, or running inside test environment
  if (
    options.forceMock ||
    HEALTH_CONFIG.FEATURE_FLAGS.enableMockInDev ||
    process.env.NODE_ENV === 'test'
  ) {
    return new MockHealthProvider(options.mockOptions);
  }

  const currentPlatform = options.platformOverride ?? Platform.OS;

  switch (currentPlatform) {
    case 'ios':
      return new HealthKitProvider();

    case 'android':
      return new HealthConnectProvider();

    default:
      // Fallback for Web or unsupported platforms
      return new MockHealthProvider(options.mockOptions);
  }
}

/**
 * Returns a shared singleton HealthProvider instance for the application lifecycle.
 */
export function getHealthProvider(
  options?: CreateHealthProviderOptions
): HealthProvider {
  if (!activeProviderInstance) {
    activeProviderInstance = createHealthProvider(options);
  }
  return activeProviderInstance;
}

/**
 * Resets the cached singleton provider instance (useful in test teardown).
 */
export function resetHealthProvider(): void {
  activeProviderInstance = null;
}
