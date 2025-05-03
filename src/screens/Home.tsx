import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  RefreshControl,
  Alert,
  Easing,
  AppState
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pedometer } from 'expo-sensors';
import { useData } from '../context/DataContext';
import { PedometerContext } from '../context/PedometerContext';
import { RootStackParamList } from '../types/navigationTypes';
import { 
  getRandomPetType, 
  updatePetWithSteps, 
  savePetData, 
  LEVEL_REQUIREMENTS,
  loadPetData,
  createNewPet,
  PET_TYPES 
} from '../utils/petUtils';
import { fetchDailySteps, fetchWeeklySteps, subscribeToPedometer } from '../utils/pedometerUtils';
import { isSameDay, getTodayDateString } from '../utils/dateUtils';
import { playSound } from '../utils/soundUtils';
import PetDisplay from '../components/PetDisplay';
import ProgressBar from '../components/ProgressBar';
import MiniGameCard from '../components/MiniGameCard';
import Button from '../components/Button';
import { PetData, GrowthStage, MiniGames } from '../types/petTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { sendEggHatchingNotification } from '../utils/notificationUtils';
import { supabase } from '../lib/supabase';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GemBalance } from '../components/GemBalance';
import analytics from '@react-native-firebase/analytics';
import { useAuth } from '../context/AuthContext';

// Define the background task
const BACKGROUND_FETCH_TASK = 'background-fetch-task';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('Background task started at:', new Date().toISOString());
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.log('No user session in background task');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Load pet data
    const petData = await loadPetData();
    if (!petData) {
      console.log('No pet data found in background task');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    if (petData.growthStage !== 'Egg') {
      console.log('Pet is not an egg, skipping check');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log('Checking egg hatching status for:', petData.name);
    
    // Get current steps
    const petCreationTime = new Date(petData.created);
    const dailySteps = await fetchDailySteps(petCreationTime, petData.startingStepCount || 0);
    const stepsSinceCreation = Math.max(0, dailySteps - (petData.startingStepCount || 0));
    
    console.log('Steps since creation:', stepsSinceCreation);
    console.log('Steps needed to hatch:', petData.stepsToHatch);

    // Check if egg is ready to hatch
    if (stepsSinceCreation >= petData.stepsToHatch) {
      console.log('Egg is ready to hatch!');
      // Check if we've already sent a notification for this egg
      const hasSentNotification = await AsyncStorage.getItem(`egg_hatching_notification_${petData.id}`);
      if (!hasSentNotification) {
        console.log('Sending hatching notification...');
        
        // Schedule a local notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Egg Ready to Hatch!',
            body: `Your ${petData.name} is ready to hatch! Tap to meet your new pet.`,
            data: { 
              type: 'pet',
              petId: petData.id,
              petName: petData.name
            },
          },
          trigger: null, // Send immediately
        });
        
        // Also send the push notification
        await sendEggHatchingNotification(session.user.id, petData.name);
        await AsyncStorage.setItem(`egg_hatching_notification_${petData.id}`, 'true');
        console.log('Hatching notification sent');
      } else {
        console.log('Notification already sent for this egg');
      }
    } else {
      console.log('Egg not ready to hatch yet');
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define keysToSnakeCase locally for now
const keysToSnakeCase = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(keysToSnakeCase);
    }
    return Object.keys(obj).reduce((acc, key) => {
        const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        acc[snakeCaseKey] = keysToSnakeCase(obj[key]);
        return acc;
    }, {} as any);
};

