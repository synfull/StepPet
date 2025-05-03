import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '../screens/Onboarding';
import MainNavigator from './MainNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const ONBOARDING_STORAGE_KEY = '@has_completed_onboarding';

const AppNavigator: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null); // null state while loading
  console.log(`[AppNavigator] Rendering. showOnboarding: ${showOnboarding}`); // Log render state

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasCompleted = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        // Show onboarding if the flag is null/false, otherwise don't show it
        setShowOnboarding(hasCompleted !== 'true'); 
      } catch (error) {
        console.error('Error reading onboarding status:', error);
        // Default to showing onboarding if there's an error reading storage
        setShowOnboarding(true);
      }
    };

    checkOnboardingStatus();
  }, []);

  const handleCompleteOnboarding = async () => {
    console.log('[AppNavigator] handleCompleteOnboarding called');
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Optionally show an error to the user
    }
  };

  // Show loading indicator while checking storage
  if (showOnboarding === null) {
    console.log('[AppNavigator] Rendering Loading Indicator');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (showOnboarding) {
    console.log('[AppNavigator] Rendering Onboarding');
    return <Onboarding completeOnboarding={handleCompleteOnboarding} />;
  } else {
    console.log('[AppNavigator] Rendering MainNavigator');
    return <MainNavigator />;
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator; 