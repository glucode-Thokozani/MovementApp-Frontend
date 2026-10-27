import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { OnboardingAnswers } from '../hooks/useOnboradingState';

interface QuestionsProps {
  answers: OnboardingAnswers;
  onChange: (partial: Partial<OnboardingAnswers>) => void;
  onNext: () => void;
}

const GOAL_OPTIONS = [
  { id: 'improve_fitness', title: 'Improve Overall Fitness', subtitle: 'Build stamina and daily vitality' },
  { id: 'track_workouts', title: 'Track Outdoor & Gym Workouts', subtitle: 'Accurate GPS & heart rate monitoring' },
  { id: 'stay_active', title: 'Stay Active Daily', subtitle: 'Close movement rings and maintain streaks' },
];

const ACTIVITY_LEVELS = [
  { id: 'beginner', title: 'Light', desc: '1–2 days/week' },
  { id: 'moderate', title: 'Moderate', desc: '3–4 days/week' },
  { id: 'active', title: 'Intense', desc: '5+ days/week' },
];

const DAILY_TARGETS = [20, 30, 45, 60];

export const QuestionsStep: React.FC<QuestionsProps> = ({ answers, onChange, onNext }) => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>STEP 1 OF 3</Text>
        <Text style={styles.title}>Your Movement Goal</Text>
        <Text style={styles.subtitle}>
          Tailor your daily targets and workout experience to your personal rhythm.
        </Text>
      </View>

      {/* Primary Goal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What is your primary focus?</Text>
        <View style={styles.cardGroup}>
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = answers.primaryGoal === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                activeOpacity={0.7}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => onChange({ primaryGoal: goal.id })}
              >
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {goal.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, isSelected && styles.cardSubtitleSelected]}>
                    {goal.subtitle}
                  </Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInnerCircle} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Activity Level Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Activity Level</Text>
        <View style={styles.horizontalRow}>
          {ACTIVITY_LEVELS.map((level) => {
            const isSelected = answers.activityLevel === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                activeOpacity={0.7}
                style={[styles.levelCard, isSelected && styles.levelCardSelected]}
                onPress={() => onChange({ activityLevel: level.id })}
              >
                <Text style={[styles.levelTitle, isSelected && styles.levelTitleSelected]}>
                  {level.title}
                </Text>
                <Text style={[styles.levelDesc, isSelected && styles.levelDescSelected]}>
                  {level.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Daily Target Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Active Time Target</Text>
        <View style={styles.horizontalRow}>
          {DAILY_TARGETS.map((mins) => {
            const isSelected = answers.dailyActiveMinutes === mins;
            return (
              <TouchableOpacity
                key={mins}
                activeOpacity={0.7}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => onChange({ dailyActiveMinutes: mins })}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {mins} min
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Continue CTA */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.primaryButton}
        onPress={onNext}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default QuestionsStep;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 28,
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
  section: {
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  cardGroup: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: '#EBF5FF',
    borderColor: '#007AFF',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: '#007AFF',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  cardSubtitleSelected: {
    color: '#3A82F6',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#007AFF',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  horizontalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  levelCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  levelCardSelected: {
    backgroundColor: '#EBF5FF',
    borderColor: '#007AFF',
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  levelTitleSelected: {
    color: '#007AFF',
  },
  levelDesc: {
    fontSize: 11,
    color: '#8E8E93',
  },
  levelDescSelected: {
    color: '#3A82F6',
  },
  pill: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
