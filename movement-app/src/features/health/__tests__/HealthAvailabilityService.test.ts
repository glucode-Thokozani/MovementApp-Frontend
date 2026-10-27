import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  HealthAvailabilityService,
  getHealthAvailabilityService,
  resetHealthAvailabilityService,
} from '../services/HealthAvailabilityService';
import { MockHealthProvider } from '../providers/MockHealthProvider';
import {
  HealthUnavailableError,
  ProviderNotInstalledError,
} from '../domain/errors';
import type { HealthProvider } from '../domain/HealthProvider';

describe('HealthAvailabilityService', () => {
  let mockProvider: MockHealthProvider;
  let service: HealthAvailabilityService;

  beforeEach(() => {
    mockProvider = new MockHealthProvider();
    service = new HealthAvailabilityService(mockProvider);
    resetHealthAvailabilityService();
  });

  describe('Availability Status Checking & Normalization', () => {
    it('returns AVAILABLE when provider is available', async () => {
      mockProvider.setAvailability('AVAILABLE');
      const status = await service.checkAvailability();
      assert.strictEqual(status, 'AVAILABLE');
    });

    it('returns NOT_INSTALLED when provider is NOT_INSTALLED', async () => {
      mockProvider.setAvailability('NOT_INSTALLED');
      const status = await service.checkAvailability();
      assert.strictEqual(status, 'NOT_INSTALLED');
    });

    it('returns NOT_SUPPORTED when provider is NOT_SUPPORTED', async () => {
      mockProvider.setAvailability('NOT_SUPPORTED');
      const status = await service.checkAvailability();
      assert.strictEqual(status, 'NOT_SUPPORTED');
    });

    it('returns NEEDS_UPDATE when provider is NEEDS_UPDATE', async () => {
      mockProvider.setAvailability('NEEDS_UPDATE');
      const status = await service.checkAvailability();
      assert.strictEqual(status, 'NEEDS_UPDATE');
    });

    it('normalizes ProviderNotInstalledError to NOT_INSTALLED', async () => {
      mockProvider.setSimulatedError(new ProviderNotInstalledError());
      const status = await service.checkAvailability();
      assert.strictEqual(status, 'NOT_INSTALLED');
    });

    it('normalizes HealthUnavailableError to NOT_SUPPORTED', async () => {
      mockProvider.setSimulatedError(new HealthUnavailableError('Hardware unsupported'));
      const status = await service.checkAvailability();
      assert.strictEqual(status, 'NOT_SUPPORTED');
    });

    it('normalizes arbitrary unexpected errors to UNKNOWN', async () => {
      mockProvider.setSimulatedError(new Error('Unexpected bridge crash'));
      const status = await service.checkAvailability();
      assert.strictEqual(status, 'UNKNOWN');
    });
  });

  describe('In-Memory Caching & Timestamps', () => {
    it('caches status after initial check', async () => {
      assert.strictEqual(service.getCachedStatus(), null);
      assert.strictEqual(service.getLastCheckedTimestamp(), null);

      await service.checkAvailability();
      assert.strictEqual(service.getCachedStatus(), 'AVAILABLE');
      assert.ok(typeof service.getLastCheckedTimestamp() === 'number');

      // Change underlying provider without forceRefresh -> still returns cached
      mockProvider.setAvailability('NOT_SUPPORTED');
      const cached = await service.checkAvailability(false);
      assert.strictEqual(cached, 'AVAILABLE');

      // forceRefresh: true updates cache to new state
      const refreshed = await service.checkAvailability(true);
      assert.strictEqual(refreshed, 'NOT_SUPPORTED');
      assert.strictEqual(service.getCachedStatus(), 'NOT_SUPPORTED');
    });

    it('clears cache on clearCache()', async () => {
      await service.checkAvailability();
      assert.strictEqual(service.getCachedStatus(), 'AVAILABLE');

      service.clearCache();
      assert.strictEqual(service.getCachedStatus(), null);
      assert.strictEqual(service.getLastCheckedTimestamp(), null);
    });
  });

  describe('Convenience Boolean Queries', () => {
    it('evaluates isAvailable()', async () => {
      mockProvider.setAvailability('AVAILABLE');
      assert.strictEqual(await service.isAvailable(), true);

      mockProvider.setAvailability('NOT_SUPPORTED');
      assert.strictEqual(await service.isAvailable(true), false);
    });

    it('evaluates isSupported()', async () => {
      mockProvider.setAvailability('AVAILABLE');
      assert.strictEqual(await service.isSupported(), true);

      mockProvider.setAvailability('NOT_INSTALLED');
      assert.strictEqual(await service.isSupported(true), true);

      mockProvider.setAvailability('NOT_SUPPORTED');
      assert.strictEqual(await service.isSupported(true), false);
    });

    it('evaluates needsInstall()', async () => {
      mockProvider.setAvailability('NOT_INSTALLED');
      assert.strictEqual(await service.needsInstall(), true);

      mockProvider.setAvailability('AVAILABLE');
      assert.strictEqual(await service.needsInstall(true), false);
    });

    it('evaluates needsUpdate()', async () => {
      mockProvider.setAvailability('NEEDS_UPDATE');
      assert.strictEqual(await service.needsUpdate(), true);

      mockProvider.setAvailability('AVAILABLE');
      assert.strictEqual(await service.needsUpdate(true), false);
    });
  });

  describe('Comprehensive getAvailabilityInfo()', () => {
    it('returns correct info for AVAILABLE state', async () => {
      mockProvider.setAvailability('AVAILABLE');
      const info = await service.getAvailabilityInfo();

      assert.strictEqual(info.status, 'AVAILABLE');
      assert.strictEqual(info.isAvailable, true);
      assert.strictEqual(info.isSupported, true);
      assert.strictEqual(info.needsInstall, false);
      assert.strictEqual(info.needsUpdate, false);
      assert.strictEqual(info.canOpenSettings, true);
      assert.strictEqual(info.canOpenInstallPage, false);
      assert.strictEqual(info.title, 'Health Integration Ready');
    });

    it('returns correct info for NOT_INSTALLED state with install action', async () => {
      mockProvider.setAvailability('NOT_INSTALLED');
      const info = await service.getAvailabilityInfo();

      assert.strictEqual(info.status, 'NOT_INSTALLED');
      assert.strictEqual(info.isAvailable, false);
      assert.strictEqual(info.isSupported, true);
      assert.strictEqual(info.needsInstall, true);
      assert.strictEqual(info.needsUpdate, false);
      assert.strictEqual(info.canOpenSettings, false);
      assert.strictEqual(info.canOpenInstallPage, true);
      assert.ok(info.title.includes('Health Connect Required'));
    });

    it('returns correct info for NEEDS_UPDATE state with update action', async () => {
      mockProvider.setAvailability('NEEDS_UPDATE');
      const info = await service.getAvailabilityInfo();

      assert.strictEqual(info.status, 'NEEDS_UPDATE');
      assert.strictEqual(info.isAvailable, false);
      assert.strictEqual(info.isSupported, true);
      assert.strictEqual(info.needsInstall, false);
      assert.strictEqual(info.needsUpdate, true);
      assert.strictEqual(info.canOpenInstallPage, true);
      assert.ok(info.title.includes('Update Required'));
    });

    it('returns correct info for NOT_SUPPORTED state', async () => {
      mockProvider.setAvailability('NOT_SUPPORTED');
      const info = await service.getAvailabilityInfo();

      assert.strictEqual(info.status, 'NOT_SUPPORTED');
      assert.strictEqual(info.isAvailable, false);
      assert.strictEqual(info.isSupported, false);
      assert.strictEqual(info.needsInstall, false);
      assert.strictEqual(info.needsUpdate, false);
      assert.strictEqual(info.canOpenInstallPage, false);
      assert.ok(info.title.includes('Not Supported'));
    });
  });

  describe('Actions & Redirections', () => {
    it('delegates openSettings to provider', async () => {
      assert.strictEqual(mockProvider.getSettingsOpenCount(), 0);
      await service.openSettings();
      assert.strictEqual(mockProvider.getSettingsOpenCount(), 1);
    });

    it('delegates openInstallPage to provider when supported', async () => {
      assert.strictEqual(mockProvider.getInstallPageOpenCount(), 0);
      await service.openInstallPage();
      assert.strictEqual(mockProvider.getInstallPageOpenCount(), 1);
    });

    it('throws HealthUnavailableError if provider does not implement openInstallPage', async () => {
      const providerWithoutInstall: HealthProvider = {
        providerId: 'mock',
        isAvailable: async () => 'NOT_INSTALLED',
        initialize: async () => {},
        getGrantedPermissions: async () => ({
          steps: 'UNDETERMINED',
          distance: 'UNDETERMINED',
          active_calories: 'UNDETERMINED',
          heart_rate: 'UNDETERMINED',
          sleep: 'UNDETERMINED',
          workouts: 'UNDETERMINED',
        }),
        requestPermissions: async () => ({
          steps: 'UNDETERMINED',
          distance: 'UNDETERMINED',
          active_calories: 'UNDETERMINED',
          heart_rate: 'UNDETERMINED',
          sleep: 'UNDETERMINED',
          workouts: 'UNDETERMINED',
        }),
        readSamples: async () => [],
        readAggregate: async () => ({
          type: 'steps',
          bucket: 'day',
          unit: 'count',
          buckets: [],
        }),
        openSettings: async () => {},
      };

      const svc = new HealthAvailabilityService(providerWithoutInstall);
      await assert.rejects(
        () => svc.openInstallPage(),
        HealthUnavailableError
      );
    });
  });

  describe('Singleton lifecycle', () => {
    it('caches and returns singleton instance', () => {
      const s1 = getHealthAvailabilityService();
      const s2 = getHealthAvailabilityService();
      assert.strictEqual(s1, s2);
    });

    it('creates new instance after reset', () => {
      const s1 = getHealthAvailabilityService();
      resetHealthAvailabilityService();
      const s2 = getHealthAvailabilityService();
      assert.notStrictEqual(s1, s2);
    });
  });
});
