import type {
  HealthDataType,
  TimeRange,
  TimeBucket,
  HealthSampleTypeMap,
  AggregateResult,
  AvailabilityStatus,
  HealthPermissionMap,
} from './types';

/**
 * Platform provider interface ("Port" in Ports-and-Adapters Architecture).
 *
 * Implementations:
 * - HealthKitProvider (iOS)
 * - HealthConnectProvider (Android)
 * - MockHealthProvider (Deterministic test / dev / simulator provider)
 *
 * All implementations must satisfy this contract identically with no platform leakage.
 */
export interface HealthProvider {
  /**
   * Unique identifier of the underlying provider implementation.
   */
  readonly providerId: 'healthkit' | 'health_connect' | 'mock';

  /**
   * Evaluates if the health subsystem is available on the current device.
   */
  isAvailable(): Promise<AvailabilityStatus>;

  /**
   * Performs any one-time provider client initialization (e.g. Health Connect initialize()).
   */
  initialize(): Promise<void>;

  /**
   * Inspects the current authorization state for all supported data types.
   */
  getGrantedPermissions(): Promise<HealthPermissionMap>;

  /**
   * Prompts the user to grant authorization for the specified data types.
   * Strictly requests read-only access.
   */
  requestPermissions(types: HealthDataType[]): Promise<HealthPermissionMap>;

  /**
   * Reads raw samples for a specific data type within the given time range.
   *
   * @param type Health data type to read.
   * @param range Start and end timestamps for the query.
   * @param limit Optional maximum number of samples to return.
   */
  readSamples<T extends HealthDataType>(
    type: T,
    range: TimeRange,
    limit?: number
  ): Promise<HealthSampleTypeMap[T][]>;

  /**
   * Reads aggregated metric data bucketed by the requested interval.
   *
   * @param type Health data type to aggregate.
   * @param range Start and end timestamps for the query.
   * @param bucket Bucketing interval (hour, day, week, month).
   */
  readAggregate(
    type: HealthDataType,
    range: TimeRange,
    bucket: TimeBucket
  ): Promise<AggregateResult>;

  /**
   * Opens the system settings or Health Connect / Health app settings page.
   */
  openSettings(): Promise<void>;
}
