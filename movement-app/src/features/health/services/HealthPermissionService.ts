import type {
  HealthDataType,
  HealthPermissionMap,
  PermissionStatus,
} from '../domain/types';
import type { HealthProvider } from '../domain/HealthProvider';
import {
  ALL_HEALTH_DATA_TYPES,
  HEALTH_DATA_TYPE_DEFINITIONS,
} from '../config/healthDataTypes';
import { getHealthProvider } from '../providers/createHealthProvider';

/**
 * Result structure returned after requesting health permissions.
 */
export interface HealthPermissionResult {
  /**
   * Complete map of all health data types and their resolved permission states.
   */
  permissions: HealthPermissionMap;

  /**
   * True if all requested types were granted or are accessible (including iOS UNKNOWN_IOS_READ).
   */
  allGranted: boolean;

  /**
   * True if at least one requested type was granted or accessible.
   */
  hasAnyGranted: boolean;

  /**
   * Data types that were explicitly granted.
   */
  grantedTypes: HealthDataType[];

  /**
   * Data types that were explicitly denied by the user.
   */
  deniedTypes: HealthDataType[];

  /**
   * Data types whose permission state has not yet been prompted to the user.
   */
  undeterminedTypes: HealthDataType[];

  /**
   * Data types on iOS where HealthKit preserves read privacy.
   * HealthKit queries for these types return empty results if denied without crashing.
   */
  unknownIosReadTypes: HealthDataType[];

  /**
   * True if system permissions dialogs can potentially be displayed again directly,
   * or false if user has permanently denied and must be routed to system settings.
   */
  canPromptAgain: boolean;
}

/**
 * Descriptive rationale for a specific health data type to present to the user.
 */
export interface HealthPermissionRationale {
  type: HealthDataType;
  title: string;
  description: string;
  rationale: string;
  unitLabel: string;
  currentStatus: PermissionStatus;
}

/**
 * Application service managing health data permissions, authorization flows, and rationale copy.
 *
 * Responsibilities:
 * - Requests per-type read permissions for supported fitness metrics.
 * - Normalizes platform authorization states into GRANTED | DENIED | UNDETERMINED | UNKNOWN_IOS_READ.
 * - Handles Apple HealthKit privacy behavior (silent read denials via UNKNOWN_IOS_READ).
 * - Routes to system settings when permissions are denied.
 * - Supports on-demand re-verification (e.g. app foreground return).
 * - Caches permission states in-memory; strictly persists zero sensitive data.
 */
export class HealthPermissionService {
  private readonly provider: HealthProvider;
  private cachedPermissions: HealthPermissionMap | null = null;
  private lastCheckedTimestamp: number | null = null;

  constructor(provider?: HealthProvider) {
    this.provider = provider ?? getHealthProvider();
  }

  /**
   * Queries the current authorization state for all supported health data types.
   * Uses cached state unless forceRefresh is true.
   */
  public async getPermissions(forceRefresh: boolean = false): Promise<HealthPermissionMap> {
    if (!forceRefresh && this.cachedPermissions !== null) {
      return { ...this.cachedPermissions };
    }

    const permissions = await this.provider.getGrantedPermissions();
    this.cachedPermissions = { ...permissions };
    this.lastCheckedTimestamp = Date.now();
    return { ...this.cachedPermissions };
  }

  /**
   * Queries authorization state for a single data type.
   */
  public async getPermission(
    type: HealthDataType,
    forceRefresh: boolean = false
  ): Promise<PermissionStatus> {
    const permissions = await this.getPermissions(forceRefresh);
    return permissions[type];
  }

  /**
   * Requests authorization for the specified health data types (or all supported types by default).
   * Strictly requests read-only scope.
   */
  public async requestPermissions(
    types: HealthDataType[] = ALL_HEALTH_DATA_TYPES
  ): Promise<HealthPermissionResult> {
    const targetTypes = types.length > 0 ? types : ALL_HEALTH_DATA_TYPES;

    // Trigger platform authorization dialog
    const updatedPermissions = await this.provider.requestPermissions(targetTypes);
    this.cachedPermissions = { ...updatedPermissions };
    this.lastCheckedTimestamp = Date.now();

    return this.evaluatePermissionResult(this.cachedPermissions, targetTypes);
  }

  /**
   * Returns true if the specified data type is readable.
   * On iOS, UNKNOWN_IOS_READ is considered accessible (queries execute cleanly and return data if authorized).
   */
  public async hasPermission(
    type: HealthDataType,
    forceRefresh: boolean = false
  ): Promise<boolean> {
    const status = await this.getPermission(type, forceRefresh);
    return status === 'GRANTED' || status === 'UNKNOWN_IOS_READ';
  }

  /**
   * Returns true if all requested types are accessible.
   */
  public async hasAllPermissions(
    types: HealthDataType[] = ALL_HEALTH_DATA_TYPES,
    forceRefresh: boolean = false
  ): Promise<boolean> {
    const targetTypes = types.length > 0 ? types : ALL_HEALTH_DATA_TYPES;
    const permissions = await this.getPermissions(forceRefresh);

    return targetTypes.every((type) => {
      const status = permissions[type];
      return status === 'GRANTED' || status === 'UNKNOWN_IOS_READ';
    });
  }

