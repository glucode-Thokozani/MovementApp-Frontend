import type { HealthDataType } from './types';

/**
 * Base abstract error for all health-related domain operations.
 */
export class HealthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HealthError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the health framework (HealthKit or Health Connect) is unavailable
 * on the current hardware/OS (e.g. iPad without HealthKit, emulator without provider).
 */
export class HealthUnavailableError extends HealthError {
  public readonly reason?: string;

  constructor(
    message: string = 'Health services are not supported or available on this device.',
    reason?: string
  ) {
    super(message);
    this.name = 'HealthUnavailableError';
    this.reason = reason;
  }
}

/**
 * Thrown when Android Health Connect is not installed or requires an update from the Play Store.
 */
export class ProviderNotInstalledError extends HealthError {
  public readonly playStoreUrl: string;

  constructor(
    message: string = 'Health Connect is not installed or needs an update on this device.',
    playStoreUrl: string = 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'
  ) {
    super(message);
    this.name = 'ProviderNotInstalledError';
    this.playStoreUrl = playStoreUrl;
  }
}

/**
 * Thrown when a required health data permission has been denied by the user.
 */
export class PermissionDeniedError extends HealthError {
  public readonly deniedTypes: HealthDataType[];

  constructor(
    deniedTypes: HealthDataType[],
    message: string = `Health permissions were denied for: ${deniedTypes.join(', ')}`
  ) {
    super(message);
    this.name = 'PermissionDeniedError';
    this.deniedTypes = deniedTypes;
  }
}

/**
 * Thrown when querying samples or aggregates fails.
 */
export class ReadFailedError extends HealthError {
  public readonly dataType: HealthDataType;
  public readonly causeError?: unknown;

  constructor(
    dataType: HealthDataType,
    causeError?: unknown,
    message: string = `Failed to read health data for '${dataType}'.`
  ) {
    super(message);
    this.name = 'ReadFailedError';
    this.dataType = dataType;
    this.causeError = causeError;
  }
}
