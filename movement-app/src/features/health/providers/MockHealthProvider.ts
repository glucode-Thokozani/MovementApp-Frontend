import type {
  HealthDataType,
  TimeRange,
  TimeBucket,
  HealthSampleTypeMap,
  AggregateResult,
  AggregateBucket,
  AvailabilityStatus,
  HealthPermissionMap,
  PermissionStatus,
  StepSample,
  DistanceSample,
  CalorieSample,
  HeartRateSample,
  SleepSession,
  WorkoutSession,
  SleepStageInterval,
} from '../domain/types';
import type { HealthProvider } from '../domain/HealthProvider';
import {
  ALL_HEALTH_DATA_TYPES,
  HEALTH_DATA_TYPE_DEFINITIONS,
} from '../config/healthDataTypes';
import {
  HealthUnavailableError,
  PermissionDeniedError,
  ReadFailedError,
} from '../domain/errors';

/**
 * Configuration options for customizing MockHealthProvider behavior.
 */
export interface MockHealthProviderOptions {
  /**
   * Initial hardware/platform availability status. Defaults to 'AVAILABLE'.
   */
  initialAvailability?: AvailabilityStatus;

  /**
   * Initial permission state for each data type. Defaults to all 'GRANTED'.
   */
  initialPermissions?: Partial<HealthPermissionMap>;

  /**
   * If true, requesting permissions immediately transitions them to 'GRANTED'.
   * Defaults to true.
   */
  autoGrantOnRequest?: boolean;

  /**
   * If true, read operations on denied data types throw PermissionDeniedError.
   * If false, read operations return empty results (mirroring iOS HealthKit privacy behavior).
   * Defaults to false.
   */
  throwOnDeniedPermission?: boolean;

  /**
   * Optional initial simulated error that causes provider operations to fail.
   */
  simulatedError?: Error | null;
}

/**
 * Deterministic PRNG / hashing utility for reproducible sample generation.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministic Mock Health Provider.
 *
 * Implements the HealthProvider interface identically for:
 * - Unit and integration testing
 * - Simulator / emulator development without live health stores
 * - Deterministic, reproducible data generation across arbitrary time ranges
 */
export class MockHealthProvider implements HealthProvider {
  public readonly providerId: 'mock' = 'mock';

  private availability: AvailabilityStatus;
  private permissions: HealthPermissionMap;
  private autoGrantOnRequest: boolean;
  private throwOnDeniedPermission: boolean;
  private simulatedError: Error | null;
  private isInitialized: boolean = false;
  private openSettingsCount: number = 0;
  private openInstallPageCount: number = 0;

  // Custom samples override store
  private customSamples: {
    [K in HealthDataType]?: HealthSampleTypeMap[K][];
  } = {};

  constructor(options: MockHealthProviderOptions = {}) {
    this.availability = options.initialAvailability ?? 'AVAILABLE';
    this.autoGrantOnRequest = options.autoGrantOnRequest ?? true;
    this.throwOnDeniedPermission = options.throwOnDeniedPermission ?? false;
    this.simulatedError = options.simulatedError ?? null;

    // Default permissions: all granted unless specified
    const defaultPermissions: HealthPermissionMap = {
      steps: 'GRANTED',
      distance: 'GRANTED',
      active_calories: 'GRANTED',
      heart_rate: 'GRANTED',
      sleep: 'GRANTED',
      workouts: 'GRANTED',
    };

    this.permissions = {
      ...defaultPermissions,
      ...(options.initialPermissions ?? {}),
    };
  }

  // ==========================================
  // HealthProvider Interface Implementation
  // ==========================================

  public async isAvailable(): Promise<AvailabilityStatus> {
    if (this.simulatedError) {
      throw this.simulatedError;
    }
    return this.availability;
  }

  public async initialize(): Promise<void> {
    if (this.simulatedError) {
      throw this.simulatedError;
    }
    this.isInitialized = true;
  }

  public async getGrantedPermissions(): Promise<HealthPermissionMap> {
    if (this.simulatedError) {
      throw this.simulatedError;
    }
    return { ...this.permissions };
  }