  /**
   * Returns true if at least one of the requested types is accessible.
   */
  public async hasAnyPermission(
    types: HealthDataType[] = ALL_HEALTH_DATA_TYPES,
    forceRefresh: boolean = false
  ): Promise<boolean> {
    const targetTypes = types.length > 0 ? types : ALL_HEALTH_DATA_TYPES;
    const permissions = await this.getPermissions(forceRefresh);

    return targetTypes.some((type) => {
      const status = permissions[type];
      return status === 'GRANTED' || status === 'UNKNOWN_IOS_READ';
    });
  }

  /**
   * Returns true if the specified data type has been explicitly denied.
   */
  public async isPermissionDenied(
    type: HealthDataType,
    forceRefresh: boolean = false
  ): Promise<boolean> {
    const status = await this.getPermission(type, forceRefresh);
    return status === 'DENIED';
  }

  /**
   * Returns true if any of the specified data types have been explicitly denied.
   */
  public async areAnyDenied(
    types: HealthDataType[] = ALL_HEALTH_DATA_TYPES,
    forceRefresh: boolean = false
  ): Promise<boolean> {
    const targetTypes = types.length > 0 ? types : ALL_HEALTH_DATA_TYPES;
    const permissions = await this.getPermissions(forceRefresh);

    return targetTypes.some((type) => permissions[type] === 'DENIED');
  }

  /**
   * Returns true if all of the specified data types have been explicitly denied.
   */
  public async areAllDenied(
    types: HealthDataType[] = ALL_HEALTH_DATA_TYPES,
    forceRefresh: boolean = false
  ): Promise<boolean> {
    const targetTypes = types.length > 0 ? types : ALL_HEALTH_DATA_TYPES;
    const permissions = await this.getPermissions(forceRefresh);

    return targetTypes.every((type) => permissions[type] === 'DENIED');
  }

  /**
   * Generates localized permission rationale information for UI presentation.
   */
  public async getPermissionRationales(
    types: HealthDataType[] = ALL_HEALTH_DATA_TYPES,
    forceRefresh: boolean = false
  ): Promise<HealthPermissionRationale[]> {
    const targetTypes = types.length > 0 ? types : ALL_HEALTH_DATA_TYPES;
    const permissions = await this.getPermissions(forceRefresh);

    return targetTypes.map((type) => {
      const def = HEALTH_DATA_TYPE_DEFINITIONS[type];
      return {
        type,
        title: def.title,
        description: def.description,
        rationale: def.rationale,
        unitLabel: def.unitLabel,
        currentStatus: permissions[type],
      };
    });
  }

  /**
   * Forces re-verification of permission state from the underlying provider.
   * Useful when returning from device settings on app foreground.
   */
  public async recheckPermissions(): Promise<HealthPermissionMap> {
    return this.getPermissions(true);
  }

  /**
   * Opens the system health settings page so the user can modify permissions.
   */
  public async openSettings(): Promise<void> {
    await this.provider.openSettings();
  }

  /**
   * Synchronously returns cached permissions, or null if not yet queried.
   */
  public getCachedPermissions(): HealthPermissionMap | null {
    return this.cachedPermissions ? { ...this.cachedPermissions } : null;
  }

  /**
   * Returns timestamp of when permissions were last checked, or null if never.
   */
  public getLastCheckedTimestamp(): number | null {
    return this.lastCheckedTimestamp;
  }

  /**
   * Clears the in-memory cached permission state.
   */
  public clearCache(): void {
    this.cachedPermissions = null;
    this.lastCheckedTimestamp = null;
  }

  private evaluatePermissionResult(
    permissions: HealthPermissionMap,
    requestedTypes: HealthDataType[]
  ): HealthPermissionResult {
    const grantedTypes: HealthDataType[] = [];
    const deniedTypes: HealthDataType[] = [];
    const undeterminedTypes: HealthDataType[] = [];
    const unknownIosReadTypes: HealthDataType[] = [];

    for (const type of requestedTypes) {
      const status = permissions[type];
      switch (status) {
        case 'GRANTED':
          grantedTypes.push(type);
          break;
        case 'DENIED':
          deniedTypes.push(type);
          break;
        case 'UNDETERMINED':
          undeterminedTypes.push(type);
          break;
        case 'UNKNOWN_IOS_READ':
          unknownIosReadTypes.push(type);
          break;
      }
    }

    const allGranted = requestedTypes.every((type) => {
      const s = permissions[type];
      return s === 'GRANTED' || s === 'UNKNOWN_IOS_READ';
    });

    const hasAnyGranted = requestedTypes.some((type) => {
      const s = permissions[type];
      return s === 'GRANTED' || s === 'UNKNOWN_IOS_READ';
    });

    // On iOS, if UNKNOWN_IOS_READ is present, the prompt has already completed
    // On Android, if any type is DENIED, subsequent prompts may require Settings
    const canPromptAgain = undeterminedTypes.length > 0 && deniedTypes.length === 0;

    return {
      permissions: { ...permissions },
      allGranted,
      hasAnyGranted,
      grantedTypes,
      deniedTypes,
      undeterminedTypes,
      unknownIosReadTypes,
      canPromptAgain,
    };
  }
}

let defaultPermissionService: HealthPermissionService | null = null;

/**
 * Returns a shared singleton HealthPermissionService instance.
 */
export function getHealthPermissionService(
  provider?: HealthProvider
): HealthPermissionService {
  if (!defaultPermissionService || provider) {
    defaultPermissionService = new HealthPermissionService(provider);
  }
  return defaultPermissionService;
}

/**
 * Resets the cached singleton service instance (useful in test teardown).
 */
export function resetHealthPermissionService(): void {
  defaultPermissionService = null;
}
