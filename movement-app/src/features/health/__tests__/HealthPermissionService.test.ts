import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  HealthPermissionService,
  getHealthPermissionService,
  resetHealthPermissionService,
} from '../services/HealthPermissionService';
import { MockHealthProvider } from '../providers/MockHealthProvider';

describe('HealthPermissionService', () => {
  let mockProvider: MockHealthProvider;
  let service: HealthPermissionService;

  beforeEach(() => {
    mockProvider = new MockHealthProvider();
    service = new HealthPermissionService(mockProvider);
    resetHealthPermissionService();
  });

  describe('Permission Retrieval & Caching', () => {
    it('retrieves permissions and caches result', async () => {
      assert.strictEqual(service.getCachedPermissions(), null);
      assert.strictEqual(service.getLastCheckedTimestamp(), null);

      const perms = await service.getPermissions();
      assert.strictEqual(perms.steps, 'GRANTED');
      assert.strictEqual(service.getCachedPermissions()?.steps, 'GRANTED');
      assert.ok(typeof service.getLastCheckedTimestamp() === 'number');

      // Changing provider without forceRefresh returns cached map
      mockProvider.setPermission('steps', 'DENIED');
      const cached = await service.getPermissions(false);
      assert.strictEqual(cached.steps, 'GRANTED');

      // forceRefresh: true fetches new permissions
      const refreshed = await service.getPermissions(true);
      assert.strictEqual(refreshed.steps, 'DENIED');
      assert.strictEqual(service.getCachedPermissions()?.steps, 'DENIED');
    });

    it('queries single permission status via getPermission', async () => {
      mockProvider.setPermission('sleep', 'DENIED');
      const status = await service.getPermission('sleep', true);
      assert.strictEqual(status, 'DENIED');
    });

    it('clears cached state on clearCache()', async () => {
      await service.getPermissions();
      assert.ok(service.getCachedPermissions() !== null);

      service.clearCache();
      assert.strictEqual(service.getCachedPermissions(), null);
      assert.strictEqual(service.getLastCheckedTimestamp(), null);
    });
  });

  describe('Requesting Permissions', () => {
    it('requests specified permissions and updates cache', async () => {
      mockProvider.setAllPermissions('UNDETERMINED');
      mockProvider.setAutoGrant(true);

      const result = await service.requestPermissions(['steps', 'distance']);

      assert.strictEqual(result.allGranted, true);
      assert.strictEqual(result.hasAnyGranted, true);
      assert.deepStrictEqual(result.grantedTypes, ['steps', 'distance']);
      assert.deepStrictEqual(result.deniedTypes, []);
      assert.strictEqual(service.getCachedPermissions()?.steps, 'GRANTED');
    });

    it('handles partially denied permission results', async () => {
      mockProvider.setAllPermissions('UNDETERMINED');
      // Mock rejecting permissions
      mockProvider.setAutoGrant(false);
      mockProvider.setPermission('steps', 'GRANTED');
      mockProvider.setPermission('heart_rate', 'DENIED');

      const result = await service.requestPermissions(['steps', 'heart_rate']);

      assert.strictEqual(result.allGranted, false);
      assert.strictEqual(result.hasAnyGranted, true);
      assert.deepStrictEqual(result.grantedTypes, ['steps']);
      assert.deepStrictEqual(result.deniedTypes, ['heart_rate']);
      assert.strictEqual(result.canPromptAgain, false);
    });

    it('handles Apple HealthKit UNKNOWN_IOS_READ status', async () => {
      mockProvider.setAutoGrant(false);
      mockProvider.setAllPermissions('UNKNOWN_IOS_READ');

      const result = await service.requestPermissions(['steps', 'sleep']);

      assert.strictEqual(result.allGranted, true);
      assert.strictEqual(result.hasAnyGranted, true);
      assert.deepStrictEqual(result.unknownIosReadTypes, ['steps', 'sleep']);
      assert.deepStrictEqual(result.deniedTypes, []);
    });
  });

  describe('Boolean Helper Methods', () => {
    it('hasPermission returns true for GRANTED and UNKNOWN_IOS_READ', async () => {
      mockProvider.setPermission('steps', 'GRANTED');
      assert.strictEqual(await service.hasPermission('steps', true), true);

      mockProvider.setPermission('steps', 'UNKNOWN_IOS_READ');
      assert.strictEqual(await service.hasPermission('steps', true), true);

      mockProvider.setPermission('steps', 'DENIED');
      assert.strictEqual(await service.hasPermission('steps', true), false);

      mockProvider.setPermission('steps', 'UNDETERMINED');
      assert.strictEqual(await service.hasPermission('steps', true), false);
    });

    it('hasAllPermissions checks across specified types', async () => {
      mockProvider.setPermission('steps', 'GRANTED');
      mockProvider.setPermission('distance', 'GRANTED');
      assert.strictEqual(await service.hasAllPermissions(['steps', 'distance'], true), true);

      mockProvider.setPermission('distance', 'DENIED');
      assert.strictEqual(await service.hasAllPermissions(['steps', 'distance'], true), false);
    });

    it('hasAnyPermission checks if at least one is granted', async () => {
      mockProvider.setPermission('steps', 'GRANTED');
      mockProvider.setPermission('distance', 'DENIED');
      assert.strictEqual(await service.hasAnyPermission(['steps', 'distance'], true), true);

      mockProvider.setPermission('steps', 'DENIED');
      assert.strictEqual(await service.hasAnyPermission(['steps', 'distance'], true), false);
    });

    it('isPermissionDenied, areAnyDenied, and areAllDenied evaluate denial states', async () => {
      mockProvider.setPermission('steps', 'DENIED');
      mockProvider.setPermission('sleep', 'GRANTED');

      assert.strictEqual(await service.isPermissionDenied('steps', true), true);
      assert.strictEqual(await service.isPermissionDenied('sleep', true), false);

      assert.strictEqual(await service.areAnyDenied(['steps', 'sleep'], true), true);
      assert.strictEqual(await service.areAllDenied(['steps', 'sleep'], true), false);

      mockProvider.setPermission('sleep', 'DENIED');
      assert.strictEqual(await service.areAllDenied(['steps', 'sleep'], true), true);
    });
  });

  describe('Permission Rationales', () => {
    it('returns structured rationales for UI presentation', async () => {
      mockProvider.setPermission('steps', 'UNDETERMINED');
      const rationales = await service.getPermissionRationales(['steps', 'heart_rate']);

      assert.strictEqual(rationales.length, 2);

      const stepsRationale = rationales[0];
      assert.strictEqual(stepsRationale.type, 'steps');
      assert.strictEqual(stepsRationale.title, 'Steps');
      assert.strictEqual(stepsRationale.unitLabel, 'steps');
      assert.ok(stepsRationale.rationale.length > 0);
      assert.strictEqual(stepsRationale.currentStatus, 'UNDETERMINED');
    });
  });

  describe('Settings & Re-verification', () => {
    it('delegates openSettings to provider', async () => {
      assert.strictEqual(mockProvider.getSettingsOpenCount(), 0);
      await service.openSettings();
      assert.strictEqual(mockProvider.getSettingsOpenCount(), 1);
    });

    it('rechecks permissions on recheckPermissions()', async () => {
      await service.getPermissions();

      mockProvider.setPermission('steps', 'DENIED');
      const rechecked = await service.recheckPermissions();

      assert.strictEqual(rechecked.steps, 'DENIED');
      assert.strictEqual(service.getCachedPermissions()?.steps, 'DENIED');
    });
  });

  describe('Singleton Lifecycle', () => {
    it('caches and reuses singleton instance', () => {
      const s1 = getHealthPermissionService();
      const s2 = getHealthPermissionService();
      assert.strictEqual(s1, s2);
    });

    it('creates new instance after resetHealthPermissionService()', () => {
      const s1 = getHealthPermissionService();
      resetHealthPermissionService();
      const s2 = getHealthPermissionService();
      assert.notStrictEqual(s1, s2);
    });
  });
});
