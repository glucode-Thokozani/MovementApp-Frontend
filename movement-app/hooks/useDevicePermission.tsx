import { useState, useCallback } from 'react';
import {
  deviceService as defaultDeviceService,
  IDeviceService,
  ServiceResult,
  PreciseLocationData,
  NotificationPermissionData,
  SmartwatchSyncData,
  SmartwatchSyncOptions,
  DeviceServiceStatus,
} from '../services/deviceService';

export interface DevicePermissionHookState {
  locationStatus: DeviceServiceStatus | 'undetermined';
  locationData: PreciseLocationData | null;
  locationError: string | null;

  notificationStatus: DeviceServiceStatus | 'undetermined';
  notificationData: NotificationPermissionData | null;
  notificationError: string | null;

  smartwatchStatus: DeviceServiceStatus | 'undetermined';
  smartwatchData: SmartwatchSyncData | null;
  smartwatchError: string | null;

  isLoading: boolean;
}

/**
 * Custom hook providing reactive device permissions & capabilities.
 * Adheres to Dependency Inversion (DIP) by accepting an optional injected IDeviceService.
 */
export function useDevicePermission(service: IDeviceService = defaultDeviceService) {
  const [state, setState] = useState<DevicePermissionHookState>({
    locationStatus: 'undetermined',
    locationData: null,
    locationError: null,

    notificationStatus: 'undetermined',
    notificationData: null,
    notificationError: null,

    smartwatchStatus: 'undetermined',
    smartwatchData: null,
    smartwatchError: null,

    isLoading: false,
  });

  const requestPreciseLocation = useCallback(async (): Promise<ServiceResult<PreciseLocationData>> => {
    setState((prev) => ({ ...prev, isLoading: true, locationError: null }));
    const result = await service.requestPreciseForegroundLocation();
    setState((prev) => ({
      ...prev,
      isLoading: false,
      locationStatus: result.status,
      locationData: result.data ?? null,
      locationError: result.error ?? null,
    }));
    return result;
  }, [service]);

  const requestNotifications = useCallback(async (): Promise<ServiceResult<NotificationPermissionData>> => {
    setState((prev) => ({ ...prev, isLoading: true, notificationError: null }));
    const result = await service.requestNotificationPermissions();
    setState((prev) => ({
      ...prev,
      isLoading: false,
      notificationStatus: result.status,
      notificationData: result.data ?? null,
      notificationError: result.error ?? null,
    }));
    return result;
  }, [service]);

  const initializeSmartwatch = useCallback(
    async (options?: SmartwatchSyncOptions): Promise<ServiceResult<SmartwatchSyncData>> => {
      setState((prev) => ({ ...prev, isLoading: true, smartwatchError: null }));
      const result = await service.initializeSmartwatchSync(options);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        smartwatchStatus: result.status,
        smartwatchData: result.data ?? null,
        smartwatchError: result.error ?? null,
      }));
      return result;
    },
    [service]
  );

  const requestAll = useCallback(
    async (options?: { smartwatch?: SmartwatchSyncOptions }) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      const [location, notifications, smartwatch] = await Promise.all([
        service.requestPreciseForegroundLocation(),
        service.requestNotificationPermissions(),
        service.initializeSmartwatchSync(options?.smartwatch),
      ]);

      setState({
        locationStatus: location.status,
        locationData: location.data ?? null,
        locationError: location.error ?? null,

        notificationStatus: notifications.status,
        notificationData: notifications.data ?? null,
        notificationError: notifications.error ?? null,

        smartwatchStatus: smartwatch.status,
        smartwatchData: smartwatch.data ?? null,
        smartwatchError: smartwatch.error ?? null,

        isLoading: false,
      });

      return { location, notifications, smartwatch };
    },
    [service]
  );

  return {
    ...state,
    requestPreciseLocation,
    requestNotifications,
    initializeSmartwatch,
    requestAll,
  };
}

export default useDevicePermission;