  public async requestPermissions(
    types: HealthDataType[]
  ): Promise<HealthPermissionMap> {
    if (this.simulatedError) {
      throw this.simulatedError;
    }

    if (this.autoGrantOnRequest) {
      for (const type of types) {
        this.permissions[type] = 'GRANTED';
      }
    }

    return { ...this.permissions };
  }

  public async readSamples<T extends HealthDataType>(
    type: T,
    range: TimeRange,
    limit?: number
  ): Promise<HealthSampleTypeMap[T][]> {
    if (this.simulatedError) {
      throw this.simulatedError;
    }

    if (this.availability !== 'AVAILABLE') {
      throw new HealthUnavailableError(
        `Health subsystem is not available: ${this.availability}`
      );
    }

    const currentPermission = this.permissions[type];
    if (currentPermission === 'DENIED') {
      if (this.throwOnDeniedPermission) {
        throw new PermissionDeniedError([type]);
      }
      return [];
    }

    // Check for custom overridden samples
    const custom = this.customSamples[type];
    if (custom) {
      const filtered = custom.filter((sample) => {
        const sampleTime = new Date(sample.startTime).getTime();
        return (
          sampleTime >= range.startDate.getTime() &&
          sampleTime <= range.endDate.getTime()
        );
      });
      return (limit && limit > 0 ? filtered.slice(0, limit) : filtered) as HealthSampleTypeMap[T][];
    }

    // Deterministically generate samples
    const samples = this.generateDeterministicSamples(type, range);
    return (limit && limit > 0 ? samples.slice(0, limit) : samples) as HealthSampleTypeMap[T][];
  }

  public async readAggregate(
    type: HealthDataType,
    range: TimeRange,
    bucket: TimeBucket
  ): Promise<AggregateResult> {
    if (this.simulatedError) {
      throw this.simulatedError;
    }

    if (this.availability !== 'AVAILABLE') {
      throw new HealthUnavailableError(
        `Health subsystem is not available: ${this.availability}`
      );
    }

    const currentPermission = this.permissions[type];
    if (currentPermission === 'DENIED') {
      if (this.throwOnDeniedPermission) {
        throw new PermissionDeniedError([type]);
      }
    }

    const unit = HEALTH_DATA_TYPE_DEFINITIONS[type].unit;

    if (range.startDate.getTime() > range.endDate.getTime()) {
      return {
        type,
        bucket,
        unit,
        buckets: [],
      };
    }

    // Retrieve all samples within the queried range
    const samples = await this.readSamples(type, range);

    // Compute bucket intervals and aggregate values
    const buckets = this.calculateBuckets(type, range, bucket, samples);

    return {
      type,
      bucket,
      unit,
      buckets,
    };
  }

  public async openSettings(): Promise<void> {
    if (this.simulatedError) {
      throw this.simulatedError;
    }
    this.openSettingsCount += 1;
  }

  public async openInstallPage(): Promise<void> {
    if (this.simulatedError) {
      throw this.simulatedError;
    }
    this.openInstallPageCount += 1;
  }

  // ==========================================
  // Test / Simulator Control Methods
  // ==========================================

  public setAvailability(status: AvailabilityStatus): void {
    this.availability = status;
  }

  public setPermission(type: HealthDataType, status: PermissionStatus): void {
    this.permissions[type] = status;
  }

  public setAllPermissions(status: PermissionStatus): void {
    for (const type of ALL_HEALTH_DATA_TYPES) {
      this.permissions[type] = status;
    }
  }

  public setAutoGrant(autoGrant: boolean): void {
    this.autoGrantOnRequest = autoGrant;
  }

  public setThrowOnDeniedPermission(throwOnDenied: boolean): void {
    this.throwOnDeniedPermission = throwOnDenied;
  }

  public setSimulatedError(error: Error | null): void {
    this.simulatedError = error;
  }

  public setCustomSamples<T extends HealthDataType>(
    type: T,
    samples: HealthSampleTypeMap[T][]
  ): void {
    (this.customSamples as Record<HealthDataType, unknown>)[type] = samples;
  }

  public clearCustomSamples(): void {
    this.customSamples = {};
  }

  public getSettingsOpenCount(): number {
    return this.openSettingsCount;
  }

