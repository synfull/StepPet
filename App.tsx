import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PedometerContext } from '@context/PedometerContext';
import { DataContext } from '@context/DataContext';
import MainNavigator from '@navigation/MainNavigator';
import Onboarding from '@screens/Onboarding';
import { View, ActivityIndicator, Text } from 'react-native';
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

  // Check if onboarding is complete
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem('@onboarding_complete');
        setIsOnboardingComplete(value === 'true');
        setHasCheckedOnboarding(true);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setError('Failed to check onboarding status');
        setIsOnboardingComplete(false);
        setHasCheckedOnboarding(true);
      }
    }
    
    checkOnboarding();
  }, []);

  // Initialize pedometer
  useEffect(() => {
    async function initPedometer() {
      try {
        const available = await pedoInit();
        setIsAvailable(available);
        
        if (available) {
          const daily = await fetchDailySteps();
          const weekly = await fetchWeeklySteps();
          
          setDailySteps(daily);
          setWeeklySteps(weekly);
          
          // Get total steps from storage
          const storedTotal = await AsyncStorage.getItem('@total_steps');
          if (storedTotal) {
            setTotalSteps(parseInt(storedTotal, 10));
          }
        }
      } catch (error) {
        console.error('Pedometer initialization error:', error);
        setError('Failed to initialize pedometer');
      } finally {
        setLoading(false);
      }
    }
    
    initPedometer();
  }, []);

  // Load pet data
  useEffect(() => {
    async function loadPetData() {
      try {
        const storedPetData = await AsyncStorage.getItem('@pet_data');
        if (storedPetData) {
          try {
            const parsedData = JSON.parse(storedPetData);
            // Validate the parsed data matches the PetData type
            if (parsedData && typeof parsedData === 'object' && 'id' in parsedData) {
              setPetData(parsedData as PetData);
            } else {
              console.error('Invalid pet data format');
              setError('Invalid pet data format');
            }
          } catch (parseError) {
            console.error('Error parsing pet data:', parseError);
            setError('Failed to parse pet data');
          }
        }
      } catch (error) {
        console.error('Error loading pet data:', error);
        setError('Failed to load pet data');
      }
    }
    
    loadPetData();
  }, []);

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_complete', 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setError('Failed to save onboarding status');
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

  if (!fontsLoaded || !hasCheckedOnboarding || loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8C52FF" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#FF3B30', textAlign: 'center' }}>{error}</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <StatusBar style="auto" />
        <PedometerContext.Provider value={pedometerValue}>
          <DataContext.Provider value={dataValue}>
            <NavigationContainer>
              {isOnboardingComplete ? (
                <MainNavigator />
              ) : (
                <Onboarding completeOnboarding={completeOnboarding} />
              )}
            </NavigationContainer>
          </DataContext.Provider>
        </PedometerContext.Provider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}