import React, { useState, useEffect, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PedometerContext } from './src/context/PedometerContext';
import { DataProvider, useData } from './src/context/DataContext';
import { GemProvider } from './src/context/GemContext';
import { InventoryProvider } from '@context/InventoryContext';
import { UserProvider } from './src/context/UserContext';
import MainNavigator from '@navigation/MainNavigator';
import Onboarding from '@screens/Onboarding';
import { View, ActivityIndicator, Text, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { 
  fetchDailySteps, 
  fetchWeeklySteps, 
  pedoInit 
} from '@utils/pedometerUtils';
import { PetData } from './src/types/petTypes';
import { RegistrationStatus } from './src/types/userTypes';
import { AuthProvider } from './src/context/AuthContext';
import * as Linking from 'expo-linking';
import { NotificationProvider } from './src/context/NotificationContext';
import { Pedometer } from 'expo-sensors';
import Purchases from 'react-native-purchases';
import analytics from '@react-native-firebase/analytics'; // Import analytics
import firebase from '@react-native-firebase/app'; // <-- Import Firebase App

// Keep the splash screen visible until we're fully ready
SplashScreen.preventAutoHideAsync();

const linking = {
  prefixes: ['steppet://'],
  config: {
    screens: {
      Login: 'login',
      Registration: 'registration',
      Main: 'main',
      auth: {
        path: 'auth/callback',
        parse: {
          token: (token: string) => token,
        },
      },
    },
  },
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

// --- PASTE YOUR KEYS HERE ---
const APPLE_API_KEY = 'appl_thURISdMzCDMIJRfZJyYDcsYqZm'; // Updated Apple Key
const GOOGLE_API_KEY = 'goog_YKKvIwNcCFxemlhJsKBhYmGxnyH'; // Updated Google Key
// ---------------------------

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

  // Initialize Firebase (Relying on native auto-initialization)
  useEffect(() => {
    if (firebase.apps.length === 0) {
      console.log('[Firebase] Native initialization pending...');
      // We removed the explicit initializeApp call here.
      // The native layer should initialize automatically if config files are correct.
      // We add a small delay check just for logging purposes.
      const checkInterval = setInterval(() => {
        if (firebase.apps.length > 0) {
          console.log('[Firebase] Native initialization complete (detected).');
          clearInterval(checkInterval);
        }
      }, 500); // Check every 500ms
      
      // Set a timeout to stop checking after a while
      const checkTimeout = setTimeout(() => {
        if(firebase.apps.length === 0) {
           console.warn('[Firebase] Native initialization did not complete after timeout.');
        }
        clearInterval(checkInterval); // Ensure interval is cleared
      }, 5000); // Stop checking after 5 seconds
      
      // Cleanup interval and timeout on component unmount
      return () => {
        clearInterval(checkInterval);
        clearTimeout(checkTimeout);
      };
      
    } else {
      console.log('[Firebase] Already initialized (detected on mount).');
    }
  }, []);

  // Initialize app data
  useEffect(() => {
    async function initializeApp() {
      try {
        // First check onboarding status
        const onboardingValue = await AsyncStorage.getItem('@onboarding_complete');
        const isComplete = onboardingValue === 'true';
        setIsOnboardingComplete(isComplete);
        setHasCheckedOnboarding(true);

        // Only initialize pedometer if onboarding is complete
        if (isComplete) {
          // Initialize pedometer
          const available = await pedoInit();
          setIsAvailable(available);
          
          // NOTE: Initial step state (daily, weekly, total) remains 0 here.
          // The first calculation will be triggered by Home.tsx when petData is ready.
          
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

  // Initialize RevenueCat
  useEffect(() => {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.VERBOSE);
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: APPLE_API_KEY });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: GOOGLE_API_KEY });
    }
    console.log('RevenueCat SDK configured.');
  }, []);

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_complete', 'true');
      setIsOnboardingComplete(true);
      
      // Log onboarding_complete event
      try {
        await analytics().logEvent('onboarding_complete');
        console.log('[Analytics] Logged onboarding_complete event');
      } catch (analyticsError) {
        console.error('[Analytics] Error logging onboarding_complete event:', analyticsError);
      }

      // Initialize pedometer after completing onboarding
      const available = await pedoInit();
      setIsAvailable(available);
      
      if (available) {
        // Fetch daily steps
        const daily = await fetchDailySteps();

        // Initialize calculated steps
        let initialAdjustedTotalSteps = 0;

        // Get pet data from storage
        const petDataStr = await AsyncStorage.getItem('@pet_data');
        const petData = petDataStr ? JSON.parse(petDataStr) : null;

        // Calculate initial adjusted total steps if pet data is available
        if (petData && petData.created) {
          const petCreationTime = new Date(petData.created);
          const startingStepCount = petData.startingStepCount || 0;
          try {
            // Get raw steps since creation
            const { steps: rawStepsSinceCreation } = await Pedometer.getStepCountAsync(
              petCreationTime,
              new Date()
            );
            // Calculate the adjusted steps
            initialAdjustedTotalSteps = Math.max(0, rawStepsSinceCreation - startingStepCount);
          } catch (pedometerError) {
            console.error('Error fetching initial steps from Pedometer:', pedometerError);
            // Optionally try to load from storage as a fallback?
            // For now, will default to 0 if Pedometer fails
          }
        }

        // Update state: Set daily, and set both weekly and total to the calculated adjusted value
        setDailySteps(daily);
        setWeeklySteps(initialAdjustedTotalSteps);
        setTotalSteps(initialAdjustedTotalSteps);
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
    <AuthProvider>
      <UserProvider>
        <DataProvider>
          <PedometerContext.Provider value={pedometerValue}>
            <GemProvider>
              <InventoryProvider>
                <NotificationProvider>
                  <SafeAreaProvider style={{ backgroundColor: '#FFFFFF' }}>
                    <StatusBar style="dark" />
                    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} onLayout={onLayoutRootView}>
                      <NavigationContainer linking={linking}>
                        {!fontsLoaded ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#8C52FF" />
                          </View>
                        ) : isOnboardingComplete === false ? (
                          <Onboarding completeOnboarding={completeOnboarding} />
                        ) : (
                          <MainNavigator />
                        )}
                      </NavigationContainer>
                    </SafeAreaView>
                  </SafeAreaProvider>
                </NotificationProvider>
              </InventoryProvider>
            </GemProvider>
          </PedometerContext.Provider>
        </DataProvider>
      </UserProvider>
    </AuthProvider>
  );
}