import React from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useOnboardingState } from '../hooks/useOnboradingState';
import { QuestionsStep } from './questions';
import { PermissionsStep } from './permissions';
import { SummaryStep } from './summary';

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const {
    currentStep,
    totalSteps,
    answers,
    updateAnswers,
    nextStep,
    prevStep,
    completeOnboarding,
    isLoading,
  } = useOnboardingState();

  const handleComplete = async () => {
    await completeOnboarding();
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Apple-Style Progress Header */}
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }).map((_, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <View
                key={index}
                style={[
                  styles.progressBar,
                  isCurrent && styles.progressBarCurrent,
                  isCompleted && styles.progressBarCompleted,
                ]}
              />
            );
          })}
        </View>

        {/* Step Views */}
        <View style={styles.stepContent}>
          {currentStep === 0 && (
            <QuestionsStep
              answers={answers}
              onChange={updateAnswers}
              onNext={nextStep}
            />
          )}

          {currentStep === 1 && (
            <PermissionsStep
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 2 && (
            <SummaryStep
              answers={answers}
              onComplete={handleComplete}
              onBack={prevStep}
              isLoading={isLoading}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingFlow;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5EA',
  },
  progressBarCurrent: {
    backgroundColor: '#007AFF',
  },
  progressBarCompleted: {
    backgroundColor: '#34C759',
  },
  stepContent: {
    flex: 1,
  },
});