const Home: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const { petData, setPetData, isLoading, reloadData } = useData();
  const { user } = useAuth();
  const { 
    isAvailable, 
    dailySteps, 
    weeklySteps, 
    totalSteps,
    setDailySteps,
    setWeeklySteps,
    setTotalSteps
  } = useContext(PedometerContext);
  const [showPulseHint, setShowPulseHint] = useState(false);
  const [hasInteractedWithPet, setHasInteractedWithPet] = useState(false);
  const [isPetAnimating, setIsPetAnimating] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const eggShakeAnim = useRef(new Animated.Value(0)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  const appState = useRef(AppState.currentState);
  
  const lastStepUpdate = useRef<number>(0);
  const STEP_UPDATE_INTERVAL = 1000; // 1 second minimum between updates
  
  const [lastKnownDate, setLastKnownDate] = useState(new Date().getDate());
  
  // Welcome screen animations
  useEffect(() => {
    if (!petData) {
      // Start fade-in
      const fadeIn = Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      });

      // Start button pulse loop (after a short delay? or parallel?)
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(buttonPulseAnim, {
            toValue: 1.05, // Scale up slightly
            duration: 700,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(buttonPulseAnim, {
            toValue: 1, // Scale back down
            duration: 700,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );

      // Run animations
      Animated.parallel([fadeIn, pulse]).start();
    } else {
      // Optional: Reset animations if petData loads?
      fadeAnim.setValue(0);
      buttonPulseAnim.setValue(1);
    }
  }, [petData]);
  
  // ---> MODIFIED: Trigger initial step refresh only ONCE when petData is loaded <--- 
  useEffect(() => {
    // Only run if petData exists AND initial load hasn't completed yet
    if (petData && !initialLoadComplete) {
      console.log('[Home.tsx] PetData loaded, triggering initial refreshStepData...');
      refreshStepData(); 
      setInitialLoadComplete(true); // Set flag to prevent re-running
    }
  }, [petData, initialLoadComplete]); // Add flag to dependency array
  // ---> END MODIFIED <---
  
  // Pedometer subscription
  useEffect(() => {
    if (isAvailable && petData) {
      const petCreationTime = new Date(petData.created);
      
      const subscription = subscribeToPedometer(async (steps: number) => {
        const now = Date.now();
        if (now - lastStepUpdate.current < STEP_UPDATE_INTERVAL) {
          return; // Skip update if too soon
        }
        lastStepUpdate.current = now;

        if (petData.growthStage === 'Egg') {
          console.log('[Pedometer Update - Egg]');
          const currentTime = new Date();
          console.log('Current Time:', currentTime.toISOString());
          console.log('Pet Creation Time:', petCreationTime.toISOString());
          console.log('Starting Step Count:', petData.startingStepCount);
          console.log('Current petData.totalSteps before calculation:', petData.totalSteps);
          
          const todayMidnight = new Date();
          todayMidnight.setHours(0, 0, 0, 0);
          const { steps: todayStepsRaw } = await Pedometer.getStepCountAsync(todayMidnight, currentTime);

          let todayStepsCalculated = 0;
          let totalStepsSinceCreation = 0;

          if (isSameDay(petCreationTime, currentTime)) {
              todayStepsCalculated = Math.max(0, todayStepsRaw - (petData.startingStepCount || 0));
              totalStepsSinceCreation = todayStepsCalculated;
              console.log(`[Pedometer Egg - TODAY] todayStepsCalc: ${todayStepsCalculated}, totalStepsSinceCreation: ${totalStepsSinceCreation}`);
          } else {
              todayStepsCalculated = todayStepsRaw;
              console.log(`[Pedometer Egg - BEFORE] Reading petData.totalStepsBeforeToday from state: ${petData?.totalStepsBeforeToday}`);
              totalStepsSinceCreation = (petData?.totalStepsBeforeToday || 0) + todayStepsRaw;
              console.log(`[Pedometer Egg - BEFORE] todayStepsCalc: ${todayStepsCalculated}, totalStepsBeforeToday: ${petData?.totalStepsBeforeToday || 0}, todayStepsRaw: ${todayStepsRaw}, Calculated totalStepsSinceCreation: ${totalStepsSinceCreation}`);
          }

          // 3. Update States
          console.log('Updating context: setDailySteps:', todayStepsCalculated, 'setTotalSteps:', totalStepsSinceCreation);
          setDailySteps(todayStepsCalculated);
          setTotalSteps(totalStepsSinceCreation);

          // 4. Update Pet Data (if changed)
          // Calculate delta for XP update
          const newStepsDelta = Math.max(0, totalStepsSinceCreation - (petData.totalSteps || 0));
          console.log(`[Pedometer Egg] Calculated newStepsDelta: ${newStepsDelta}`);
          
          // Update only if total steps actually changed
          if (newStepsDelta > 0) { 
             console.log('Updating petData state and saving...');
             const updatedPet = {
              ...petData,
              totalSteps: totalStepsSinceCreation,
              // FIX: Add delta to existing XP, don't overwrite
              xp: (petData.xp || 0) + newStepsDelta, 
              // FIX: Remove incorrect update to totalStepsBeforeToday
              // totalStepsBeforeToday: totalStepsSinceCreation 
              // Ensure the already correctly stored value is preserved:
              totalStepsBeforeToday: petData.totalStepsBeforeToday 
            };
            setPetData(updatedPet);
          } else {
            console.log('No step delta detected, petData not updated.');
          }
          console.log('[Pedometer Update - Egg End]');
        } else {
          // Logic for hatched pets
           const todayMidnight = new Date();
           todayMidnight.setHours(0, 0, 0, 0);
           const { steps: todayStepsRaw } = await Pedometer.getStepCountAsync(todayMidnight, new Date());
           // Calculate daily steps considering starting point ONLY if created today
           const startingStepCountForDaily = isSameDay(petCreationTime, new Date()) ? (petData.startingStepCount || 0) : 0;
           const todayStepsCalculated = Math.max(0, todayStepsRaw - startingStepCountForDaily);
           setDailySteps(todayStepsCalculated);
           
           // Calculate total steps since creation CORRECTLY
           const { steps: totalStepsRaw } = await Pedometer.getStepCountAsync(petCreationTime, new Date());
           let stepsSinceCreationCalculated = 0;
           if (isSameDay(petCreationTime, new Date())) {
              // Created TODAY: Subtract starting count
              stepsSinceCreationCalculated = Math.max(0, totalStepsRaw - (petData.startingStepCount || 0));
           } else {
              // Created BEFORE today: Raw value is the total since creation
              stepsSinceCreationCalculated = totalStepsRaw;
           }
           console.log(`[Pedometer Hatched v4] Calculated stepsSinceCreationCalculated: ${stepsSinceCreationCalculated} (Raw: ${totalStepsRaw}, SameDay: ${isSameDay(petCreationTime, new Date())})`);
           
           // Update totalSteps context if needed 
           if (stepsSinceCreationCalculated !== totalSteps) {
                setTotalSteps(stepsSinceCreationCalculated);
           }
             
           // Call updatePetWithSteps with petData from closure and CORRECT absolute steps since CREATION
           const { updatedPet: newPet, leveledUp } = await updatePetWithSteps(
               petData, 
               stepsSinceCreationCalculated // Pass CORRECT absolute steps since creation
           ); 
           setPetData(newPet); 
             
           if (leveledUp) {
             navigation.navigate('PetLevelUp', {
               level: newPet.level,
               petType: newPet.type
             });
           }
        }
      });

      return () => {
        subscription?.remove();
      };
    }
  }, [isAvailable, petData, setDailySteps, setTotalSteps, setPetData, navigation]);
  
  // Force update growth stage on mount
  useEffect(() => {
    const checkPaywallStatus = async () => {
      try {
        const paywallActive = await AsyncStorage.getItem('paywallActive');
        const hasSubscribed = await AsyncStorage.getItem('hasSubscribed');
        const hasNamedPet = await AsyncStorage.getItem('hasNamedPet');
        
        // Only show paywall if pet has been named and we're not in the egg stage
        if (paywallActive === 'true' && hasSubscribed !== 'true' && hasNamedPet === 'true' && petData?.growthStage !== 'Egg') {
          // Add a small delay to ensure we're fully back on the home screen
          setTimeout(() => {
            navigation.navigate('Paywall');
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking paywall status:', error);
      }
    };
    
    checkPaywallStatus();
    
    if (petData && petData.growthStage !== 'Egg') {
      // Force an update through updatePetWithSteps to correct growth stage
      updatePetWithSteps(petData, 0).then(({ updatedPet }) => {
        setPetData(updatedPet);
      });
    }
  }, [petData?.growthStage]); // Run when pet growth stage changes
  
  // Refresh data periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshStepData();
    }, 15 * 60 * 1000); // Refresh every 15 minutes
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Check if user has interacted before
  useEffect(() => {
    const checkInteractionStatus = async () => {
      try {
        const hasInteracted = await AsyncStorage.getItem('hasInteractedWithPet');
        setHasInteractedWithPet(!!hasInteracted);
      } catch (error) {
        console.error('Error checking interaction status:', error);
      }
    };
    checkInteractionStatus();
  }, []);
  
  // Show pulse hint and start animation after pet is named
  useEffect(() => {
    if (petData && petData.growthStage !== 'Egg' && !hasInteractedWithPet) {
      // For newly hatched pets, show hint immediately
      if (petData.level === 1) {
        setShowPulseHint(true);
        setIsPetAnimating(true);
        startPulseAnimation();
      } else {
        // For existing pets, keep the delay
        const timeoutId = setTimeout(() => {
          setShowPulseHint(true);
          setIsPetAnimating(true);
          startPulseAnimation();
        }, 5000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [petData, hasInteractedWithPet]);

  // Start animation when isPetAnimating changes
  useEffect(() => {
    if (isPetAnimating) {
      startPulseAnimation();
    }
  }, [isPetAnimating]);
  
  // Start pulse animation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  // Shake animation sequence
  const startShakeAnimations = () => {
    // Create egg shake sequence
    const eggShakeSequence = Animated.sequence([
      Animated.timing(eggShakeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(eggShakeAnim, {
        toValue: -1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(eggShakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);

    // Create button shake sequence
    const buttonShakeSequence = Animated.sequence([
      Animated.timing(buttonPulseAnim, {
        toValue: 2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPulseAnim, {
        toValue: -2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPulseAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);

    // Loop both animations
    Animated.loop(
      Animated.parallel([
        eggShakeSequence,
        buttonShakeSequence,
      ]),
      { iterations: -1 }
    ).start();
  };

  // Start shake animations when egg is ready to hatch
  useEffect(() => {
    if (petData?.growthStage === 'Egg' && petData.totalSteps >= petData.stepsToHatch) {
      startShakeAnimations();
    }
  }, [petData?.growthStage, petData?.totalSteps, petData?.stepsToHatch]);
  
  // Start floating animation when egg is present
  useEffect(() => {
    if (petData?.growthStage === 'Egg') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    }
  }, [petData?.growthStage]);
  
  // Refresh step data
  const refreshStepData = async () => {
    try {
      if (!petData) return;

      // console.warn('[Home.tsx - refreshStepData] --- SKIPPING PEDOMETER CALLS ---'); // Reverted

      const petCreationTime = new Date(petData.created);
      
      // --- TEMP: Comment out Pedometer calls --- // Reverted
      // /*
      // Get today's raw steps 
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      const { steps: todayStepsRaw } = await Pedometer.getStepCountAsync(todayMidnight, new Date());
      
      // Get weekly steps 
      const weeklyStepsCount = await fetchWeeklySteps(petCreationTime, petData.startingStepCount || 0);
      
      // Get total raw steps since creation timestamp
      const { steps: totalStepsRaw } = await Pedometer.getStepCountAsync(petCreationTime, new Date());
      // */
      // --- END TEMP --- // Reverted
      
      // --- TEMP: Hardcode values for testing --- // Reverted
      // const todayStepsRaw = 0;
      // const weeklyStepsCount = 0;
      // const totalStepsRaw = 0;
      // console.warn('[Home.tsx - refreshStepData] Using hardcoded step values (0)');
      // --- END TEMP --- // Reverted
      
      let dailyStepsToUpdate = 0;
      let totalStepsToUpdate = 0;
      let newStepsForUpdate = 0;

      if (petData.growthStage === 'Egg') {
        console.log('[Refresh - Egg]');
        const currentTime = new Date();
        console.log('Pet Creation Time:', petCreationTime.toISOString());
        console.log('Starting Step Count:', petData.startingStepCount);
        console.log('Current petData.totalSteps before calculation:', petData.totalSteps);
        
        // Calculate Today's Steps Correctly (for daily display)
        if (isSameDay(petCreationTime, currentTime)) {
          dailyStepsToUpdate = Math.max(0, todayStepsRaw - (petData.startingStepCount || 0));
        } else {
          dailyStepsToUpdate = todayStepsRaw;
        }
        console.log('Calculated dailyStepsToUpdate:', dailyStepsToUpdate);
        
        // Calculate TRUE Total Cumulative Steps
        if (isSameDay(petCreationTime, currentTime)) {
            // Egg created TODAY - Total is same as Today's calculated
            totalStepsToUpdate = dailyStepsToUpdate;
             console.log(`[Refresh Egg - TODAY] totalStepsToUpdate: ${totalStepsToUpdate}`);
        } else {
            // ** Log the value read from state **
            console.log(`[Refresh Egg - BEFORE] Reading petData.totalStepsBeforeToday from state: ${petData?.totalStepsBeforeToday}`);
            totalStepsToUpdate = (petData?.totalStepsBeforeToday || 0) + todayStepsRaw;
            console.log(`[Refresh Egg - BEFORE] Calculated totalStepsToUpdate: ${totalStepsToUpdate} using totalStepsBeforeToday: ${petData?.totalStepsBeforeToday || 0} and todayStepsRaw: ${todayStepsRaw}`);
        }
        
        console.log('[Refresh - Egg End]');
      } else {
        // Logic for hatched pets
        const startingStepCountForDaily = isSameDay(petCreationTime, new Date()) ? (petData.startingStepCount || 0) : 0;
        dailyStepsToUpdate = Math.max(0, todayStepsRaw - startingStepCountForDaily);

        // Calculate total steps since creation (cumulative) CORRECTLY
        let calculatedTotalSteps = 0;
        if (isSameDay(petCreationTime, new Date())) {
           // Created TODAY: Subtract starting count
           calculatedTotalSteps = Math.max(0, totalStepsRaw - (petData.startingStepCount || 0));
        } else {
           // Created BEFORE today: Raw value is the total since creation
           calculatedTotalSteps = totalStepsRaw;
        }
        totalStepsToUpdate = calculatedTotalSteps; // Assign to the variable used later
        console.log(`[Refresh Hatched v4] Calculated totalStepsToUpdate (stepsSinceCreation): ${totalStepsToUpdate} (Raw: ${totalStepsRaw}, SameDay: ${isSameDay(petCreationTime, new Date())})`);
      }

      // Update all step states with calculated values
      setDailySteps(dailyStepsToUpdate);
      setWeeklySteps(weeklyStepsCount);
      setTotalSteps(totalStepsToUpdate); 
      
      // Update Pet Data 
      if (petData.growthStage !== 'Egg') {
        // Pass the CORRECT ABSOLUTE steps since CREATION
        const { updatedPet: refreshedPet, leveledUp } = await updatePetWithSteps(
            petData, 
            totalStepsToUpdate // Pass correct absolute steps since creation
        );
        setPetData(refreshedPet); 
        
        if (leveledUp) {
          navigation.navigate('PetLevelUp', {
            level: refreshedPet.level,
            petType: refreshedPet.type
          });
        }
      } else if (petData.growthStage === 'Egg' /* ... Egg logic ... */ ) {
         // Update Egg state (steps, xp) without calling savePetData here
         const updatedEggPet = {
           ...petData,
           totalSteps: totalStepsToUpdate,
           xp: (petData.xp || 0) + (totalStepsToUpdate - (petData.totalSteps || 0)), // Add delta XP
         };
         setPetData(updatedEggPet);
         // The Pedometer listener already calls setPetData for eggs, so this might be redundant
         // await savePetData(updatedEggPet); // Remove this
      }
      
    } catch (error) { 
      console.error('Error refreshing step data:', error);
    }
  };
  
  // Pull-to-refresh handler
  const onRefresh = async () => {
    await refreshStepData();
  };
  
  // Clear all app data
  const clearAppData = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Reset all state
      setPetData(null);
      setDailySteps(0);
      setWeeklySteps(0);
      setTotalSteps(0);
      
      // Create a new pet with 0 steps instead of current steps
      const newPet = await createNewPet(0);
      setPetData(newPet);
      
      // Reset step counters to 0 since we're starting fresh
      setDailySteps(0);
      setWeeklySteps(0);
      setTotalSteps(0);
      
      return true;
    } catch (error) {
      console.error('Error clearing app data:', error);
      return false;
    }
  };
  
  // Handle tap on pet
  const handlePetTap = async () => {
    // Log pet_tap event at the beginning
    try {
      await analytics().logEvent('pet_tap', { 
        is_egg: petData?.growthStage === 'Egg' // Differentiate if it's an egg
      });
      console.log(`[Analytics] Logged pet_tap event (is_egg: ${petData?.growthStage === 'Egg'})`);
    } catch (analyticsError) {
      console.error('[Analytics] Error logging pet_tap event:', analyticsError);
    }

    if (showPulseHint) {
      setShowPulseHint(false);
      playSound('ui-tap');
      try {
        await AsyncStorage.setItem('hasInteractedWithPet', 'true');
        setHasInteractedWithPet(true);
      } catch (error) {
        console.error('Error saving interaction status:', error);
      }
    }
    
    if (petData?.growthStage === 'Egg') {
      if (petData.totalSteps >= petData.stepsToHatch) {
        try {
          // Get current user ID
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) {
            throw new Error('No user session found');
          }
          
          // Send egg hatching notification
          await sendEggHatchingNotification(session.user.id, petData.name);
          
          // Update pet data to reflect hatching
          const { type: randomPetType } = getRandomPetType();
          const now = new Date();
          const updatedPet = {
            ...petData,
            type: randomPetType,
            growthStage: 'Baby' as const,
            totalSteps: petData.stepsToHatch,
            stepsSinceHatched: 0,
            xp: 0,
            xpToNextLevel: LEVEL_REQUIREMENTS[0],
            hatchDate: getTodayDateString(),
            dailyStepsAtHatch: dailySteps,
            miniGames: {
              feed: {
                lastClaimed: null,
                claimedToday: false
              },
              fetch: {
                lastClaimed: null,
                claimsToday: 0
              },
              adventure: {
                lastStarted: now.toISOString(),
                lastCompleted: null,
                currentProgress: 0,
                isActive: true
              }
            },
            totalStepsBeforeToday: petData.totalStepsBeforeToday
          };
          
          // Log egg_hatch event
          try {
            await analytics().logEvent('egg_hatch', { 
              pet_type: updatedPet.type // Add pet_type parameter
            });
            console.log(`[Analytics] Logged egg_hatch event for type: ${updatedPet.type}`);
          } catch (analyticsError) {
            console.error('[Analytics] Error logging egg_hatch event:', analyticsError);
          }
          
          setPetData(updatedPet);

          navigation.navigate('PetHatching', { petType: updatedPet.type });

        } catch (error) {
          playSound('action-fail');
          console.error('Error hatching egg:', error);
          Alert.alert(
            'Error',
            'There was a problem hatching your egg. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        playSound('action-fail');
        Alert.alert(
          'Not Ready to Hatch',
          `Your egg needs ${Math.max(0, petData.stepsToHatch - petData.totalSteps).toLocaleString()} more steps to hatch! Keep walking to help it grow.`,
          [{ text: 'OK' }]
        );
      }
    } else {
      playSound('ui-tap');
      // Check if 200-step milestone is claimed
      const has200StepMilestone = petData?.milestones.some(m => m.id === '200_steps' && m.claimed);
      if (has200StepMilestone && petData) {
        // Trigger special animation
        navigation.navigate('PetDetails', { 
          petId: petData.id,
          showSpecialAnimation: true 
        });
      } else if (petData) {
        // Regular navigation without special animation
        navigation.navigate('PetDetails', { 
          petId: petData.id 
        });
      }
    }
  };
  
  // Handle mini game press
  const handleMiniGamePress = (game: 'feed' | 'fetch' | 'adventure') => {
    playSound('ui-tap');
    if (!petData || petData.growthStage === 'Egg') {
      playSound('action-fail');
      Alert.alert(
        'Pet Still in Egg',
        'Your pet needs to hatch before you can play mini-games!',
        [{ text: 'OK' }]
      );
      return;
    }
    
    switch (game) {
      case 'feed':
        handleFeedPet();
        break;
      case 'fetch':
        handleFetchGame();
        break;
      case 'adventure':
        handleAdventureWalk();
        break;
    }
  };
  
  // Handle feed pet
  const handleFeedPet = () => {
    if (!petData) return;
    
    // Check if already fed today
    const now = new Date();
    // Use optional chaining here
    const lastFed = petData?.miniGames?.feed?.lastClaimed ? new Date(petData.miniGames.feed.lastClaimed) : null;
    // Use optional chaining here
    if (lastFed && isSameDay(lastFed, now) && petData?.miniGames?.feed?.claimedToday) {
      Alert.alert('Already Fed', 'You have already fed your pet today!');
      return;
    }
    
    // Check if enough steps
    if (dailySteps < 2500) {
      playSound('action-fail');
      Alert.alert(
        'More Steps Needed',
        `You need 2,500 steps to feed your pet. You currently have ${dailySteps} steps.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Update pet data
    const updatedPet = { ...petData };
    updatedPet.miniGames.feed.lastClaimed = now.toISOString();
    updatedPet.miniGames.feed.claimedToday = true;
    
    // Save and update with XP reward
    updatePetWithSteps(updatedPet, 0, 100).then(async ({ updatedPet: newPet, leveledUp }) => {
      setPetData(newPet);
      playSound('activity-claim');
      
      // Log activity_feed_complete event
      try {
        await analytics().logEvent('activity_feed_complete');
        console.log('[Analytics] Logged activity_feed_complete event');
      } catch (analyticsError) {
        console.error('[Analytics] Error logging activity_feed_complete event:', analyticsError);
      }
      
      if (leveledUp) {
        Alert.alert(
          'Pet Fed',
          'Your pet is happy and well-fed! You earned 100 XP, which leveled up your pet!',
          [{ text: 'Great!' }]
        );
        
        navigation.navigate('PetLevelUp', { 
          level: newPet.level,
          petType: newPet.type 
        });
      } else {
        Alert.alert(
          'Pet Fed',
          'Your pet is happy and well-fed! You earned 100 XP.',
          [{ text: 'Great!' }]
        );
      }
    });
  };
  
  // Handle fetch game
  const handleFetchGame = () => {
    if (!petData) return;
    
    // Check fetch claims today
    const MAX_FETCH_CLAIMS = 3;
    // Use optional chaining and nullish coalescing
    const fetchClaimsToday = petData?.miniGames?.fetch?.claimsToday ?? 0;
    const canFetchToday = fetchClaimsToday < MAX_FETCH_CLAIMS;
    
    if (!canFetchToday) {
      playSound('action-fail');
      Alert.alert(
        'Fetch Limit Reached',
        'Your pet has already played fetch twice today. Come back tomorrow!',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if enough steps
    const stepsNeeded = (fetchClaimsToday + 1) * 1000; // 1000 steps for first claim, 2000 for second
    if (dailySteps < stepsNeeded) {
      playSound('action-fail');
      Alert.alert(
        'More Steps Needed',
        `You need ${stepsNeeded} steps to play fetch. You currently have ${dailySteps} steps.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Update pet data
    const updatedPet = { ...petData };
    const now = new Date();
    
    // Safely update nested property
    if (updatedPet.miniGames?.fetch) {
      updatedPet.miniGames.fetch.claimsToday = fetchClaimsToday + 1;
      updatedPet.miniGames.fetch.lastClaimed = now.toISOString();
    }

    // Save and update with XP reward
    updatePetWithSteps(updatedPet, 0, 50).then(async ({ updatedPet: newPet, leveledUp }) => {
      setPetData(newPet);
      playSound('activity-claim');
      
      // Log activity_fetch_complete event
      try {
        await analytics().logEvent('activity_fetch_complete', { 
          attempt_number: fetchClaimsToday + 1 // Log which attempt (1st or 2nd)
        });
        console.log(`[Analytics] Logged activity_fetch_complete event for attempt: ${fetchClaimsToday + 1}`);
      } catch (analyticsError) {
        console.error('[Analytics] Error logging activity_fetch_complete event:', analyticsError);
      }
      
      if (leveledUp) {
        Alert.alert(
          'Good Fetch!',
          'Your pet had fun playing fetch! You earned 50 XP, which leveled up your pet!',
          [{ text: 'Great!' }]
        );
        
        navigation.navigate('PetLevelUp', { 
          level: newPet.level,
          petType: newPet.type 
        });
      } else {
        Alert.alert(
          'Good Fetch!',
          'Your pet had fun playing fetch! You earned 50 XP.',
          [{ text: 'Great!' }]
        );
      }
    });
  };
  
  // Handle adventure walk
  const handleAdventureWalk = () => {
    if (!petData) return;
    
    // Check if adventure is active
    const { adventure } = petData.miniGames;
    const now = new Date();
    const lastComplete = adventure.lastCompleted 
      ? new Date(adventure.lastCompleted) 
      : null;
    
    // Check if completed this week already
    if (lastComplete) {
      const daysSinceComplete = Math.floor((now.getTime() - lastComplete.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceComplete < 7) {
        Alert.alert(
          'Adventure Already Completed',
          'You\'ve already completed an adventure walk this week. A new adventure will be available in ' + 
            (7 - daysSinceComplete) + ' days.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    // Check if adventure is in progress
    if (adventure.isActive) {
      // Check progress
      if (weeklySteps >= 15000) {
        // Adventure complete
        const updatedPet = { ...petData };
        updatedPet.miniGames.adventure.isActive = false;
        updatedPet.miniGames.adventure.lastCompleted = now.toISOString();
        updatedPet.miniGames.adventure.currentProgress = 15000;
        
        // Save and update with XP reward
        updatePetWithSteps(updatedPet, 0, 300).then(async ({ updatedPet: newPet, leveledUp }) => {
          setPetData(newPet);
          
          // Log activity_adventure_complete event
          try {
            await analytics().logEvent('activity_adventure_complete');
            console.log('[Analytics] Logged activity_adventure_complete event');
          } catch (analyticsError) {
            console.error('[Analytics] Error logging activity_adventure_complete event:', analyticsError);
          }
          
          if (leveledUp) {
            Alert.alert(
              'Adventure Complete',
              'Congratulations! You completed the adventure walk with your pet! You earned 300 XP, which leveled up your pet!',
              [{ text: 'Great!' }]
            );
            
            navigation.navigate('PetLevelUp', { 
              level: newPet.level,
              petType: newPet.type 
            });
          } else {
            Alert.alert(
              'Adventure Complete',
              'Congratulations! You completed the adventure walk with your pet! You earned 300 XP.',
              [{ text: 'Great!' }]
            );
          }
        });
      } else {
        // Adventure in progress
        Alert.alert(
          'Adventure In Progress',
          `You're on an adventure with your pet! Keep walking to reach 15,000 steps this week. Current progress: ${weeklySteps}/15,000 steps.`,
          [{ text: 'Keep Walking!' }]
        );
      }
    } else {
      // Start new adventure
      const updatedPet = { ...petData };
      updatedPet.miniGames.adventure.isActive = true;
      updatedPet.miniGames.adventure.lastStarted = now.toISOString();
      updatedPet.miniGames.adventure.currentProgress = weeklySteps;
      
      Alert.alert(
        'Adventure Started',
        'You\'ve started a new adventure with your pet! Walk 15,000 steps this week to complete it and earn 300 XP.',
        [{ text: 'Let\'s Go!' }]
      );
      
      if (updatedPet.miniGames?.adventure) {
        updatedPet.miniGames.adventure.isActive = true;
        updatedPet.miniGames.adventure.lastStarted = new Date().toISOString();
        updatedPet.miniGames.adventure.lastCompleted = null;
        updatedPet.miniGames.adventure.currentProgress = 0; // Reset progress
      }
      playSound('activity-claim');
      setPetData(updatedPet);
    }
  };
  
  // Calculate progress based on pet stage
  const getProgress = () => {
    if (!petData) {
      return {
        progress: 0,
        currentValue: 0,
        maxValue: 1
      };
    }

    if (petData.growthStage === 'Egg') {
      // For eggs, use total steps since creation for progress
      return {
        progress: Math.min(1, totalSteps / petData.stepsToHatch),
        currentValue: totalSteps,
        maxValue: petData.stepsToHatch
      };
    } else {
      // Ensure we have valid numbers and calculate the ratio
      const currentXP = Math.max(0, petData.xp || 0);
      const maxXP = Math.max(1, petData.xpToNextLevel || 5000); // Fallback to 5000 if undefined
      return {
        progress: Math.min(1, currentXP / maxXP),
        currentValue: currentXP,
        maxValue: maxXP
      };
    }
  };

  const progressData = getProgress();
  
  // Update the pet data update logic to handle null cases
  const updatePetData = async (newPetData: PetData | null) => {
    if (!newPetData) return;
    setPetData(newPetData);
    await savePetData(newPetData);
  };
  
  // Register background task
  useEffect(() => {
    const registerBackgroundTask = async () => {
      try {
        console.log('Attempting to register background task...');
        const status = await BackgroundFetch.getStatusAsync();
        console.log('Current background fetch status:', status);
        
        // Register with 5-minute interval (300 seconds)
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 300, // 5 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('Background task registered successfully with 5-minute interval');
      } catch (error) {
        console.error('Error registering background task:', error);
      }
    };

    registerBackgroundTask();
  }, []);
  
  // Register for push notifications
  useEffect(() => {
    const registerForPushNotifications = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }
        
        try {
          // Try to get the push token, but don't fail if it doesn't work
          const token = await Notifications.getExpoPushTokenAsync();
          console.log('Push token:', token);
          
          // Get current user
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            // Update the user's push token in Supabase
            await supabase
              .from('profiles')
              .update({ push_token: token.data })
              .eq('id', session.user.id);
          }
        } catch (tokenError) {
          // Log the error but don't break the app
          console.log('Push notifications not available:', tokenError);
        }
      } catch (error) {
        // Log the error but don't break the app
        console.log('Error registering for push notifications:', error);
      }
    };

    registerForPushNotifications();
  }, []);
  
  // Handle midnight reset for daily steps
  const handleMidnightReset = () => {
    console.log('[Midnight Reset v4] Triggered.');
    try {
      // ONLY reset daily steps display in context
      console.log('[Midnight Reset v4] Setting dailySteps context to 0');
      setDailySteps(0);
    } catch (error) {
      // Although unlikely now, keep basic error logging
      console.error('[Midnight Reset v4] Error setting dailySteps context:', error);
    }
  };

  // Set up midnight reset timer
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const midnightTimer = setTimeout(() => {
      handleMidnightReset();
      setLastKnownDate(new Date().getDate());
    }, timeUntilMidnight);
    
    return () => clearTimeout(midnightTimer);
  }, [lastKnownDate]); // Reset timer when date changes

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        const currentDate = new Date().getDate();
        if (currentDate !== lastKnownDate) {
          // Day changed while app was in background
          handleMidnightReset();
          setLastKnownDate(currentDate);
        }
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [lastKnownDate]);
  
  // If no pet data AND not loading, show pet selection screen
  if (!isLoading && !petData) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.emptyContainer}>
          <Animated.View 
            style={[
              styles.welcomeContent,
              {
                opacity: fadeAnim,
              }
            ]}
          >
            <Text style={styles.emptyTitle}>Welcome to StepPet!</Text>
            <Text style={styles.emptyText}>
              Hatch your egg to begin the adventure!
            </Text>
            <Animated.View 
              style={{
                 transform: [{ scale: buttonPulseAnim }], 
                 alignSelf: 'stretch', // Ensure wrapper takes full width if needed
                 alignItems: 'center' // Center the button within the wrapper
               }}
            >
              <Button
                title="Get Your Egg"
                onPress={async () => {
                  if (!user?.id) {
                      console.error('[Home] Cannot get egg, user not logged in.');
                      Alert.alert('Error', 'User not logged in.');
                      return;
                  }
                  const userId = user.id;
                  console.log('[Home.tsx] Get Your Egg pressed for user:', userId);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  // TODO: Add a loading indicator state for the button

                  try {
                      // 1. Check if a pet already exists for this user
                      console.log(`[Home] Checking if pet exists for user ${userId}...`);
                      const { data: existingPet, error: checkError } = await supabase
                          .from('pets')
                          .select('id') // Select only ID for efficiency
                          .eq('user_id', userId)
                          .maybeSingle(); // Returns one row or null

                      if (checkError) {
                          console.error('[Home] Error checking for existing pet:', checkError);
                          throw new Error('Could not verify pet status. Please try again.');
                      }

                      if (existingPet) {
                          // Pet already exists! Do not create another.
                          console.warn(`[Home] Pet (${existingPet.id}) already exists for user ${userId}. Button press ignored, triggering context refresh.`);
                          // Trigger a data reload from the context
                          reloadData(); // <-- Call reloadData here
                          return; // Stop execution here
                      }

                      // 2. Pet does NOT exist - Proceed with creation
                      console.log(`[Home] No existing pet found for user ${userId}. Proceeding with creation.`);
                      try {
                        await analytics().logEvent('get_first_egg');
                        console.log('[Analytics] Logged get_first_egg event');
                      } catch (analyticsError) {
                        console.error('[Analytics] Error logging get_first_egg event:', analyticsError);
                      }

                      // --- Pet Creation Logic --- (Keep existing logic)
                      console.log('[Home.tsx] Calling createNewPet...');
                      const newPetObject: PetData = await createNewPet(0, '', 'mythic', 'Egg');
                      const petId = newPetObject.id;
                      console.log('[Home.tsx] createNewPet returned:', JSON.stringify(newPetObject));

                      const { miniGames: initialMiniGames, milestones: initialMilestones, ...petFieldsRaw } = newPetObject;
                      const petFieldsForInsert = keysToSnakeCase(petFieldsRaw);
                      petFieldsForInsert.user_id = userId;
                      petFieldsForInsert.id = petId;

                      console.log('[Home] Attempting direct Pet INSERT:', petFieldsForInsert);
                      const { error: petInsertError } = await supabase
                          .from('pets')
                          .insert(petFieldsForInsert);

                      if (petInsertError) {
                           // This check might be less likely now, but keep for safety
                           if (petInsertError.code === '23505' && petInsertError.message.includes('pets_user_id_key')) {
                               console.warn('[Home] Constraint Violation during *creation* insert (unexpected).');
                           } else {
                               console.error('[Home] Direct Pet INSERT failed during creation:', petInsertError);
                               throw new Error('Failed to create initial pet record.');
                           }
                      } else {
                           console.log('[Home] Direct Pet INSERT successful during creation.');
                           
                           // Insert MiniGames only if Pet insert succeeded
                           // (Use the original MiniGames insertion logic that iterates object keys)
                           if (initialMiniGames) {
                                console.log('[Home] Preparing initial MiniGames inserts...');
                                const gameTypes = Object.keys(initialMiniGames) as Array<keyof MiniGames>;
                                const insertPromises = [];
                                for (const gameType of gameTypes) {
                                    const gameData = initialMiniGames[gameType];
                                    let rowToInsert: any = { pet_id: petId, game_type: gameType };
                                    // Add specific fields...
                                    if (gameType === 'feed') {
                                        if ('lastClaimed' in gameData) rowToInsert.last_claimed = gameData.lastClaimed || null;
                                        if ('claimedToday' in gameData) rowToInsert.claimed_today = gameData.claimedToday;
                                    } else if (gameType === 'fetch') {
                                        if ('lastClaimed' in gameData) rowToInsert.last_claimed = gameData.lastClaimed || null;
                                        if ('claimsToday' in gameData) rowToInsert.claims_today = gameData.claimsToday;
                                    } else if (gameType === 'adventure') {
                                        if ('lastStarted' in gameData) rowToInsert.last_started = gameData.lastStarted || null;
                                        if ('lastCompleted' in gameData) rowToInsert.last_completed = gameData.lastCompleted || null;
                                        if ('currentProgress' in gameData) rowToInsert.current_progress = gameData.currentProgress;
                                        if ('isActive' in gameData) rowToInsert.is_active = gameData.isActive;
                                    }
                                    // Clean undefined...
                                    Object.keys(rowToInsert).forEach(key => { if (rowToInsert[key] === undefined) { rowToInsert[key] = null; } });
                                    console.log(`[Home] Inserting MiniGame row:`, rowToInsert);
                                    insertPromises.push(supabase.from('mini_games').insert(rowToInsert));
                                }
                               const results = await Promise.allSettled(insertPromises);
                               results.forEach((result, index) => { 
                                 if (result.status === 'rejected') {
                                     const supabaseError = result.reason?.error || result.reason;
                                     console.error(`[Home] Error inserting MiniGame (${gameTypes[index]}):`, supabaseError);
                                 } else {
                                     console.log(`[Home] MiniGame (${gameTypes[index]}) successfully inserted.`);
                                 }
                               });
                           } // End of MiniGames logic

                           // 5. Prepare and Insert Initial Milestones Data (Keep this new block)
                           if (initialMilestones && initialMilestones.length > 0) {
                             console.log('[Home] Preparing initial Milestones inserts...');
                             // Use for...of loop for sequential awaiting
                             for (const milestone of initialMilestones) {
                                // Map the code's 'id' field to the database's 'milestone_id' column
                                // Omit the 'id' field itself from the insert object (as it's auto-generated UUID)
                                const { id: milestoneIdentifier, ...restOfMilestone } = milestone;
                                const milestoneToInsert = {
                                  ...keysToSnakeCase(restOfMilestone),
                                  milestone_id: milestoneIdentifier, // Map to the correct DB column name
                                  pet_id: petId, 
                                };
                                Object.keys(milestoneToInsert).forEach(key => { 
                                  if (milestoneToInsert[key] === undefined) { 
                                      milestoneToInsert[key] = null; 
                                  } 
                                });
                                
                                try {
                                  console.log(`[Home] Attempting insert for Milestone ID: ${milestoneIdentifier}`, milestoneToInsert);
                                  const { error: insertError } = await supabase
                                    .from('milestones')
                                    .insert(milestoneToInsert); // Insert object targeting milestone_id
                                    
                                  if (insertError) {
                                    console.error(`[Home] FAILED to insert Milestone ID (${milestoneIdentifier}):`, JSON.stringify(insertError, null, 2));
                                  } else {
                                    console.log(`[Home] Successfully inserted Milestone ID (${milestoneIdentifier}).`);
                                  }
                                } catch (catchError) {
                                  console.error(`[Home] CRITICAL error during insert for Milestone ID (${milestoneIdentifier}):`, catchError);
                                }
                             } // End for loop
                             console.log('[Home] Finished attempting milestone inserts.');
                             
                           } else {
                             console.log('[Home] No initial milestones defined or empty array.');
                           }
                      } // End of successful pet insert block

                      // 6. Update DataContext state AFTER trying inserts
                      console.log('[Home.tsx] Calling setPetData to update context state after creation.');
                      setPetData(newPetObject); // Update context with the pet object we tried to insert

                      console.log('[Home.tsx] State updates complete after creation.');

                  } catch (error) {
                      console.error('[Home.tsx] Error getting first egg:', error);
                      Alert.alert('Error', 'Could not get your first egg. Please try again.');
                  }
                }}
                size="large"
                style={styles.startButton}
              />
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    );
  }
  
  // Determine feed status
  if (!petData) return null; // Added check for petData

  // Use optional chaining for feed claimed status
  const isFeedClaimedToday = petData?.miniGames?.feed?.claimedToday;
  // Use optional chaining + date check for feed last claimed status
  const wasFeedClaimedYesterdayOrEarlier = petData?.miniGames?.feed?.lastClaimed ? !isSameDay(new Date(petData.miniGames.feed.lastClaimed), new Date()) : true; // Treat no claim date as claimable

  const canFeedToday = !isFeedClaimedToday || wasFeedClaimedYesterdayOrEarlier;

  // Determine fetch status
  const MAX_FETCH_CLAIMS = 3;
  // Use optional chaining and nullish coalescing
  const fetchClaimsToday = petData?.miniGames?.fetch?.claimsToday ?? 0;
  const canFetchToday = fetchClaimsToday < MAX_FETCH_CLAIMS;
  
  // Determine adventure status
  const adventureActive = petData?.miniGames?.adventure?.isActive;
  let adventureProgress = 0;
  if (adventureActive && petData?.miniGames?.adventure?.currentProgress) {
    adventureProgress = petData.miniGames.adventure.currentProgress;
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: petData?.appearance.backgroundTheme || '#FFFFFF' }
    ]}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor="#8C52FF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepCounter}>
            <Ionicons name="footsteps" size={20} color="#8C52FF" />
            <Text style={styles.stepText}>{dailySteps.toLocaleString()} steps today</Text>
          </View>

          {/* Add flexible spacer */}
          <View style={{ flex: 1 }} /> 

          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.gemButtonHome} 
              onPress={() => navigation.navigate('Store', { initialTab: 'gems' })}
            >
              <GemBalance />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Pet Display */}
        <View style={styles.petSection}>
          {showPulseHint && (
            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>Tap to interact!</Text>
            </View>
          )}
          <Animated.View 
            style={[
              styles.petContainer,
              isPetAnimating ? { transform: [{ scale: pulseAnim }] } : null,
              petData?.growthStage === 'Egg' ? {
                transform: [
                  {
                    rotate: eggShakeAnim.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ['-3deg', '3deg']
                    })
                  },
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10]
                    })
                  }
                ]
              } : null
            ]}
          >
            <TouchableOpacity onPress={handlePetTap} activeOpacity={0.8}>
              <PetDisplay
                petType={petData.type}
                growthStage={petData.growthStage}
                size="xlarge"
                showEquippedItems={true}
              />
            </TouchableOpacity>
          </Animated.View>
          
          {/* Pet Info */}
          <View style={styles.petInfo}>
            <Text style={[
              styles.petName, 
              petData.growthStage === 'Egg' ? { marginBottom: 12 } : null, 
              petData.growthStage === 'Egg' ? { marginTop: -8 } : null, 
              petData?.appearance.nameColor && { color: petData.appearance.nameColor } 
            ]}>
              {petData?.name}
            </Text>
            {petData.growthStage !== 'Egg' && (
              <Text style={styles.petTypeText}>
                {PET_TYPES[petData.type].name}
                {petData.appearance.hasEliteBadge && (
                  <Ionicons name="shield-checkmark" size={20} color="#8C52FF" style={styles.badgeIcon} />
                )}
              </Text>
            )}
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                Level {petData.growthStage === 'Egg' ? '0' : petData.level}
              </Text>
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Level Progress</Text>
              {petData && (petData.growthStage !== 'Egg' || petData.stepsToHatch > 0) ? (
                <ProgressBar
                  progress={petData.growthStage === 'Egg' 
                    ? Math.min(1, (petData.totalSteps || 0) / petData.stepsToHatch) 
                    : progressData.progress}
                  height={12}
                  fillColor="#8C52FF"
                  backgroundColor="#E0E0E0"
                  borderRadius={6}
                  animated={petData.appearance.hasAnimatedBackground}
                  showLabel
                  labelStyle="outside"
                  labelFormat="fraction"
                  currentValue={petData.growthStage === 'Egg' ? (petData.totalSteps || 0) : progressData.currentValue}
                  maxValue={petData.growthStage === 'Egg' ? petData.stepsToHatch : progressData.maxValue}
                />
              ) : (
                <View style={[styles.progressBarPlaceholder, { height: 12 }]} />
              )}
              {petData && petData.growthStage === 'Egg' ? (
                <>
                  <Text style={styles.progressHint}>
                    {`${(petData.totalSteps || 0).toLocaleString()} / ${petData.stepsToHatch.toLocaleString()} steps to hatch`}
                  </Text>
                  {petData.totalSteps >= petData.stepsToHatch && (
                    <Animated.View style={{
                      transform: [{
                        translateX: buttonPulseAnim
                      }]
                    }}>
                      <TouchableOpacity 
                        style={styles.hatchButton}
                        onPress={handlePetTap}
                      >
                        <Text style={styles.hatchButtonText}>Hatch Egg</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </>
              ) : null}
            </View>
          </View>
        </View>
        
        {/* Mini Games Section */}
        <View style={styles.miniGamesSection}>
          <Text style={styles.sectionTitle}>Activities</Text>
          
          {(() => {
            // Determine steps progress for feed/fetch based on hatch date
            let activityStepsProgress = dailySteps;
            if (petData?.hatchDate && isSameDay(new Date(petData.hatchDate), new Date())) {
              activityStepsProgress = Math.max(0, dailySteps - (petData.dailyStepsAtHatch || 0));
            }

            return (
              <>
                {/* Fetch Mini Game */}
                <MiniGameCard
                  title="Play Fetch"
                  description={`Walk ${(fetchClaimsToday + 1) * 1000} steps to play fetch ${fetchClaimsToday === 0 ? '(first time)' : '(second time)'}.`}
                  icon="tennisball-outline"
                  stepsRequired={(fetchClaimsToday + 1) * 1000}
                  stepsProgress={activityStepsProgress}
                  isActive={canFetchToday}
                  isComplete={fetchClaimsToday >= 2}
                  isLocked={petData.growthStage === 'Egg'}
                  onPress={() => handleMiniGamePress('fetch')}
                  color="#8C52FF"
                />

                {/* Feed Mini Game */}
                <MiniGameCard
                  title="Feed Your Pet"
                  description="Walk 2,500 steps to feed your pet."
                  icon="nutrition-outline"
                  stepsRequired={2500}
                  stepsProgress={activityStepsProgress}
                  isActive={canFeedToday}
                  isComplete={!canFeedToday}
                  isLocked={petData.growthStage === 'Egg'}
                  onPress={() => handleMiniGamePress('feed')}
                  color="#8C52FF"
                />
              </>
            );
          })()}
          
          {/* Adventure Walk */}
          <MiniGameCard
            title="Adventure Walk"
            description="Walk 15,000 steps this week to take your pet on a special adventure."
            icon="map-outline"
            stepsRequired={15000}
            stepsProgress={adventureActive ? weeklySteps : 0}
            isActive={!adventureActive}
            isComplete={false}
            isLocked={petData.growthStage === 'Egg'}
            onPress={() => handleMiniGamePress('adventure')}
            color="#8C52FF"
          />
        </View>
        
        {/* Last refreshed indicator */}
        <View style={styles.refreshInfo}>
          <Text style={styles.refreshText}>
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
          <TouchableOpacity onPress={refreshStepData}>
            <Text style={styles.refreshButton}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EDFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#333333',
    marginLeft: 6,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  gemButtonHome: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  welcomeContent: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 32,
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 18,
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 28,
  },
  startButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#8C52FF',
    borderRadius: 16,
    shadowColor: '#8C52FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  petSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  petContainer: {
    marginBottom: 16,
  },
  petInfo: {
    alignItems: 'center',
    width: '100%',
  },
  petName: {
    fontFamily: 'Caprasimo-Regular',
    fontSize: 28,
    color: '#333333',
    marginBottom: 4,
  },
  petTypeText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: '#8C52FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'center',
  },
  levelBadgeText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  progressContainer: {
    width: '100%',
  },
  progressLabel: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#333333',
    marginBottom: -12,
  },
  progressHint: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  miniGamesSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  refreshInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  refreshText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#909090',
  },
  refreshButton: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#8C52FF',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  hatchButton: {
    backgroundColor: '#8C52FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hatchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
  },
  badgeIcon: {
    marginLeft: 4,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
  },
  hintContainer: {
    backgroundColor: '#8C52FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  hintText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  progressBarPlaceholder: {
    backgroundColor: '#E0E0E0', // Match progress bar background
    borderRadius: 6,
    marginTop: 4, // Adjust slightly if needed for alignment
    marginBottom: 4, // Adjust slightly if needed for alignment
  },
});

export default Home; 