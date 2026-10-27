import type { AvailabilityStatus } from '../domain/types';
import type { HealthProvider } from '../domain/HealthProvider';
import {
  HealthUnavailableError,
  ProviderNotInstalledError,
} from '../domain/errors';
import { getHealthProvider } from '../providers/createHealthProvider';

/**
 * Detailed availability information with actionable UI recommendations and messaging.
 */
export interface HealthAvailabilityInfo {
  /**
   * Normalized hardware/OS availability status.
   */
  status: AvailabilityStatus;

  /**
   * True if health integration is fully operational.
   */
  isAvailable: boolean;

  /**
   * True if the underlying hardware/OS supports health tracking (even if not yet installed).
   */
  isSupported: boolean;

  /**
   * True if Android Health Connect needs to be installed from Google Play.
   */
  needsInstall: boolean;

  /**
   * True if Android Health Connect is installed but requires a Play Store update.
   */
  needsUpdate: boolean;

  /**
   * True if system health settings can be launched by the user.
   */
  canOpenSettings: boolean;

  /**
   * True if an app store installation / update page can be opened.
   */
  canOpenInstallPage: boolean;

  /**
   * Human-friendly short title suitable for screen headers or modals.
   */
  title: string;

  /**
   * Explanatory message for user education or error dialogs.
   */
  message: string;

  /**
   * Underlying provider identifier ('healthkit' | 'health_connect' | 'mock').
   */
  providerId: 'healthkit' | 'health_connect' | 'mock';
}

/**
 * Application service managing health subsystem availability and store redirections.
 *
 * Responsibilities:
 * - Normalizes platform availability states into AVAILABLE | NOT_SUPPORTED | NOT_INSTALLED | NEEDS_UPDATE | UNKNOWN.
 * - Caches status in-memory to prevent redundant native bridge round-trips.
 * - Handles Android Health Connect Play Store redirects and iOS iPad / unsupported device detection.
 * - Strictly delegates platform execution to HealthProvider without platform code leakage.
 */
export class HealthAvailabilityService {
  private readonly provider: HealthProvider;
  private cachedStatus: AvailabilityStatus | null = null;
  private lastCheckedTimestamp: number | null = null;

  constructor(provider?: HealthProvider) {
    this.provider = provider ?? getHealthProvider();
  }

  /**
   * Evaluates and normalizes the availability of the health subsystem.
   * Caches results unless forceRefresh is true.
   */
  public async checkAvailability(forceRefresh: boolean = false): Promise<AvailabilityStatus> {
    if (!forceRefresh && this.cachedStatus !== null) {
      return this.cachedStatus;
    }

    try {
      const status = await this.provider.isAvailable();
      this.cachedStatus = this.normalizeStatus(status);
    } catch (error: unknown) {
      if (error instanceof ProviderNotInstalledError) {
        this.cachedStatus = 'NOT_INSTALLED';
      } else if (error instanceof HealthUnavailableError) {
        this.cachedStatus = 'NOT_SUPPORTED';
      } else {
        this.cachedStatus = 'UNKNOWN';
      }
    }

    this.lastCheckedTimestamp = Date.now();
    return this.cachedStatus;
  }

  /**
   * Synchronously returns the cached availability status, or null if not yet queried.
   */
  public getCachedStatus(): AvailabilityStatus | null {
    return this.cachedStatus;
  }

  /**
   * Returns timestamp in milliseconds when availability was last checked, or null if never.
   */
  public getLastCheckedTimestamp(): number | null {
    return this.lastCheckedTimestamp;
  }

  /**
   * Returns true if health services are immediately available for reading data.
   */
  public async isAvailable(forceRefresh: boolean = false): Promise<boolean> {
    const status = await this.checkAvailability(forceRefresh);
    return status === 'AVAILABLE';
  }

  /**
   * Returns true if the device/OS supports health tracking (i.e. not 'NOT_SUPPORTED').
   */
  public async isSupported(forceRefresh: boolean = false): Promise<boolean> {
    const status = await this.checkAvailability(forceRefresh);
    return status !== 'NOT_SUPPORTED';
  }

  /**
   * Returns true if the health provider must be installed from the app store.
   */
  public async needsInstall(forceRefresh: boolean = false): Promise<boolean> {
    const status = await this.checkAvailability(forceRefresh);
    return status === 'NOT_INSTALLED';
  }

