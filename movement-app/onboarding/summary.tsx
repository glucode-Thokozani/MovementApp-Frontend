import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { OnboardingAnswers } from '../hooks/useOnboradingState';

interface SummaryStepProps {
  answers: OnboardingAnswers;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
  answers,
  onComplete,
  onBack,
  isLoading = false,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>STEP 3 OF 3</Text>
        <Text style={styles.title}>All Set to Move</Text>
        <Text style={styles.subtitle}>
          Your personalized movement dashboard is configured and ready.
        </Text>
      </View>

      {/* Hero Apple-Style Metric Card */}
      <View style={styles.heroCard}>
        <View style={styles.ringGraphic}>
          <Text style={styles.ringText}>{answers.dailyActiveMinutes}</Text>
          <Text style={styles.ringSubtext}>MIN / DAY</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.heroTitle}>Daily Move Target</Text>
          <Text style={styles.heroDesc}>
            Targeting {answers.dailyActiveMinutes} active minutes every day to build momentum.
          </Text>
        </View>
      </View>

      {/* Summary Grid */}
      <View style={styles.summaryList}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Primary Focus</Text>
          <Text style={styles.summaryValue}>
            {answers.primaryGoal === 'improve_fitness'
              ? 'Improve Fitness'
              : answers.primaryGoal === 'track_workouts'
              ? 'Track Workouts & GPS'
              : 'Daily Activity & Rings'}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Intensity Level</Text>
          <Text style={styles.summaryValue}>
            {answers.activityLevel.toUpperCase()}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Hardware Bridge</Text>
          <Text style={styles.summaryValue}>Apple HealthKit & GPS</Text>
        </View>
      </View>

      {/* Privacy Callout */}
      <View style={styles.privacyCallout}>
        <Text style={styles.privacyIcon}>🔒</Text>
        <Text style={styles.privacyText}>
          Your health and movement data stays encrypted on your device and inside Apple HealthKit.
        </Text>
      </View>

      {/* CTA Buttons */}
      <View style={styles.footerButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.7}
          onPress={onBack}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={onComplete}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Setting Up...' : 'Start Moving'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SummaryStep;

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
  heroCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 22,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  ringGraphic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#FF2D55',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  ringText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  ringSubtext: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FF2D55',
    letterSpacing: 0.8,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#A1A1A6',
  },
  summaryList: {
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  privacyCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 28,
  },
  privacyIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#8E8E93',
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