  public getInstallPageOpenCount(): number {
    return this.openInstallPageCount;
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public reset(): void {
    this.availability = 'AVAILABLE';
    this.autoGrantOnRequest = true;
    this.throwOnDeniedPermission = false;
    this.simulatedError = null;
    this.isInitialized = false;
    this.openSettingsCount = 0;
    this.openInstallPageCount = 0;
    this.customSamples = {};
    this.setAllPermissions('GRANTED');
  }

  // ==========================================
  // Deterministic Sample Generation
  // ==========================================

  private generateDeterministicSamples<T extends HealthDataType>(
    type: T,
    range: TimeRange
  ): HealthSampleTypeMap[T][] {
    const results: HealthSampleTypeMap[T][] = [];
    const startMs = range.startDate.getTime();
    const endMs = range.endDate.getTime();

    if (startMs > endMs) {
      return results;
    }

    // Iterate day-by-day from start to end
    const cursor = new Date(range.startDate);
    cursor.setHours(0, 0, 0, 0);

    const endCursor = new Date(range.endDate);
    endCursor.setHours(23, 59, 59, 999);

    while (cursor.getTime() <= endCursor.getTime()) {
      const dateKey = cursor.toISOString().slice(0, 10);
      const seed = hashString(dateKey);

      switch (type) {
        case 'steps': {
          const stepSamples = this.generateDaySteps(cursor, dateKey, seed);
          for (const s of stepSamples) {
            const sTime = new Date(s.startTime).getTime();
            if (sTime >= startMs && sTime <= endMs) {
              results.push(s as unknown as HealthSampleTypeMap[T]);
            }
          }
          break;
        }

        case 'distance': {
          const distSamples = this.generateDayDistance(cursor, dateKey, seed);
          for (const s of distSamples) {
            const sTime = new Date(s.startTime).getTime();
            if (sTime >= startMs && sTime <= endMs) {
              results.push(s as unknown as HealthSampleTypeMap[T]);
            }
          }
          break;
        }

        case 'active_calories': {
          const calSamples = this.generateDayCalories(cursor, dateKey, seed);
          for (const s of calSamples) {
            const sTime = new Date(s.startTime).getTime();
            if (sTime >= startMs && sTime <= endMs) {
              results.push(s as unknown as HealthSampleTypeMap[T]);
            }
          }
          break;
        }

        case 'heart_rate': {
          const hrSamples = this.generateDayHeartRate(cursor, dateKey, seed);
          for (const s of hrSamples) {
            const sTime = new Date(s.startTime).getTime();
            if (sTime >= startMs && sTime <= endMs) {
              results.push(s as unknown as HealthSampleTypeMap[T]);
            }
          }
          break;
        }

        case 'sleep': {
          const sleepSample = this.generateDaySleep(cursor, dateKey, seed);
          const sTime = new Date(sleepSample.startTime).getTime();
          if (sTime >= startMs && sTime <= endMs) {
            results.push(sleepSample as unknown as HealthSampleTypeMap[T]);
          }
          break;
        }

        case 'workouts': {
          const workoutSample = this.generateDayWorkout(cursor, dateKey, seed);
          if (workoutSample) {
            const sTime = new Date(workoutSample.startTime).getTime();
            if (sTime >= startMs && sTime <= endMs) {
              results.push(workoutSample as unknown as HealthSampleTypeMap[T]);
            }
          }
          break;
        }
      }

      // Advance by 1 day
      cursor.setDate(cursor.getDate() + 1);
    }

    return results;
  }

  private generateDaySteps(date: Date, dateKey: string, seed: number): StepSample[] {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();

    const periods = [
      { startH: 8, startM: 0, endH: 8, endM: 45, count: 1800 + (seed % 600) },
      { startH: 12, startM: 30, endH: 13, endM: 0, count: 1200 + ((seed >> 2) % 400) },
      { startH: 17, startM: 30, endH: 18, endM: 30, count: 3400 + ((seed >> 4) % 1200) },
      { startH: 20, startM: 30, endH: 21, endM: 0, count: 900 + ((seed >> 6) % 300) },
    ];

    return periods.map((p, idx) => ({
      id: `mock-step-${dateKey}-${idx}`,
      startTime: new Date(y, m, d, p.startH, p.startM).toISOString(),
      endTime: new Date(y, m, d, p.endH, p.endM).toISOString(),
      count: p.count,
      sourceId: 'com.movement.mock',
      sourceName: 'Movement Tracker',
    }));
  }

  private generateDayDistance(date: Date, dateKey: string, seed: number): DistanceSample[] {
    const steps = this.generateDaySteps(date, dateKey, seed);
    return steps.map((s, idx) => ({
      id: `mock-dist-${dateKey}-${idx}`,
      startTime: s.startTime,
      endTime: s.endTime,
      distanceMeters: Math.round(s.count * 0.78),
      sourceId: 'com.movement.mock',
      sourceName: 'Movement Tracker',
    }));
  }

  private generateDayCalories(date: Date, dateKey: string, seed: number): CalorieSample[] {
    const steps = this.generateDaySteps(date, dateKey, seed);
    return steps.map((s, idx) => ({
      id: `mock-cal-${dateKey}-${idx}`,
      startTime: s.startTime,
      endTime: s.endTime,
      activeCalories: Math.round(s.count * 0.042),
      sourceId: 'com.movement.mock',
      sourceName: 'Movement Tracker',
    }));
  }

  private generateDayHeartRate(date: Date, dateKey: string, seed: number): HeartRateSample[] {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const samples: HeartRateSample[] = [];

    // Hourly samples across 24 hours
    for (let h = 0; h < 24; h += 2) {
      let bpm: number;
      if (h < 7) {
        // Night resting HR
        bpm = 58 + ((seed + h) % 8);
      } else if (h === 8 || h === 18) {
        // Active exercise period
        bpm = 135 + ((seed + h) % 25);
      } else {
        // Daytime resting / light movement
        bpm = 72 + ((seed + h) % 16);
      }

      samples.push({
        id: `mock-hr-${dateKey}-${h}`,
        startTime: new Date(y, m, d, h, 0).toISOString(),
        endTime: new Date(y, m, d, h, 5).toISOString(),
        bpm,
        sourceId: 'com.movement.mock',
        sourceName: 'Movement Tracker',
      });
    }

    return samples;
  }

  private generateDaySleep(date: Date, dateKey: string, seed: number): SleepSession {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();

    // Sleep from previous evening 23:00 to current morning 07:00 (8 hours)
    const prevDate = new Date(y, m, d - 1);
    const start = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate(), 23, 0);
    const end = new Date(y, m, d, 7, 0);
    const durationMs = end.getTime() - start.getTime(); // 28,800,000 ms

    const stages: SleepStageInterval[] = [
      {
        stage: 'awake',
        startTime: new Date(start.getTime()).toISOString(),
        endTime: new Date(start.getTime() + 15 * 60 * 1000).toISOString(),
      },
      {
        stage: 'light',
        startTime: new Date(start.getTime() + 15 * 60 * 1000).toISOString(),
        endTime: new Date(start.getTime() + 150 * 60 * 1000).toISOString(),
      },
      {
        stage: 'deep',
        startTime: new Date(start.getTime() + 150 * 60 * 1000).toISOString(),
        endTime: new Date(start.getTime() + 240 * 60 * 1000).toISOString(),
      },
      {
        stage: 'rem',
        startTime: new Date(start.getTime() + 240 * 60 * 1000).toISOString(),
        endTime: new Date(start.getTime() + 360 * 60 * 1000).toISOString(),
      },
      {
        stage: 'light',
        startTime: new Date(start.getTime() + 360 * 60 * 1000).toISOString(),
        endTime: end.toISOString(),
      },
    ];

    return {
      id: `mock-sleep-${dateKey}`,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMs,
      stages,
      sourceId: 'com.movement.mock',
      sourceName: 'Movement Tracker',
    };
  }