  /**
   * Returns true if the health provider requires a store update.
   */
  public async needsUpdate(forceRefresh: boolean = false): Promise<boolean> {
    const status = await this.checkAvailability(forceRefresh);
    return status === 'NEEDS_UPDATE';
  }

  /**
   * Returns comprehensive availability information including user-facing messages and actions.
   */
  public async getAvailabilityInfo(forceRefresh: boolean = false): Promise<HealthAvailabilityInfo> {
    const status = await this.checkAvailability(forceRefresh);
    const providerId = this.provider.providerId;

    const isAvail = status === 'AVAILABLE';
    const isSupp = status !== 'NOT_SUPPORTED';
    const needsInst = status === 'NOT_INSTALLED';
    const needsUpd = status === 'NEEDS_UPDATE';

    const canOpenSettings = isAvail || status === 'UNKNOWN';
    const canOpenInstallPage =
      (needsInst || needsUpd) && typeof this.provider.openInstallPage === 'function';

    let title: string;
    let message: string;

    switch (status) {
      case 'AVAILABLE':
        title = 'Health Integration Ready';
        message =
          providerId === 'healthkit'
            ? 'Apple Health is ready to connect with Movement.'
            : providerId === 'health_connect'
            ? 'Google Health Connect is ready to connect with Movement.'
            : 'Device health tracking is ready to connect.';
        break;

      case 'NOT_INSTALLED':
        title = 'Health Connect Required';
        message =
          'Google Health Connect is required to sync your fitness data. Please install it from Google Play.';
        break;

      case 'NEEDS_UPDATE':
        title = 'Health Connect Update Required';
        message =
          'Your version of Google Health Connect is out of date. Please update it from Google Play to sync fitness data.';
        break;

      case 'NOT_SUPPORTED':
        title = 'Health Tracking Not Supported';
        message =
          providerId === 'healthkit'
            ? 'Apple HealthKit is not supported on this device (e.g. iPad without HealthKit).'
            : 'Fitness tracking services are not supported on this device or operating system.';
        break;

      case 'UNKNOWN':
      default:
        title = 'Health Services Status Unknown';
        message =
          'Unable to verify health services availability. Please check your system settings.';
        break;
    }

    return {
      status,
      isAvailable: isAvail,
      isSupported: isSupp,
      needsInstall: needsInst,
      needsUpdate: needsUpd,
      canOpenSettings,
      canOpenInstallPage,
      title,
      message,
      providerId,
    };
  }

  /**
   * Redirects user to the app store to install or update the health provider.
   * Throws HealthUnavailableError if not supported on the current platform.
   */
  public async openInstallPage(): Promise<void> {
    if (typeof this.provider.openInstallPage === 'function') {
      await this.provider.openInstallPage();
    } else {
      throw new HealthUnavailableError(
        'Installation page is not supported for this health provider.'
      );
    }
  }

  /**
   * Opens the device system health settings.
   */
  public async openSettings(): Promise<void> {
    await this.provider.openSettings();
  }

  /**
   * Clears the in-memory cached availability status.
   */
  public clearCache(): void {
    this.cachedStatus = null;
    this.lastCheckedTimestamp = null;
  }

  private normalizeStatus(status: unknown): AvailabilityStatus {
    const validStatuses: AvailabilityStatus[] = [
      'AVAILABLE',
      'NOT_SUPPORTED',
      'NOT_INSTALLED',
      'NEEDS_UPDATE',
      'UNKNOWN',
    ];

    if (typeof status === 'string' && validStatuses.includes(status as AvailabilityStatus)) {
      return status as AvailabilityStatus;
    }

    return 'UNKNOWN';
  }
}

let defaultAvailabilityService: HealthAvailabilityService | null = null;

/**
 * Returns a shared singleton HealthAvailabilityService instance.
 */
export function getHealthAvailabilityService(
  provider?: HealthProvider
): HealthAvailabilityService {
  if (!defaultAvailabilityService || provider) {
    defaultAvailabilityService = new HealthAvailabilityService(provider);
  }
  return defaultAvailabilityService;
}

/**
 * Resets the cached singleton service instance (useful in test teardown).
 */
export function resetHealthAvailabilityService(): void {
  defaultAvailabilityService = null;
}
