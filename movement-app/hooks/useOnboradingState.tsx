import { useState, useEffect, useCallback } from 'react';
import {
  storageService as defaultStorageService,
  IStorageService,
  STORAGE_KEYS,
} from '../services/storageService';

export interface OnboardingAnswers {
  primaryGoal: string;
  activityLevel: string;
  dailyActiveMinutes: number;
  workoutPreferences: string[];
}

export const DEFAULT_ONBOARDING_ANSWERS: OnboardingAnswers = {
  primaryGoal: 'improve_fitness',
  activityLevel: 'moderate',
  dailyActiveMinutes: 30,
  workoutPreferences: ['Running', 'Outdoor Walking'],
};

export interface UseOnboardingStateReturn {
  hasCompletedOnboarding: boolean | null; // null while loading initial state
  isLoading: boolean;
  currentStep: number;
  totalSteps: number;
  answers: OnboardingAnswers;
  updateAnswers: (partial: Partial<OnboardingAnswers>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

/**
 * Custom hook to manage persistent onboarding state across app sessions.
 * Follows Dependency Inversion (DIP) by accepting an injectable IStorageService.
 */
export function useOnboardingState(
  storage: IStorageService = defaultStorageService
): UseOnboardingStateReturn {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(DEFAULT_ONBOARDING_ANSWERS);

  const totalSteps = 3; // 0: Questions, 1: Permissions, 2: Summary

  // Load persistent onboarding status upon initial mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialState() {
      try {
        const [completedValue, savedAnswers] = await Promise.all([
          storage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
          storage.getItem(STORAGE_KEYS.ONBOARDING_DATA),
        ]);

        if (!isMounted) return;

        const isCompleted = completedValue === 'true';
        setHasCompletedOnboarding(isCompleted);

        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers));
          } catch {
            // Use defaults if parse fails
          }
        }
      } catch (error) {
        console.warn('[useOnboardingState] Failed to retrieve onboarding state:', error);
        if (isMounted) setHasCompletedOnboarding(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialState();

    return () => {
      isMounted = false;
    };
  }, [storage]);

  const updateAnswers = useCallback(
    (partial: Partial<OnboardingAnswers>) => {
      setAnswers((prev) => {
        const updated = { ...prev, ...partial };
        // Asynchronously persist partial answers
        storage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(updated)).catch(() => null);
        return updated;
      });
    },
    [storage]
  );

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const completeOnboarding = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        storage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, 'true'),
        storage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(answers)),
      ]);
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('[useOnboardingState] Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  }, [answers, storage]);

  const resetOnboarding = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        storage.removeItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
        storage.removeItem(STORAGE_KEYS.ONBOARDING_DATA),
      ]);
      setCurrentStep(0);
      setAnswers(DEFAULT_ONBOARDING_ANSWERS);
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('[useOnboardingState] Error resetting onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  return {
    hasCompletedOnboarding,
    isLoading,
    currentStep,
    totalSteps,
    answers,
    updateAnswers,
    nextStep,
    prevStep,
    goToStep,
    completeOnboarding,
    resetOnboarding,
  };
}

// Alias for existing file naming convention
export { useOnboardingState as useOnboradingState };
export default useOnboardingState;
