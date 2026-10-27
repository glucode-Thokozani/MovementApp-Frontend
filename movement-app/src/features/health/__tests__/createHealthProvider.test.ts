import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createHealthProvider,
  getHealthProvider,
  resetHealthProvider,
} from '../providers/createHealthProvider';
import { MockHealthProvider } from '../providers/MockHealthProvider';
import { HealthKitProvider } from '../providers/HealthKitProvider';
import { HealthConnectProvider } from '../providers/HealthConnectProvider';

describe('createHealthProvider Factory', () => {
  beforeEach(() => {
    resetHealthProvider();
  });

  it('returns MockHealthProvider when forceMock is true', () => {
    const provider = createHealthProvider({ forceMock: true });
    assert.ok(provider instanceof MockHealthProvider);
    assert.strictEqual(provider.providerId, 'mock');
  });

  it('passes mockOptions to MockHealthProvider', async () => {
    const provider = createHealthProvider({
      forceMock: true,
      mockOptions: { initialAvailability: 'NOT_INSTALLED' },
    });
    assert.strictEqual(await provider.isAvailable(), 'NOT_INSTALLED');
  });

  it('returns HealthKitProvider when platformOverride is "ios" and not forced mock', () => {
    // Temporarily unset NODE_ENV to test non-test platform routing
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const provider = createHealthProvider({
        forceMock: false,
        platformOverride: 'ios',
      });
      assert.ok(provider instanceof HealthKitProvider);
      assert.strictEqual(provider.providerId, 'healthkit');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('returns HealthConnectProvider when platformOverride is "android" and not forced mock', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const provider = createHealthProvider({
        forceMock: false,
        platformOverride: 'android',
      });
      assert.ok(provider instanceof HealthConnectProvider);
      assert.strictEqual(provider.providerId, 'health_connect');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('falls back to MockHealthProvider on web or other platforms', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const provider = createHealthProvider({
        forceMock: false,
        platformOverride: 'web',
      });
      assert.ok(provider instanceof MockHealthProvider);
      assert.strictEqual(provider.providerId, 'mock');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  describe('Singleton lifecycle (getHealthProvider / resetHealthProvider)', () => {
    it('caches and reuses singleton provider instance', () => {
      const p1 = getHealthProvider({ forceMock: true });
      const p2 = getHealthProvider();
      assert.strictEqual(p1, p2);
    });

    it('creates fresh instance after resetHealthProvider()', () => {
      const p1 = getHealthProvider({ forceMock: true });
      resetHealthProvider();
      const p2 = getHealthProvider({ forceMock: true });
      assert.notStrictEqual(p1, p2);
    });
  });
});
