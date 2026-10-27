import { TimeRange } from '../domain/types';

/**
 * Global health feature configuration and defaults.
 */
export const HEALTH_CONFIG = {
  /**
   * Android Health Connect default read window is 30 days unless Android 14+
   * READ_HEALTH_DATA_HISTORY permission is explicitly requested and granted.
   */
  ANDROID_DEFAULT_HISTORY_DAYS: 30,

  /**
   * Maximum number of raw sample records requested in a single query page.
   */
  DEFAULT_PAGE_SIZE: 1000,

  /**
   * Maximum range in days to query in a single batch before chunking to prevent memory spikes.
   */
  MAX_QUERY_CHUNK_DAYS: 30,

  /**
   * Heart rate sub-sample rate in minutes for UI chart rendering.
   */
  HEART_RATE_SAMPLE_INTERVAL_MINUTES: 5,

  /**
   * Feature flags controlling health integration behavior.
   */
  FEATURE_FLAGS: {
    /**
     * Force-enable the deterministic mock provider for testing or simulator dev.
     */
    enableMockInDev: false,

    /**
     * Allow incremental checkpoint syncing.
     */
    enableIncrementalSync: true,

    /**
     * Strictly enforce local on-device retention (no remote telemetry/export of health data).
     */
    enforceOnDeviceOnly: true,
  },
} as const;

/**
 * Utility helper returning common standard TimeRange windows relative to now.
 */
export const TimeRanges = {
  today(): TimeRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { startDate: start, endDate: now };
  },

  lastDays(days: number): TimeRange {
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: now };
  },

  last7Days(): TimeRange {
    return TimeRanges.lastDays(7);
  },

  last30Days(): TimeRange {
    return TimeRanges.lastDays(30);
  },
};
