import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PedometerContext } from '@context/PedometerContext';
import { DataContext } from '@context/DataContext';
import { GemProvider } from '@context/GemContext';
import { InventoryProvider } from '@context/InventoryContext';
import MainNavigator from '@navigation/MainNavigator';
import Onboarding from '@screens/Onboarding';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { 
  fetchDailySteps, 
  fetchWeeklySteps, 
  pedoInit 
} from '@utils/pedometerUtils';
import { PetData } from './src/types/petTypes';

// Keep the splash screen visible until we're fully ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [dailySteps, setDailySteps] = useState(0);
  const [weeklySteps, setWeeklySteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [petData, setPetData] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load fonts
  const [fontsLoaded] = useFonts({
    'Caprasimo-Regular': require('./assets/fonts/Caprasimo-Regular.ttf'),
    'Montserrat-Bold': require('./assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-Medium': require('./assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-Regular': require('./assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-SemiBold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
  });

  // Initialize app data
  useEffect(() => {
    async function initializeApp() {
      try {
        // First check onboarding status
        const onboardingValue = await AsyncStorage.getItem('@onboarding_complete');
        const isComplete = onboardingValue === 'true';
        setIsOnboardingComplete(isComplete);
        setHasCheckedOnboarding(true);

        // Only load pet data and initialize pedometer if onboarding is complete
        if (isComplete) {
          // Initialize pedometer
          const available = await pedoInit();
          setIsAvailable(available);
          
          if (available) {
            const daily = await fetchDailySteps();
            const weekly = await fetchWeeklySteps();
            
            // Load pet data
            const storedPetData = await AsyncStorage.getItem('@pet_data');
            if (storedPetData) {
              const parsedPetData = JSON.parse(storedPetData);
              setPetData(parsedPetData);
              
              // Calculate relative steps
              const startingStepCount = parsedPetData.startingStepCount || 0;
              const relativeDaily = Math.max(0, daily - startingStepCount);
              const relativeWeekly = Math.max(0, weekly - startingStepCount);
              
              setDailySteps(relativeDaily);
              setWeeklySteps(relativeWeekly);
              
              // Get total steps from storage
              const storedTotal = await AsyncStorage.getItem('@total_steps');
              if (storedTotal) {
                setTotalSteps(parseInt(storedTotal, 10));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setError('Failed to initialize app');
        setIsOnboardingComplete(false);
        setHasCheckedOnboarding(true);
      } finally {
        setLoading(false);
      }
    }
    
    initializeApp();
  }, []);

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_complete', 'true');
      setIsOnboardingComplete(true);
      
      // Initialize pedometer after completing onboarding
      const available = await pedoInit();
      setIsAvailable(available);
      
      if (available) {
        const daily = await fetchDailySteps();
        const weekly = await fetchWeeklySteps();
        setDailySteps(daily);
        setWeeklySteps(weekly);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Failed to complete onboarding');
    }
  };

  // Set up pedometer context value
  const pedometerValue = {
    isAvailable,
    currentSteps,
    dailySteps,
    weeklySteps,
    totalSteps,
    setCurrentSteps,
    setDailySteps,
    setWeeklySteps,
    setTotalSteps,
  };

  // Set up data context value
  const dataValue = {
    petData,
    setPetData,
  };
  
  // Handle layout effect for hiding splash screen
  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded && hasCheckedOnboarding && !loading) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hasCheckedOnboarding, loading]);

  // Render loading screen
  if (loading || !fontsLoaded || !hasCheckedOnboarding) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#8C52FF" />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider style={{ backgroundColor: '#FFFFFF' }}>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#FF3B30', textAlign: 'center' }}>{error}</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" />
      <NavigationContainer
        onStateChange={(state) => {
          // Force any modals to be cleaned up when navigation state changes
          requestAnimationFrame(() => {
            if (state?.routes) {
              // No-op, just ensuring state updates are processed
            }
          });
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} onLayout={onLayoutRootView}>
          <PedometerContext.Provider value={pedometerValue}>
            <DataContext.Provider value={dataValue}>
              <GemProvider>
                <InventoryProvider>
                  {isOnboardingComplete ? (
                    <MainNavigator />
                  ) : (
                    <Onboarding completeOnboarding={completeOnboarding} />
                  )}
                </InventoryProvider>
              </GemProvider>
            </DataContext.Provider>
          </PedometerContext.Provider>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}