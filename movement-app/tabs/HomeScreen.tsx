import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

interface HomeScreenProps {
  onResetOnboarding?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onResetOnboarding }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{currentDate}</Text>
            <Text style={styles.titleText}>Movement</Text>
          </View>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>M</Text>
          </View>
        </View>

        {/* Activity Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Daily Activity</Text>
            <Text style={styles.cardHeaderAction}>Details ›</Text>
          </View>

          <View style={styles.metricsRow}>
            {/* Move */}
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: '#FF2D55' }]}>MOVE</Text>
              <Text style={styles.metricValue}>340</Text>
              <Text style={styles.metricUnit}>/ 500 CAL</Text>
            </View>

            {/* Exercise */}
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: '#34C759' }]}>EXERCISE</Text>
              <Text style={styles.metricValue}>24</Text>
              <Text style={styles.metricUnit}>/ 30 MIN</Text>
            </View>

            {/* Stand */}
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: '#007AFF' }]}>STAND</Text>
              <Text style={styles.metricValue}>8</Text>
              <Text style={styles.metricUnit}>/ 12 HRS</Text>
            </View>
          </View>
        </View>

        {/* Hardware & Sync Status Card */}
        <View style={styles.darkCard}>
          <Text style={styles.darkCardEyebrow}>DEVICE & SENSORS</Text>
          <Text style={styles.darkCardTitle}>Hardware Synchronized</Text>
          <Text style={styles.darkCardSubtitle}>
            GPS high-precision tracking, Apple HealthKit integration, and push reminders are active.
          </Text>

          <View style={styles.sensorRow}>
            <View style={styles.sensorPill}>
              <Text style={styles.sensorDot}>●</Text>
              <Text style={styles.sensorText}>GPS High Precision</Text>
            </View>
            <View style={styles.sensorPill}>
              <Text style={styles.sensorDot}>●</Text>
              <Text style={styles.sensorText}>Apple Watch Linked</Text>
            </View>
          </View>
        </View>

        {/* Quick Workout Launch Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start a Workout</Text>
          <View style={styles.workoutGrid}>
            <TouchableOpacity style={styles.workoutCard} activeOpacity={0.7}>
              <Text style={styles.workoutIcon}>🏃‍♂️</Text>
              <Text style={styles.workoutName}>Outdoor Run</Text>
              <Text style={styles.workoutMeta}>GPS Route On</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.workoutCard} activeOpacity={0.7}>
              <Text style={styles.workoutIcon}>🚶‍♀️</Text>
              <Text style={styles.workoutName}>Outdoor Walk</Text>
              <Text style={styles.workoutMeta}>Cadence & Heart</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.workoutCard} activeOpacity={0.7}>
              <Text style={styles.workoutIcon}>🚴</Text>
              <Text style={styles.workoutName}>Cycling</Text>
              <Text style={styles.workoutMeta}>Speed & Pace</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.workoutCard} activeOpacity={0.7}>
              <Text style={styles.workoutIcon}>🧘</Text>
              <Text style={styles.workoutName}>Cooldown</Text>
              <Text style={styles.workoutMeta}>Mind & Recovery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings / Reset Onboarding Option */}
        {onResetOnboarding && (
          <View style={styles.resetContainer}>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.7}
              onPress={onResetOnboarding}
            >
              <Text style={styles.resetButtonText}>Reset Onboarding (First-Launch Demo)</Text>
            </TouchableOpacity>
            <Text style={styles.resetHelpText}>
              Clears persistent storage and re-opens the initial onboarding sequence.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  profileBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  profileBadgeText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardHeaderAction: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 2,
  },
  darkCard: {
    backgroundColor: '#151517',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginBottom: 24,
  },
  darkCardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  darkCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  darkCardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8E8E93',
    marginBottom: 14,
  },
  sensorRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sensorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242426',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  sensorDot: {
    color: '#34C759',
    fontSize: 10,
    marginRight: 6,
  },
  sensorText: {
    color: '#E5E5EA',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workoutCard: {
    width: '48%',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
  },
  workoutIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  workoutMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },
  resetContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  resetButtonText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  resetHelpText: {
    color: '#636366',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
});
