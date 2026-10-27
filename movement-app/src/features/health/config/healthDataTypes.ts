import { HealthDataType, NormalizedUnit } from '../domain/types';

/**
 * Definition representing the single source of truth for a health data type,
 * mapping domain concepts to native iOS HealthKit and Android Health Connect identifiers.
 */
export interface HealthTypeDefinition {
  type: HealthDataType;
  title: string;
  description: string;
  rationale: string;
  unit: NormalizedUnit;
  unitLabel: string;
  iosIdentifier: string;
  androidRecordType: string;
  androidPermission: string;
}

/**
 * Single source of truth configuration mapping domain types to native metadata.
 * Strictly read-only scope.
 */
export const HEALTH_DATA_TYPE_DEFINITIONS: Record<HealthDataType, HealthTypeDefinition> = {
  steps: {
    type: 'steps',
    title: 'Steps',
    description: 'Daily step cadence and step counts.',
    rationale: 'Used to track your daily walking and running progress toward your activity goals.',
    unit: 'count',
    unitLabel: 'steps',
    iosIdentifier: 'HKQuantityTypeIdentifierStepCount',
    androidRecordType: 'StepsRecord',
    androidPermission: 'android.permission.health.READ_STEPS',
  },
  distance: {
    type: 'distance',
    title: 'Distance',
    description: 'Walking and running distances traversed.',
    rationale: 'Accurately calculates total ground covered during daily movement and outdoor workouts.',
    unit: 'meters',
    unitLabel: 'm',
    iosIdentifier: 'HKQuantityTypeIdentifierDistanceWalkingRunning',
    androidRecordType: 'DistanceRecord',
    androidPermission: 'android.permission.health.READ_DISTANCE',
  },
  active_calories: {
    type: 'active_calories',
    title: 'Active Energy',
    description: 'Active energy burned during exercise and physical movement.',
    rationale: 'Measures calories burned through movement to help balance activity and recovery.',
    unit: 'kcal',
    unitLabel: 'kcal',
    iosIdentifier: 'HKQuantityTypeIdentifierActiveEnergyBurned',
    androidRecordType: 'ActiveCaloriesBurnedRecord',
    androidPermission: 'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  },
  heart_rate: {
    type: 'heart_rate',
    title: 'Heart Rate',
    description: 'Resting, workout, and instantaneous heart rate measurements.',
    rationale: 'Monitors cardiovascular effort and training zones during exercise.',
    unit: 'bpm',
    unitLabel: 'bpm',
    iosIdentifier: 'HKQuantityTypeIdentifierHeartRate',
    androidRecordType: 'HeartRateRecord',
    androidPermission: 'android.permission.health.READ_HEART_RATE',
  },
  sleep: {
    type: 'sleep',
    title: 'Sleep Sessions',
    description: 'Sleep duration and sleep stage intervals.',
    rationale: 'Assesses overnight rest and recovery to calibrate daytime workout intensity.',
    unit: 'ms',
    unitLabel: 'hrs',
    iosIdentifier: 'HKCategoryTypeIdentifierSleepAnalysis',
    androidRecordType: 'SleepSessionRecord',
    androidPermission: 'android.permission.health.READ_SLEEP',
  },
  workouts: {
    type: 'workouts',
    title: 'Workouts & Exercise',
    description: 'Recorded workouts, sports activities, and exercise sessions.',
    rationale: 'Aggregates your workout history, exercise durations, and training sessions.',
    unit: 'ms',
    unitLabel: 'sessions',
    iosIdentifier: 'HKWorkoutTypeIdentifier',
    androidRecordType: 'ExerciseSessionRecord',
    androidPermission: 'android.permission.health.READ_EXERCISE',
  },
};

/**
 * Array of all supported health data types in consistent display order.
 */
export const ALL_HEALTH_DATA_TYPES: HealthDataType[] = [
  'steps',
  'distance',
  'active_calories',
  'heart_rate',
  'sleep',
  'workouts',
];

/**
 * Returns definition for a given HealthDataType.
 */
export function getHealthTypeDefinition(type: HealthDataType): HealthTypeDefinition {
  return HEALTH_DATA_TYPE_DEFINITIONS[type];
}

/**
 * Returns the native iOS HK identifier for a domain data type.
 */
export function getIosHealthKitIdentifier(type: HealthDataType): string {
  return HEALTH_DATA_TYPE_DEFINITIONS[type].iosIdentifier;
}

/**
 * Returns the native Android Health Connect permission string for a domain data type.
 */
export function getAndroidHealthPermission(type: HealthDataType): string {
  return HEALTH_DATA_TYPE_DEFINITIONS[type].androidPermission;
}

/**
 * Returns the native Android Health Connect record type name for a domain data type.
 */
export function getAndroidRecordType(type: HealthDataType): string {
  return HEALTH_DATA_TYPE_DEFINITIONS[type].androidRecordType;
}
