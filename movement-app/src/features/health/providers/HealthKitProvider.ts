import type {
  HealthDataType,
  TimeRange,
  TimeBucket,
  HealthSampleTypeMap,
  AggregateResult,
  AvailabilityStatus,
  HealthPermissionMap,
} from '../domain/types';
import type { HealthProvider } from '../domain/HealthProvider';
import { HealthUnavailableError } from '../domain/errors';

/**
 * iOS Apple HealthKit provider implementation ("Adapter" in Ports-and-Adapters Architecture).
 *
 * Full native Nitro Module integration with @kingstinct/react-native-healthkit
 * is implemented in Phase 6.
 */
export class HealthKitProvider implements HealthProvider {
  public readonly providerId: 'healthkit' = 'healthkit';

  public async isAvailable(): Promise<AvailabilityStatus> {
    // Scaffold implementation pending Phase 6 native binding
    return 'AVAILABLE';
  }

  public async initialize(): Promise<void> {
    // HealthKit does not require asynchronous client connection initialization
  }

  public async getGrantedPermissions(): Promise<HealthPermissionMap> {
    // Apple HealthKit does not expose read permission grant state to protect user privacy
    return {
      steps: 'UNKNOWN_IOS_READ',
      distance: 'UNKNOWN_IOS_READ',
      active_calories: 'UNKNOWN_IOS_READ',
      heart_rate: 'UNKNOWN_IOS_READ',
      sleep: 'UNKNOWN_IOS_READ',
      workouts: 'UNKNOWN_IOS_READ',
    };
  }

  public async requestPermissions(
    _types: HealthDataType[]
  ): Promise<HealthPermissionMap> {
    return this.getGrantedPermissions();
  }

  public async readSamples<T extends HealthDataType>(
    _type: T,
    _range: TimeRange,
    _limit?: number
  ): Promise<HealthSampleTypeMap[T][]> {
    throw new HealthUnavailableError(
      'HealthKitProvider native integration will be wired in Phase 6.'
    );
  }

  public async readAggregate(
    _type: HealthDataType,
    _range: TimeRange,
    _bucket: TimeBucket
  ): Promise<AggregateResult> {
    throw new HealthUnavailableError(
      'HealthKitProvider native integration will be wired in Phase 6.'
    );
  }

  public async openSettings(): Promise<void> {
    // Will link to App Settings or Health app in Phase 6
  }

  public async openInstallPage(): Promise<void> {
    throw new HealthUnavailableError(
      'Apple HealthKit is built into iOS and cannot be installed from the App Store.'
    );
  }
}