  private generateDayWorkout(date: Date, dateKey: string, seed: number): WorkoutSession | null {
    // Only generate on even days to reflect realistic rest days
    if (seed % 2 !== 0) {
      return null;
    }

    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();

    const start = new Date(y, m, d, 17, 30);
    const end = new Date(y, m, d, 18, 15);
    const durationMs = 45 * 60 * 1000;

    const workoutTypes = ['running', 'cycling', 'strength_training'] as const;
    const chosenType = workoutTypes[seed % workoutTypes.length];

    const titles: Record<typeof workoutTypes[number], string> = {
      running: 'Outdoor Run',
      cycling: 'Evening Cycling',
      strength_training: 'Functional Strength',
    };

    return {
      id: `mock-workout-${dateKey}`,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      workoutType: chosenType,
      title: titles[chosenType],
      durationMs,
      energyBurnedKcal: 380 + (seed % 90),
      distanceMeters: chosenType === 'strength_training' ? undefined : 5200 + (seed % 500),
      sourceId: 'com.movement.mock',
      sourceName: 'Movement Tracker',
    };
  }

  // ==========================================
  // Bucketing & Aggregation Logic
  // ==========================================

  private calculateBuckets(
    type: HealthDataType,
    range: TimeRange,
    bucket: TimeBucket,
    samples: HealthSampleTypeMap[HealthDataType][]
  ): AggregateBucket[] {
    const buckets: AggregateBucket[] = [];
    const unit = HEALTH_DATA_TYPE_DEFINITIONS[type].unit;

    // Determine initial bucket boundary
    const cursor = new Date(range.startDate);
    this.floorToBucketBoundary(cursor, bucket);

    const endMs = range.endDate.getTime();

    while (cursor.getTime() < endMs) {
      const bucketStart = new Date(cursor);
      const bucketEnd = this.getNextBucketBoundary(bucketStart, bucket);

      // Clamp end boundary to user range end if desired, or keep uniform intervals
      const bStartMs = bucketStart.getTime();
      const bEndMs = bucketEnd.getTime();

      // Find samples falling inside [bStartMs, bEndMs)
      const bucketSamples = samples.filter((s) => {
        const sTime = new Date(s.startTime).getTime();
        return sTime >= bStartMs && sTime < bEndMs;
      });

      let aggregateValue = 0;

      switch (type) {
        case 'steps': {
          aggregateValue = (bucketSamples as StepSample[]).reduce(
            (sum, item) => sum + item.count,
            0
          );
          break;
        }

        case 'distance': {
          aggregateValue = (bucketSamples as DistanceSample[]).reduce(
            (sum, item) => sum + item.distanceMeters,
            0
          );
          break;
        }

        case 'active_calories': {
          aggregateValue = (bucketSamples as CalorieSample[]).reduce(
            (sum, item) => sum + item.activeCalories,
            0
          );
          break;
        }

        case 'heart_rate': {
          const hrSamples = bucketSamples as HeartRateSample[];
          if (hrSamples.length > 0) {
            const sumBpm = hrSamples.reduce((sum, item) => sum + item.bpm, 0);
            aggregateValue = Math.round((sumBpm / hrSamples.length) * 10) / 10;
          } else {
            aggregateValue = 0;
          }
          break;
        }

        case 'sleep': {
          aggregateValue = (bucketSamples as SleepSession[]).reduce(
            (sum, item) => sum + item.durationMs,
            0
          );
          break;
        }

        case 'workouts': {
          aggregateValue = (bucketSamples as WorkoutSession[]).reduce(
            (sum, item) => sum + item.durationMs,
            0
          );
          break;
        }
      }

      buckets.push({
        startTime: bucketStart.toISOString(),
        endTime: bucketEnd.toISOString(),
        value: aggregateValue,
        unit,
        sampleCount: bucketSamples.length,
      });

      // Advance cursor to bucketEnd
      cursor.setTime(bucketEnd.getTime());
    }

    return buckets;
  }

  private floorToBucketBoundary(date: Date, bucket: TimeBucket): void {
    switch (bucket) {
      case 'hour':
        date.setMinutes(0, 0, 0);
        break;
      case 'day':
        date.setHours(0, 0, 0, 0);
        break;
      case 'week': {
        date.setHours(0, 0, 0, 0);
        const dayOfWeek = date.getDay(); // 0 is Sunday
        const diff = date.getDate() - dayOfWeek;
        date.setDate(diff);
        break;
      }
      case 'month':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
    }
  }

  private getNextBucketBoundary(from: Date, bucket: TimeBucket): Date {
    const next = new Date(from);
    switch (bucket) {
      case 'hour':
        next.setHours(next.getHours() + 1);
        break;
      case 'day':
        next.setDate(next.getDate() + 1);
        break;
      case 'week':
        next.setDate(next.getDate() + 7);
        break;
      case 'month':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }
}
