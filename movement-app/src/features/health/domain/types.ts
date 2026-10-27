/**
 * Supported health and fitness data types across Apple HealthKit and Android Health Connect.
 * Strictly read-only scope.
 */
export type HealthDataType =
  | 'steps'
  | 'distance'
  | 'active_calories'
  | 'heart_rate'
  | 'sleep'
  | 'workouts';

/**
 * Standardized time range definition for querying samples and aggregates.
 */
export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Supported time bucketing intervals for aggregated metrics.
 */
export type TimeBucket = 'hour' | 'day' | 'week' | 'month';

/**
 * Normalized physical units across all platforms.
 */
export type NormalizedUnit = 'count' | 'meters' | 'kcal' | 'bpm' | 'ms';

/**
 * Base metadata common to every health sample.
 */
export interface BaseHealthSample {
  id: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  sourceId?: string;
  sourceName?: string;
}

/**
 * Step count sample.
 */
export interface StepSample extends BaseHealthSample {
  count: number;
}

/**
 * Distance sample measured in meters.
 */
export interface DistanceSample extends BaseHealthSample {
  distanceMeters: number;
}

/**
 * Active calories (energy burned) sample measured in kilocalories (kcal).
 */
export interface CalorieSample extends BaseHealthSample {
  activeCalories: number;
}

/**
 * Instantaneous heart rate sample measured in beats per minute (bpm).
 */
export interface HeartRateSample extends BaseHealthSample {
  bpm: number;
}

/**
 * Sleep stage classification normalized between HealthKit and Health Connect.
 */
export type SleepStage = 'awake' | 'light' | 'deep' | 'rem' | 'unspecified';

export interface SleepStageInterval {
  stage: SleepStage;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
}

/**
 * Sleep session with total duration and optional sleep stage breakdowns.
 */
export interface SleepSession extends BaseHealthSample {
  durationMs: number;
  stages?: SleepStageInterval[];
}

/**
 * Normalized workout / exercise session categories.
 */
export type WorkoutType =
  | 'running'
  | 'walking'
  | 'cycling'
  | 'swimming'
  | 'strength_training'
  | 'yoga'
  | 'hiit'
  | 'pilates'
  | 'elliptical'
  | 'rowing'
  | 'hiking'
  | 'other';

/**
 * Workout or exercise session record.
 */
export interface WorkoutSession extends BaseHealthSample {
  workoutType: WorkoutType;
  title?: string;
  durationMs: number;
  energyBurnedKcal?: number;
  distanceMeters?: number;
}

/**
 * Type-level mapping between a HealthDataType and its corresponding sample domain interface.
 */
export interface HealthSampleTypeMap {
  steps: StepSample;
  distance: DistanceSample;
  active_calories: CalorieSample;
  heart_rate: HeartRateSample;
  sleep: SleepSession;
  workouts: WorkoutSession;
}

/**
 * Aggregated bucket item representing a summarized time slice.
 */
export interface AggregateBucket {
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  value: number;
  unit: NormalizedUnit;
  sampleCount: number;
}

/**
 * Aggregated query result for a given HealthDataType.
 */
export interface AggregateResult {
  type: HealthDataType;
  bucket: TimeBucket;
  unit: NormalizedUnit;
  buckets: AggregateBucket[];
}

/**
 * Normalized hardware/platform availability status.
 */
export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'NOT_SUPPORTED'
  | 'NOT_INSTALLED'
  | 'NEEDS_UPDATE'
  | 'UNKNOWN';

/**
 * Normalized permission state for a data type.
 *
 * UNKNOWN_IOS_READ: Apple HealthKit does NOT reveal whether read authorization
 * was denied (to protect user privacy, queries simply return empty arrays).
 */
export type PermissionStatus =
  | 'GRANTED'
  | 'DENIED'
  | 'UNDETERMINED'
  | 'UNKNOWN_IOS_READ';

/**
 * Permission state mapped across all supported data types.
 */
export type HealthPermissionMap = Record<HealthDataType, PermissionStatus>;
