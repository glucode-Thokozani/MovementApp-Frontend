import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MockHealthProvider } from '../providers/MockHealthProvider';
import {
  HealthUnavailableError,
  PermissionDeniedError,
} from '../domain/errors';
import type {
  StepSample,
  HeartRateSample,
  SleepSession,
  WorkoutSession,
} from '../domain/types';

describe('MockHealthProvider', () => {
  let provider: MockHealthProvider;

  beforeEach(() => {
    provider = new MockHealthProvider();
  });

  describe('Identity & Initialization', () => {
    it('has providerId "mock"', () => {
      assert.strictEqual(provider.providerId, 'mock');
    });

    it('reports AVAILABLE availability status by default', async () => {
      const status = await provider.isAvailable();
      assert.strictEqual(status, 'AVAILABLE');
    });

    it('allows changing availability status via setAvailability', async () => {
      provider.setAvailability('NOT_SUPPORTED');
      const status = await provider.isAvailable();
      assert.strictEqual(status, 'NOT_SUPPORTED');
    });

    it('initializes successfully', async () => {
      assert.strictEqual(provider.getIsInitialized(), false);
      await provider.initialize();
      assert.strictEqual(provider.getIsInitialized(), true);
    });
  });

  describe('Permission Management', () => {
    it('returns all permissions GRANTED by default', async () => {
      const permissions = await provider.getGrantedPermissions();
      assert.strictEqual(permissions.steps, 'GRANTED');
      assert.strictEqual(permissions.distance, 'GRANTED');
      assert.strictEqual(permissions.active_calories, 'GRANTED');
      assert.strictEqual(permissions.heart_rate, 'GRANTED');
      assert.strictEqual(permissions.sleep, 'GRANTED');
      assert.strictEqual(permissions.workouts, 'GRANTED');
    });

    it('accepts initial permissions configuration', async () => {
      const customProvider = new MockHealthProvider({
        initialPermissions: {
          steps: 'UNDETERMINED',
          sleep: 'DENIED',
        },
      });

      const permissions = await customProvider.getGrantedPermissions();
      assert.strictEqual(permissions.steps, 'UNDETERMINED');
      assert.strictEqual(permissions.sleep, 'DENIED');
      assert.strictEqual(permissions.heart_rate, 'GRANTED');
    });

    it('auto-grants requested permissions by default', async () => {
      provider.setPermission('steps', 'UNDETERMINED');
      const updated = await provider.requestPermissions(['steps']);
      assert.strictEqual(updated.steps, 'GRANTED');
    });

    it('respects setAutoGrant(false)', async () => {
      provider.setAutoGrant(false);
      provider.setPermission('steps', 'UNDETERMINED');
      const updated = await provider.requestPermissions(['steps']);
      assert.strictEqual(updated.steps, 'UNDETERMINED');
    });

    it('allows bulk permission override via setAllPermissions', async () => {
      provider.setAllPermissions('DENIED');
      const permissions = await provider.getGrantedPermissions();
      assert.strictEqual(permissions.steps, 'DENIED');
      assert.strictEqual(permissions.distance, 'DENIED');
      assert.strictEqual(permissions.workouts, 'DENIED');
    });
  });

  describe('Sample Retrieval (readSamples)', () => {
    const testRange = {
      startDate: new Date('2026-10-20T00:00:00.000Z'),
      endDate: new Date('2026-10-22T23:59:59.999Z'),
    };

    it('generates deterministic StepSamples', async () => {
      const samples1 = await provider.readSamples('steps', testRange);
      const samples2 = await provider.readSamples('steps', testRange);

      assert.ok(samples1.length > 0, 'Expected step samples');
      assert.strictEqual(samples1.length, samples2.length);
      assert.deepStrictEqual(samples1, samples2);

      const first = samples1[0];
      assert.ok(first.id.startsWith('mock-step-'));
      assert.ok(first.count > 0);
      assert.strictEqual(first.sourceName, 'Movement Tracker');
    });

    it('generates DistanceSamples matching steps', async () => {
      const samples = await provider.readSamples('distance', testRange);
      assert.ok(samples.length > 0);
      const first = samples[0];
      assert.ok(first.id.startsWith('mock-dist-'));
      assert.ok(first.distanceMeters > 0);
    });

    it('generates CalorieSamples matching steps', async () => {
      const samples = await provider.readSamples('active_calories', testRange);
      assert.ok(samples.length > 0);
      const first = samples[0];
      assert.ok(first.id.startsWith('mock-cal-'));
      assert.ok(first.activeCalories > 0);
    });

    it('generates HeartRateSamples across hours', async () => {
      const samples = await provider.readSamples('heart_rate', testRange);
      assert.ok(samples.length > 0);
      const first = samples[0];
      assert.ok(first.id.startsWith('mock-hr-'));
      assert.ok(first.bpm >= 50 && first.bpm <= 180);
    });

    it('generates SleepSessions with stage breakdowns', async () => {
      const samples = await provider.readSamples('sleep', testRange);
      assert.ok(samples.length > 0);
      const session = samples[0];
      assert.ok(session.id.startsWith('mock-sleep-'));
      assert.ok(session.durationMs > 0);
      assert.ok(session.stages && session.stages.length > 0);
      assert.strictEqual(session.stages?.[0]?.stage, 'awake');
    });

    it('generates WorkoutSessions with types and durations', async () => {
      const samples = await provider.readSamples('workouts', testRange);
      assert.ok(samples.length > 0);
      const session = samples[0];
      assert.ok(session.id.startsWith('mock-workout-'));
      assert.ok(['running', 'cycling', 'strength_training'].includes(session.workoutType));
      assert.ok(session.durationMs > 0);
    });

    it('respects the limit argument', async () => {
      const allSamples = await provider.readSamples('steps', testRange);
      const limitedSamples = await provider.readSamples('steps', testRange, 2);

      assert.strictEqual(limitedSamples.length, 2);
      assert.deepStrictEqual(limitedSamples, allSamples.slice(0, 2));
    });

    it('returns empty array when startDate > endDate', async () => {
      const invalidRange = {
        startDate: new Date('2026-10-25T00:00:00.000Z'),
        endDate: new Date('2026-10-20T00:00:00.000Z'),
      };
      const samples = await provider.readSamples('steps', invalidRange);
      assert.deepStrictEqual(samples, []);
    });
  });

  describe('Aggregation (readAggregate)', () => {
    const range = {
      startDate: new Date('2026-10-20T00:00:00.000Z'),
      endDate: new Date('2026-10-21T23:59:59.999Z'),
    };

    it('aggregates steps by day with sum and count unit', async () => {
      const aggregate = await provider.readAggregate('steps', range, 'day');

      assert.strictEqual(aggregate.type, 'steps');
      assert.strictEqual(aggregate.bucket, 'day');
      assert.strictEqual(aggregate.unit, 'count');
      assert.ok(aggregate.buckets.length >= 2);

      const totalSteps = aggregate.buckets.reduce((acc: number, b) => acc + b.value, 0);
      assert.ok(totalSteps > 10000, 'Expected positive total steps across buckets');

      for (const bucket of aggregate.buckets) {
        assert.strictEqual(bucket.unit, 'count');
        if (bucket.sampleCount > 0) {
          assert.ok(bucket.value > 0);
        }
      }
    });

    it('aggregates heart rate by day using mean (average) with bpm unit', async () => {
      const aggregate = await provider.readAggregate('heart_rate', range, 'day');

      assert.strictEqual(aggregate.type, 'heart_rate');
      assert.strictEqual(aggregate.bucket, 'day');
      assert.strictEqual(aggregate.unit, 'bpm');

      for (const bucket of aggregate.buckets) {
        if (bucket.sampleCount > 0) {
          assert.ok(bucket.value >= 50 && bucket.value <= 180);
          assert.strictEqual(bucket.unit, 'bpm');
        }
      }
    });

    it('aggregates distance by hour with meters unit', async () => {
      const oneDayRange = {
        startDate: new Date('2026-10-20T08:00:00.000Z'),
        endDate: new Date('2026-10-20T12:00:00.000Z'),
      };
      const aggregate = await provider.readAggregate('distance', oneDayRange, 'hour');

      assert.strictEqual(aggregate.type, 'distance');
      assert.strictEqual(aggregate.bucket, 'hour');
      assert.strictEqual(aggregate.unit, 'meters');
      assert.ok(aggregate.buckets.length >= 4);
    });

    it('returns empty buckets for inverted range', async () => {
      const inverted = {
        startDate: new Date('2026-10-25T00:00:00.000Z'),
        endDate: new Date('2026-10-20T00:00:00.000Z'),
      };
      const result = await provider.readAggregate('steps', inverted, 'day');
      assert.deepStrictEqual(result.buckets, []);
    });
  });

  describe('Custom Sample Injection', () => {
    it('allows injecting custom samples overriding generation', async () => {
      const customStep: StepSample = {
        id: 'custom-1',
        startTime: '2026-10-20T10:00:00.000Z',
        endTime: '2026-10-20T10:30:00.000Z',
        count: 9999,
        sourceId: 'custom-source',
        sourceName: 'Custom Device',
      };

      provider.setCustomSamples('steps', [customStep]);

      const samples = await provider.readSamples('steps', {
        startDate: new Date('2026-10-20T00:00:00.000Z'),
        endDate: new Date('2026-10-20T23:59:59.999Z'),
      });

      assert.strictEqual(samples.length, 1);
      assert.strictEqual(samples[0].id, 'custom-1');
      assert.strictEqual(samples[0].count, 9999);

      // Clearing custom samples restores deterministic generation
      provider.clearCustomSamples();
      const restored = await provider.readSamples('steps', {
        startDate: new Date('2026-10-20T00:00:00.000Z'),
        endDate: new Date('2026-10-20T23:59:59.999Z'),
      });
      assert.ok(restored.length > 1);
      assert.notStrictEqual(restored[0].id, 'custom-1');
    });
  });

  describe('Error Simulation & Edge Cases', () => {
    it('throws simulated error when set', async () => {
      provider.setSimulatedError(new Error('Simulated failure'));

      await assert.rejects(
        () => provider.isAvailable(),
        /Simulated failure/
      );
      await assert.rejects(
        () => provider.readSamples('steps', { startDate: new Date(), endDate: new Date() }),
        /Simulated failure/
      );
    });

    it('throws HealthUnavailableError when availability is not AVAILABLE', async () => {
      provider.setAvailability('NOT_SUPPORTED');

      await assert.rejects(
        () => provider.readSamples('steps', { startDate: new Date(), endDate: new Date() }),
        HealthUnavailableError
      );
    });

    it('returns empty array when permission is DENIED and throwOnDeniedPermission is false (iOS behavior)', async () => {
      provider.setPermission('steps', 'DENIED');
      provider.setThrowOnDeniedPermission(false);

      const samples = await provider.readSamples('steps', {
        startDate: new Date('2026-10-20T00:00:00.000Z'),
        endDate: new Date('2026-10-22T00:00:00.000Z'),
      });

      assert.deepStrictEqual(samples, []);
    });

    it('throws PermissionDeniedError when permission is DENIED and throwOnDeniedPermission is true', async () => {
      provider.setPermission('steps', 'DENIED');
      provider.setThrowOnDeniedPermission(true);

      await assert.rejects(
        () =>
          provider.readSamples('steps', {
            startDate: new Date('2026-10-20T00:00:00.000Z'),
            endDate: new Date('2026-10-22T00:00:00.000Z'),
          }),
        PermissionDeniedError
      );
    });
  });

  describe('Settings Tracking & Reset', () => {
    it('tracks openSettings invocations', async () => {
      assert.strictEqual(provider.getSettingsOpenCount(), 0);
      await provider.openSettings();
      await provider.openSettings();
      assert.strictEqual(provider.getSettingsOpenCount(), 2);
    });

    it('resets state completely on reset()', async () => {
      provider.setAvailability('NOT_INSTALLED');
      provider.setAllPermissions('DENIED');
      provider.setSimulatedError(new Error('Test'));
      await provider.openSettings().catch(() => {});

      provider.reset();

      assert.strictEqual(await provider.isAvailable(), 'AVAILABLE');
      const perms = await provider.getGrantedPermissions();
      assert.strictEqual(perms.steps, 'GRANTED');
      assert.strictEqual(provider.getSettingsOpenCount(), 0);
    });
  });
});
