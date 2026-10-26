import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useOnboardingState } from './hooks/useOnboradingState';
import { OnboardingFlow } from './onboarding';
import { HomeScreen } from './tabs/HomeScreen';

export default function App() {
  const {
    hasCompletedOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  } = useOnboardingState();

  // Show splash / loading state while inspecting persistent storage
  if (isLoading || hasCompletedOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <StatusBar style="auto" />
      </View>
    );
  }

  // First open: show onboarding flow
  if (!hasCompletedOnboarding) {
    return (
      <View style={styles.rootContainer}>
        <OnboardingFlow onComplete={completeOnboarding} />
        <StatusBar style="dark" />
      </View>
    );
  }

  // Subsequent opens: user has already completed onboarding, show Home screen
  return (
    <View style={styles.rootContainer}>
      <HomeScreen onResetOnboarding={resetOnboarding} />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
