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
 * Android Health Connect provider implementation ("Adapter" in Ports-and-Adapters Architecture).
 *
 * Full Jetpack Health Connect integration with react-native-health-connect
 * is implemented in Phase 6.
 */
export class HealthConnectProvider implements HealthProvider {
  public readonly providerId: 'health_connect' = 'health_connect';

  public async isAvailable(): Promise<AvailabilityStatus> {
    // Scaffold implementation pending Phase 6 native binding
    return 'AVAILABLE';
  }

  public async initialize(): Promise<void> {
    // Jetpack Health Connect client initialization will be wired in Phase 6
  }

  public async getGrantedPermissions(): Promise<HealthPermissionMap> {
    return {
      steps: 'UNDETERMINED',
      distance: 'UNDETERMINED',
      active_calories: 'UNDETERMINED',
      heart_rate: 'UNDETERMINED',
      sleep: 'UNDETERMINED',
      workouts: 'UNDETERMINED',
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
      'HealthConnectProvider native integration will be wired in Phase 6.'
    );
  }

  public async readAggregate(
    _type: HealthDataType,
    _range: TimeRange,
    _bucket: TimeBucket
  ): Promise<AggregateResult> {
    throw new HealthUnavailableError(
      'HealthConnectProvider native integration will be wired in Phase 6.'
    );
  }

  public async openSettings(): Promise<void> {
    // Will open Health Connect settings / permissions manager in Phase 6
  }

  public async openInstallPage(): Promise<void> {
    // Will open Google Play Store page for Health Connect in Phase 6
  }
}
