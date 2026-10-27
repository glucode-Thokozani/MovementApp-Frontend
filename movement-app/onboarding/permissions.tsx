import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDevicePermission } from '../hooks/useDevicePermission';

interface PermissionsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const PermissionsStep: React.FC<PermissionsStepProps> = ({ onNext, onBack }) => {
  const {
    locationStatus,
    locationData,
    notificationStatus,
    smartwatchStatus,
    smartwatchData,
    isLoading,
    requestPreciseLocation,
    requestNotifications,
    initializeSmartwatch,
    requestAll,
  } = useDevicePermission();

  const allCompleted =
    locationStatus !== 'undetermined' &&
    notificationStatus !== 'undetermined' &&
    smartwatchStatus !== 'undetermined';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Device & Sensors</Text>
        <Text style={styles.subtitle}>
          Movement uses precise GPS, wearable sensors, and timely notifications to keep you on track.
        </Text>
      </View>

      {/* Permission Cards */}
      <View style={styles.cardsList}>
        {/* 1. Precise Location */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>📍</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Precise Location</Text>
              <Text style={styles.cardDesc}>
                Enables outdoor workout route mapping, elevation tracking, and live pace data.
              </Text>
            </View>
          </View>
          <View style={styles.cardActionRow}>
            {locationStatus === 'granted' ? (
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>✓ Precise GPS Enabled</Text>
              </View>
            ) : locationStatus === 'denied' ? (
              <View style={styles.badgeDenied}>
                <Text style={styles.badgeDeniedText}>Location Denied</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.enableButton}
                activeOpacity={0.7}
                onPress={requestPreciseLocation}
                disabled={isLoading}
              >
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2. Notifications */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🔔</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Smart Notifications</Text>
              <Text style={styles.cardDesc}>
                Gentle nudges to close rings, hydration reminders, and milestone celebrations.
              </Text>
            </View>
          </View>
          <View style={styles.cardActionRow}>
            {notificationStatus === 'granted' ? (
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>✓ Notifications Active</Text>
              </View>
            ) : notificationStatus === 'denied' ? (
              <View style={styles.badgeDenied}>
                <Text style={styles.badgeDeniedText}>Alerts Denied</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.enableButton}
                activeOpacity={0.7}
                onPress={requestNotifications}
                disabled={isLoading}
              >
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Smartwatch Sync */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⌚</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Apple Watch & HealthKit</Text>
              <Text style={styles.cardDesc}>
                Synchronize heart rate, real-time calories, step cadence, and workout metrics.
              </Text>
            </View>
          </View>
          <View style={styles.cardActionRow}>
            {smartwatchStatus === 'granted' ? (
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>
                  ✓ {smartwatchData?.deviceName ?? 'Wearable Paired'}
                </Text>
              </View>
            ) : smartwatchStatus === 'denied' ? (
              <View style={styles.badgeDenied}>
                <Text style={styles.badgeDeniedText}>Sync Unavailable</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.enableButton}
                activeOpacity={0.7}
                onPress={() => initializeSmartwatch()}
                disabled={isLoading}
              >
                <Text style={styles.enableButtonText}>Connect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Quick Allow All Action */}
      {!allCompleted && (
        <TouchableOpacity
          style={styles.allowAllButton}
          activeOpacity={0.7}
          onPress={() => requestAll()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <Text style={styles.allowAllButtonText}>Grant All Recommended Permissions</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Navigation Buttons */}
      <View style={styles.footerButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.7}
          onPress={onBack}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, !allCompleted && styles.primaryButtonMuted]}
          activeOpacity={0.8}
          onPress={onNext}
        >
          <Text style={styles.primaryButtonText}>
            {allCompleted ? 'Continue' : 'Skip for Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default PermissionsStep;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#8E8E93',
  },
  cardsList: {
    gap: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconText: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8E8E93',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  enableButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  badgeSuccess: {
    backgroundColor: '#E4F9E5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeSuccessText: {
    color: '#34C759',
    fontSize: 13,
    fontWeight: '600',
  },
  badgeDenied: {
    backgroundColor: '#FFEBEA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeDeniedText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
  },
  allowAllButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: '#F0F8FF',
  },
  allowAllButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonMuted: {
    backgroundColor: '#007AFF',
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
