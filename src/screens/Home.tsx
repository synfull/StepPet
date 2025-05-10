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
  AppState,
  Platform
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
import { isSameDay, getTodayDateString, getStartOfWeekUTC } from '../utils/dateUtils';
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
    // console.log('Background task started at:', new Date().toISOString());
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      // console.log('No user session in background task');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Load pet data
    const petData = await loadPetData();
    if (!petData) {
      // console.log('No pet data found in background task');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    if (petData.growthStage !== 'Egg') {
      // console.log('Pet is not an egg, skipping check');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // console.log('Checking egg hatching status for:', petData.name);
    
    // Get current steps
    const petCreationTime = new Date(petData.created);
    const dailySteps = await fetchDailySteps(petCreationTime, petData.startingStepCount || 0);
    const stepsSinceCreation = Math.max(0, dailySteps - (petData.startingStepCount || 0));
    
    // console.log('Steps since creation:', stepsSinceCreation);
    // console.log('Steps needed to hatch:', petData.stepsToHatch);

    // Check if egg is ready to hatch
    if (stepsSinceCreation >= petData.stepsToHatch) {
      // console.log('Egg is ready to hatch!');
      // Check if we've already sent a notification for this egg
      const hasSentNotification = await AsyncStorage.getItem(`egg_hatching_notification_${petData.id}`);
      if (!hasSentNotification) {
        // console.log('Sending hatching notification...');
        
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
        // console.log('Hatching notification sent');
      } else {
        // console.log('Notification already sent for this egg');
      }
    } else {
      // console.log('Egg not ready to hatch yet');
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
  const breathingAnim = useRef(new Animated.Value(1)).current; // Add breathing animation value
  
  const lastStepUpdate = useRef<number>(0);
  const STEP_UPDATE_INTERVAL = 1000; // 1 second minimum between updates
  
  // *** ADD Ref to track last processed date for daily reset ***
  const lastProcessedDateRef = useRef<number>(new Date().getDate());
  
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
      // console.log('[Home.tsx] PetData loaded, triggering initial refreshStepData...');
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
          // console.log('[Pedometer Update - Egg]');
          const currentTime = new Date();
          // console.log('Current Time:', currentTime.toISOString());
          // console.log('Pet Creation Time:', petCreationTime.toISOString());
          // console.log('Starting Step Count:', petData.startingStepCount);
          // console.log('Current petData.totalSteps before calculation:', petData.totalSteps);
          
          const todayMidnight = new Date();
          todayMidnight.setHours(0, 0, 0, 0);
          const { steps: todayStepsRaw } = await Pedometer.getStepCountAsync(todayMidnight, currentTime);

          let todayStepsCalculated = 0;
          let totalStepsSinceCreation = 0;

          if (isSameDay(petCreationTime, currentTime)) {
              // console.log(`[Pedometer Egg - TODAY] todayStepsCalc: ${todayStepsCalculated}, totalStepsSinceCreation: ${totalStepsSinceCreation}`);
              todayStepsCalculated = Math.max(0, todayStepsRaw - (petData.startingStepCount || 0));
              totalStepsSinceCreation = todayStepsCalculated; // For eggs created today, total since creation is just today's steps post-start
          } else {
              // console.log(`[Pedometer Egg - BEFORE] Reading petData.totalStepsBeforeToday from state: ${petData?.totalStepsBeforeToday}`);
              const stepsBeforeToday = petData?.totalStepsBeforeToday || 0;
              todayStepsCalculated = todayStepsRaw; // Today's raw steps count fully
              totalStepsSinceCreation = stepsBeforeToday + todayStepsCalculated;
              // console.log(`[Pedometer Egg - BEFORE] todayStepsCalc: ${todayStepsCalculated}, totalStepsBeforeToday: ${petData?.totalStepsBeforeToday || 0}, todayStepsRaw: ${todayStepsRaw}, Calculated totalStepsSinc
          }

          // console.log('Updating context: setDailySteps:', todayStepsCalculated, 'setTotalSteps:', totalStepsSinceCreation);
          setDailySteps(todayStepsCalculated);
          setTotalSteps(totalStepsSinceCreation);

          const newStepsDelta = totalStepsSinceCreation - (petData.totalSteps || 0);
          // console.log(`[Pedometer Egg] Calculated newStepsDelta: ${newStepsDelta}`);

          if (newStepsDelta > 0) {
            // console.log('Updating petData state and saving...');
            const { updatedPet } = await updatePetWithSteps(petData, newStepsDelta);
            setPetData(updatedPet); // This will trigger save via DataContext
          } else {
            // console.log('No step delta detected, petData not updated.');
          }
          // console.log('[Pedometer Update - Egg End]');
        } else {
          // Logic for hatched pets
           const todayMidnight = new Date();
           todayMidnight.setHours(0, 0, 0, 0);
           const { steps: todayStepsRaw } = await Pedometer.getStepCountAsync(todayMidnight, new Date());
           // Calculate daily steps considering starting point ONLY if created today
           const startingStepCountForDaily = isSameDay(petCreationTime, new Date()) ? (petData.startingStepCount || 0) : 0;
           const todayStepsCalculated = Math.max(0, todayStepsRaw - startingStepCountForDaily);
           setDailySteps(todayStepsCalculated);
           
           // Calculate total steps since creation CORRECTLY (absolute)
           const { steps: totalStepsRaw } = await Pedometer.getStepCountAsync(petCreationTime, new Date());
           let stepsSinceCreationCalculated = 0;
           if (isSameDay(petCreationTime, new Date())) {
              // Created TODAY: Subtract starting count
              stepsSinceCreationCalculated = Math.max(0, totalStepsRaw - (petData.startingStepCount || 0));
           } else {
              // Created BEFORE today: Raw value is the total since creation
              stepsSinceCreationCalculated = totalStepsRaw;
           }
           // console.log(`[Pedometer Hatched v5] Calculated absolute stepsSinceCreation: ${stepsSinceCreationCalculated}`);
           
           // Update totalSteps context if needed 
           if (stepsSinceCreationCalculated !== totalSteps) {
                setTotalSteps(stepsSinceCreationCalculated); // Update total steps context
           }

           // *** FIX: Calculate the DELTA to pass to updatePetWithSteps ***
           const savedTotalSteps = petData.totalSteps || 0;
           const newStepsDelta = Math.max(0, stepsSinceCreationCalculated - savedTotalSteps);
           // console.log(`[Pedometer Hatched v5] Calculated newStepsDelta: ${newStepsDelta} (Absolute: ${stepsSinceCreationCalculated}, Saved: ${savedTotalSteps})`);
             
           // Call updatePetWithSteps with petData from closure and the calculated DELTA
           const { updatedPet: newPet, leveledUp } = await updatePetWithSteps(
               petData, 
               newStepsDelta // Pass the DELTA, not the absolute total
           ); 
           setPetData(newPet); // Update main state, triggering debounced save
             
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
  
  // Start floating animation when petData exists
  useEffect(() => {
    // *** FIX: Start animation if petData exists (Egg or Hatched) ***
    if (petData) { 
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 1900, // Slightly adjusted duration
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1900, // Slightly adjusted duration
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );
      loop.start();
      // Return a cleanup function to stop the loop when the component unmounts or petData changes
      return () => loop.stop(); 
    } else {
      // Ensure animation value is reset if petData becomes null
      floatAnim.setValue(0); 
    }
  // *** FIX: Depend on petData existence, not just growthStage ***
  // *** Use petData.id which is stable during updates ***
  }, [petData?.id]); 
  
  // Start subtle breathing animation loop when petData exists
  useEffect(() => {
    if (petData) {
      const breathLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(breathingAnim, {
            toValue: 1.03, // Scale up slightly
            duration: 1800, // Slow inhale
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(breathingAnim, {
            toValue: 1, // Scale back down
            duration: 1800, // Slow exhale
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );
      breathLoop.start();
      return () => breathLoop.stop(); // Cleanup on unmount/data change
    } else {
      breathingAnim.setValue(1); // Reset if no petData
    }
    // *** FIX: Use petData.id which is stable during updates ***
  }, [petData?.id]);
  
  // Refresh step data
  const refreshStepData = async () => {
    // console.log('[Refresh v10] Refresh triggered.');
    try {
      if (!petData) {
        // console.log('[Refresh v10] No petData, skipping.');
        return;
      }

      const now = new Date(); // Get current time once
      const currentDayOfMonth = now.getDate();
      let updatedPetDataForCalc = { ...petData }; // Start with current petData
      let dailyStepsReset = false;

      // *** Check for day change and perform snapshot ***
      if (currentDayOfMonth !== lastProcessedDateRef.current) {
          // console.log(`[Refresh v10] New day detected (Current: ${currentDayOfMonth}, Last Processed: ${lastProcessedDateRef.current})! Running midnight snapshot.`);
          dailyStepsReset = true;
          updatedPetDataForCalc = {
              ...updatedPetDataForCalc,
              // Snapshot total steps from *before* this refresh into totalStepsBeforeToday
              totalStepsBeforeToday: petData.totalSteps 
          };
          lastProcessedDateRef.current = currentDayOfMonth; // Update ref for next check
          setDailySteps(0); // Reset daily steps context display immediately
          console.log(`[Refresh v10] Snapshot complete. totalStepsBeforeToday set to: ${petData.totalSteps}. Daily context reset.`);
      }
      // *** End daily reset check ***

      // Use updatedPetDataForCalc for reading existing values from this point onwards
      const petCreationTime = new Date(updatedPetDataForCalc.created);

      // 1. Get today's raw steps from Pedometer
      const todayMidnight = new Date(now); 
      todayMidnight.setHours(0, 0, 0, 0);
      const { steps: todayStepsRaw } = await Pedometer.getStepCountAsync(todayMidnight, now);

      // 2. Calculate Daily Steps for display
      let calculatedDailySteps = 0;
      // Subtract starting steps ONLY if the pet was created today
      // Also, if daily steps were reset, the count for today effectively starts from 0 relative to snapshot
      if (!dailyStepsReset) { 
          const startingStepCountForDaily = isSameDay(petCreationTime, now) ? (updatedPetDataForCalc.startingStepCount || 0) : 0;
          calculatedDailySteps = Math.max(0, todayStepsRaw - startingStepCountForDaily);
      } // else calculatedDailySteps remains 0, as context was just reset
      console.log(`[Refresh v10] Calculated Daily Steps for display: ${calculatedDailySteps}`);
      // Update context only if it wasn't just reset (to avoid redundant set)
      if (!dailyStepsReset) { 
          setDailySteps(calculatedDailySteps);
      }

      // 3. Get Absolute Total Steps from Pedometer
      let absoluteTotalStepsSinceCreation = 0;
      try {
         const { steps: totalStepsRawPedometer } = await Pedometer.getStepCountAsync(petCreationTime, now);
         // Use startingStepCount from the potentially updated data
         if (isSameDay(petCreationTime, now)) {
            absoluteTotalStepsSinceCreation = Math.max(0, totalStepsRawPedometer - (updatedPetDataForCalc.startingStepCount || 0));
         } else {
            absoluteTotalStepsSinceCreation = totalStepsRawPedometer;
         }
         console.log(`[Refresh v10] Absolute Total Steps (Pedometer): ${absoluteTotalStepsSinceCreation}`);
      } catch (pedometerError) {
          console.error("[Refresh v10] Error fetching total steps from pedometer:", pedometerError);
          absoluteTotalStepsSinceCreation = updatedPetDataForCalc.totalSteps || 0;
          console.warn("[Refresh v10] Using saved totalSteps due to pedometer error.");
      }

      // 4. Calculate the delta for XP/Leveling (relative to current saved totalSteps in updatedPetDataForCalc)
      const savedTotalSteps = updatedPetDataForCalc.totalSteps || 0;
      const newStepsDeltaForXP = Math.max(0, absoluteTotalStepsSinceCreation - savedTotalSteps);
      console.log(`[Refresh v10] Calculated New Steps Delta (for XP): ${newStepsDeltaForXP}`);

      // 5. Weekly Steps Logic using totalStepsAtLastWeeklyCalc
      const currentWeekStart = getStartOfWeekUTC(now);
      const lastSavedWeekStartStr = updatedPetDataForCalc.currentWeekStartDate;
      let lastSavedWeekStart = new Date(0);
      if (lastSavedWeekStartStr) { try { lastSavedWeekStart = new Date(lastSavedWeekStartStr); } catch (e) { console.error("Error parsing lastSavedWeekStartStr", e); } }
      console.log(`[Refresh v10] Current Week Start: ${currentWeekStart.toISOString()}, Last Saved Week Start: ${lastSavedWeekStart.toISOString()}`);

      let updatedWeeklySteps = 0;
      let isNewWeek = false;
      const savedWeeklySteps = updatedPetDataForCalc.weeklySteps || 0;
      const lastWeeklyCalcPoint = updatedPetDataForCalc.totalStepsAtLastWeeklyCalc ?? savedTotalSteps ?? 0; 
      const refreshDeltaForWeekly = Math.max(0, absoluteTotalStepsSinceCreation - lastWeeklyCalcPoint);
      console.log(`[Refresh v10 - Weekly] Saved Weekly: ${savedWeeklySteps}, LastCalcPoint: ${lastWeeklyCalcPoint}, AbsoluteTotal: ${absoluteTotalStepsSinceCreation}, RefreshDeltaForWeekly: ${refreshDeltaForWeekly}`);

      if (currentWeekStart.getTime() > lastSavedWeekStart.getTime()) {
          console.log('[Refresh v10 - Weekly] New week detected! Resetting weekly steps.');
          isNewWeek = true;
          updatedWeeklySteps = refreshDeltaForWeekly;
      } else {
          console.log('[Refresh v10 - Weekly] Same week. Adding refresh delta to weekly steps.');
          updatedWeeklySteps = savedWeeklySteps + refreshDeltaForWeekly;
      }
      console.log(`[Refresh v10 - Weekly] Calculated Updated Weekly Steps: ${updatedWeeklySteps}`);

      setWeeklySteps(updatedWeeklySteps); // Update context
      console.log(`[Refresh v10] Updated Weekly Steps Context: ${updatedWeeklySteps}`);

      // Update Total Steps Context (using the absolute value)
      setTotalSteps(absoluteTotalStepsSinceCreation);
      console.log(`[Refresh v10] Updated Total Steps Context: ${absoluteTotalStepsSinceCreation}`);

      // 6. Prepare final updated PetData object for saving
      // Incorporate the snapshot value if day changed
      let petDataForSaving = { 
          ...updatedPetDataForCalc, // Includes snapshot if day changed
          totalSteps: absoluteTotalStepsSinceCreation,
          weeklySteps: updatedWeeklySteps,
          totalStepsAtLastWeeklyCalc: absoluteTotalStepsSinceCreation,
          currentWeekStartDate: isNewWeek ? currentWeekStart.toISOString() : updatedPetDataForCalc.currentWeekStartDate 
      };
      console.log(`[Refresh v10] petDataForSaving prepared:`, petDataForSaving);

      // 7. Call updatePetWithSteps using the delta calculated for XP/leveling
      const { updatedPet: refreshedPetFromUtil, leveledUp } = await updatePetWithSteps(
          petDataForSaving,     // Pass object containing all latest calculated values
          newStepsDeltaForXP    // Pass delta relative to *previous* total for XP calc
      );
      console.log('[Refresh v10] Pet data after updatePetWithSteps:', refreshedPetFromUtil);

      // 8. Merge results - Ensure our specific calculations persist
      const finalPetDataUpdate = {
          ...refreshedPetFromUtil, // Base properties from updatePetWithSteps (XP, Level, totalSteps etc.)
          weeklySteps: updatedWeeklySteps, 
          totalStepsAtLastWeeklyCalc: absoluteTotalStepsSinceCreation, 
          currentWeekStartDate: petDataForSaving.currentWeekStartDate, 
          // Ensure totalStepsBeforeToday from snapshot is included
          totalStepsBeforeToday: petDataForSaving.totalStepsBeforeToday 
      };
      console.log(`[Refresh v10] Final merged PetData (WeeklySteps: ${finalPetDataUpdate.weeklySteps}, LastWeeklyCalc: ${finalPetDataUpdate.totalStepsAtLastWeeklyCalc}, StepsBeforeToday: ${finalPetDataUpdate.totalStepsBeforeToday}):`, finalPetDataUpdate);

      // 9. Update the main petData state 
      setPetData(finalPetDataUpdate);

      // ... (leveledUp check) ...

    } catch (error) {
      console.error('[Refresh v10] Error refreshing step data:', error);
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
          
          // *** FIX: Recalculate daily steps at hatch moment to avoid race condition ***
          let calculatedDailyStepsAtHatchMoment = 0;
          const nowForHatchCalc = new Date();
          const eggCreatedDate = new Date(petData.created);
          const midnightTodayForHatchCalc = new Date(nowForHatchCalc);
          midnightTodayForHatchCalc.setHours(0,0,0,0);

          try {
            const { steps: rawStepsTodayForHatch } = await Pedometer.getStepCountAsync(midnightTodayForHatchCalc, nowForHatchCalc);
            if (isSameDay(eggCreatedDate, nowForHatchCalc)) {
                calculatedDailyStepsAtHatchMoment = Math.max(0, rawStepsTodayForHatch - (petData.startingStepCount || 0));
            } else {
                calculatedDailyStepsAtHatchMoment = rawStepsTodayForHatch;
            }
            console.log(`[handlePetTap] Recalculated dailyStepsAtHatchMoment: ${calculatedDailyStepsAtHatchMoment}`);
          } catch (pedometerError) {
            console.error('[handlePetTap] Error fetching pedometer steps for dailyStepsAtHatch calculation:', pedometerError);
            // Fallback or error handling - for now, log and potentially proceed with 0 or context value?
            // For safety, if recalculation fails, use the potentially stale context value but log it.
            calculatedDailyStepsAtHatchMoment = dailySteps; // Fallback to context dailySteps
            console.warn(`[handlePetTap] Falling back to context dailySteps (${calculatedDailyStepsAtHatchMoment}) due to error in recalculation.`);
          }
          // *** END FIX ***

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
            dailyStepsAtHatch: calculatedDailyStepsAtHatchMoment, // Use recalculated value
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
  const handleFeedPet = async () => {
    if (!petData) return;
    
    // Check if already fed today
    const now = new Date();
    const lastFed = petData?.miniGames?.feed?.lastClaimed ? new Date(petData.miniGames.feed.lastClaimed) : null;
    if (lastFed && isSameDay(lastFed, now) && petData?.miniGames?.feed?.claimedToday) {
      Alert.alert('Already Fed', 'You have already fed your pet today!');
      return;
    }

    // Calculate steps relevant for today's activity
    let activityStepsToday = dailySteps;
    if (petData?.hatchDate && isSameDay(new Date(petData.hatchDate), now)) {
      activityStepsToday = Math.max(0, dailySteps - (petData.dailyStepsAtHatch || 0));
      console.log(`[handleFeedPet] Hatched today. Using activityStepsToday: ${activityStepsToday} (daily: ${dailySteps}, atHatch: ${petData.dailyStepsAtHatch})`);
    } else {
       console.log(`[handleFeedPet] Not hatched today or no hatch date. Using dailySteps: ${activityStepsToday}`);
    }


    // Check if steps requirement met
    const FEED_STEPS_REQUIRED = 500; // Define requirement
    if (activityStepsToday < FEED_STEPS_REQUIRED) {
      Alert.alert('Not Enough Steps', `You need ${FEED_STEPS_REQUIRED - activityStepsToday} more steps today to feed your pet.`);
      return;
    }

    // Claim reward
    playSound('activity-claim');
    const xpBoost = 50; // Define XP reward

    // *** FIX: Defensively update miniGames state ***
    const updatedMiniGames = {
      ...petData.miniGames, // Spread existing games
      feed: {               // Ensure 'feed' object exists
        ...(petData.miniGames?.feed ?? {}), // Spread existing feed data or an empty object if feed is null/undefined
        lastClaimed: now.toISOString(),
        claimedToday: true,
      },
    };

    // Create the base for the update object
    const updatedPetDataBase = {
      ...petData,
      miniGames: updatedMiniGames,
    };

    // Apply XP boost using updatePetWithSteps for consistency
     const { updatedPet: updatedPetAfterFeed, leveledUp } = await updatePetWithSteps(
       updatedPetDataBase, // Pass the object with the updated miniGames.feed structure
       0,                  // No *new* steps delta from this action
       xpBoost             // Add the XP boost
     );

    // Set the final state incorporating changes from updatePetWithSteps
    setPetData(updatedPetAfterFeed);


    // Log analytics event (optional)
    try {
        await analytics().logEvent('feed_pet', { pet_level: petData.level });
        console.log('[Analytics] Logged feed_pet event');
    } catch (error) {
        console.error('[Analytics] Error logging feed_pet event:', error);
    }

    Alert.alert('Yum!', `You fed your pet and earned ${xpBoost} XP!`);
  };
  
  // Handle fetch game
  const handleFetchGame = async () => {
    if (!petData) return;

    const now = new Date();
    const FETCH_STEPS_REQUIRED = 1000;
    const MAX_FETCH_CLAIMS = 2;
    const xpBoost = 100; // Define XP reward

    // Calculate steps relevant for today's activity
    let activityStepsToday = dailySteps;
     if (petData?.hatchDate && isSameDay(new Date(petData.hatchDate), now)) {
      activityStepsToday = Math.max(0, dailySteps - (petData.dailyStepsAtHatch || 0));
      console.log(`[handleFetchGame] Hatched today. Using activityStepsToday: ${activityStepsToday} (daily: ${dailySteps}, atHatch: ${petData.dailyStepsAtHatch})`);
    } else {
       console.log(`[handleFetchGame] Not hatched today or no hatch date. Using dailySteps: ${activityStepsToday}`);
    }


    // Check step requirement
     if (activityStepsToday < FETCH_STEPS_REQUIRED) {
        Alert.alert('Not Enough Steps', `You need ${FETCH_STEPS_REQUIRED - activityStepsToday} more steps today to play fetch.`);
        return;
     }

    // Check claim limit
    const claimsToday = petData.miniGames?.fetch?.claimsToday ?? 0;
    const lastClaimed = petData?.miniGames?.fetch?.lastClaimed ? new Date(petData.miniGames.fetch.lastClaimed) : null;

    // Reset claims if it's a new day since the last claim
    const resetClaims = lastClaimed && !isSameDay(lastClaimed, now);
    const currentClaims = resetClaims ? 0 : claimsToday;

    if (currentClaims >= MAX_FETCH_CLAIMS) {
        Alert.alert('Already Played Fetch', `You have already played fetch ${MAX_FETCH_CLAIMS} times today!`);
        return;
    }


    // Claim reward
    playSound('activity-claim');

    // *** FIX: Defensively update miniGames state ***
    const updatedMiniGames = {
        ...petData.miniGames,
        fetch: {
            ...(petData.miniGames?.fetch ?? {}), // Use nullish coalescing
            lastClaimed: now.toISOString(),
            claimsToday: currentClaims + 1, // Increment claims
            // Ensure claimedToday property exists for consistency if needed elsewhere, though logic uses claimsToday
            claimedToday: true, 
        },
    };

    // Create the base for the update object
    const updatedPetDataBase = {
        ...petData,
        miniGames: updatedMiniGames,
    };

    // Apply XP boost using updatePetWithSteps
    const { updatedPet: updatedPetAfterFetch, leveledUp } = await updatePetWithSteps(
        updatedPetDataBase,
        0,
        xpBoost
    );

    // Set the final state
    setPetData(updatedPetAfterFetch);


    // Log analytics event (optional)
    try {
        await analytics().logEvent('play_fetch', { pet_level: petData.level, claims_today: currentClaims + 1 });
        console.log('[Analytics] Logged play_fetch event');
    } catch (error) {
        console.error('[Analytics] Error logging play_fetch event:', error);
    }


    Alert.alert('Good Fetch!', `You played fetch with your pet and earned ${xpBoost} XP! (${currentClaims + 1}/${MAX_FETCH_CLAIMS} today)`);
  };
  
  // Handle adventure walk
  const handleAdventureWalk = () => {
    if (!petData || !petData.miniGames?.adventure) return; // Add check for adventure object
    
    const { adventure } = petData.miniGames;
    const now = new Date();
    
    // *** FIX: Use weekly reset logic ***
    const startOfCurrentWeek = getStartOfWeekUTC(); 
    const lastCompleteDate = adventure.lastCompleted 
      ? new Date(adventure.lastCompleted) 
      : null;
      
    // Check if adventure was completed *this week*
    const completedThisWeek = lastCompleteDate && lastCompleteDate.getTime() >= startOfCurrentWeek.getTime();
    console.log(`[AdventureWalk] Start of Current Week: ${startOfCurrentWeek.toISOString()}, Last Complete: ${lastCompleteDate?.toISOString()}, Completed This Week: ${completedThisWeek}`);

    if (adventure.isActive) {
      // Adventure is currently in progress
      console.log('[AdventureWalk] Adventure is active. Checking progress...');
      if (weeklySteps >= 15000) {
        // Adventure complete - Check if it was *already* completed this week before allowing completion again (edge case)
        if (completedThisWeek) {
            console.warn('[AdventureWalk] Trying to complete an adventure already completed this week. Showing in-progress alert instead.');
             Alert.alert(
                'Adventure In Progress',
                `Keep up the great work! You've completed the adventure goal for this week. Current progress: ${weeklySteps.toLocaleString()}/15,000 steps.`,
                [{ text: 'Awesome!' }]
            );
            return; // Don't allow re-completion within the same week
        }
        
        // Mark as complete
        console.log('[AdventureWalk] Adventure goal met! Completing adventure.');
        const updatedPet = { ...petData };
        // Ensure adventure object exists before modification
        // *** FIX: Initialize with all required properties ***
        if (!updatedPet.miniGames) {
            updatedPet.miniGames = {
                feed: { lastClaimed: null, claimedToday: false },
                fetch: { lastClaimed: null, claimsToday: 0 },
                adventure: { lastStarted: null, lastCompleted: null, currentProgress: 0, isActive: false },
            };
        } else if (!updatedPet.miniGames.adventure) {
            updatedPet.miniGames.adventure = { lastStarted: null, lastCompleted: null, currentProgress: 0, isActive: false };
        }
        
        updatedPet.miniGames.adventure.isActive = false;
        updatedPet.miniGames.adventure.lastCompleted = now.toISOString();
        updatedPet.miniGames.adventure.currentProgress = 15000;
        
        // Save and update with XP reward
        updatePetWithSteps(updatedPet, 0, 300).then(async ({ updatedPet: newPet, leveledUp }) => {
          setPetData(newPet);
          // ... (Analytics and Alert logic for completion remains the same) ...
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
                // Optional: Navigate to level up screen
                // navigation.navigate('PetLevelUp', { level: newPet.level, petType: newPet.type });
              } else {
                Alert.alert(
                  'Adventure Complete',
                  'Congratulations! You completed the adventure walk with your pet! You earned 300 XP.',
                  [{ text: 'Great!' }]
                );
              }
        });
      } else {
        // Adventure in progress, goal not met
        console.log('[AdventureWalk] Adventure in progress, goal not met.');
        Alert.alert(
          'Adventure In Progress',
          `Keep walking to reach 15,000 steps this week! Current progress: ${weeklySteps.toLocaleString()}/15,000 steps.`,
          [{ text: 'Keep Walking!' }]
        );
      }
    } else {
      // Adventure is NOT currently active - User wants to start or check status
      console.log('[AdventureWalk] Adventure is not active. Checking if completed this week...');
      if (completedThisWeek) {
        // Already completed this week, cannot start a new one yet
        console.log('[AdventureWalk] Already completed this week. Cannot start new.');
        Alert.alert(
          'Adventure Already Completed',
          'You\'ve already completed an adventure walk this week. A new adventure will be available next Monday!',
          [{ text: 'OK' }]
        );
      } else {
        // Can start a new adventure
        console.log('[AdventureWalk] Starting new adventure.');
        const updatedPet = { ...petData };
        // Ensure adventure object exists before modification
        // *** FIX: Initialize with all required properties ***
        if (!updatedPet.miniGames) {
             updatedPet.miniGames = {
                feed: { lastClaimed: null, claimedToday: false },
                fetch: { lastClaimed: null, claimsToday: 0 },
                adventure: { lastStarted: null, lastCompleted: null, currentProgress: 0, isActive: false },
            };
        } else if (!updatedPet.miniGames.adventure) {
             updatedPet.miniGames.adventure = { lastStarted: null, lastCompleted: null, currentProgress: 0, isActive: false };
        }

        updatedPet.miniGames.adventure.isActive = true;
        updatedPet.miniGames.adventure.lastStarted = now.toISOString();
        updatedPet.miniGames.adventure.lastCompleted = null; // Ensure lastCompleted is null
        updatedPet.miniGames.adventure.currentProgress = weeklySteps; // Start progress from current weekly steps
        
        playSound('activity-claim'); // Or another suitable sound
        setPetData(updatedPet);
        
        Alert.alert(
          'Adventure Started!',
          'You\'ve started a new adventure walk. Walk 15,000 steps by the end of the week (Sunday night UTC) to complete it and earn 300 XP!',
          [{ text: 'Let\'s Go!' }]
        );
      }
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
  const MAX_FETCH_CLAIMS = 2;
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
              // Apply pulse animation if hinting
              isPetAnimating ? { transform: [{ scale: pulseAnim }] } : null,
              // Apply floating/shaking/breathing based on petData existence and stage
              petData ? { 
                transform: [
                  // Apply shaking ONLY if it's an egg ready to hatch
                  ...(petData.growthStage === 'Egg' && petData.totalSteps >= petData.stepsToHatch ? 
                    [{ 
                      rotate: eggShakeAnim.interpolate({
                        inputRange: [-1, 1],
                        outputRange: ['-3deg', '3deg']
                      })
                    }] : []),
                  // Apply floating transform regardless of stage (if petData exists)
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -15] // *** FIX: Increased float distance ***
                    })
                  },
                  // *** FIX: Apply breathing scale transform ***
                  {
                    scale: breathingAnim 
                  }
                ]
              } : null // No transform if no petData
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
            let activityStepsProgress = dailySteps; // Default to total daily steps

            // *** Add Logging Here ***
            console.log(`[UI Render Activity Calc] Checking hatch date. hatchDate: ${petData?.hatchDate}, dailyStepsAtHatch: ${petData?.dailyStepsAtHatch}`);
            const now = new Date(); // Define now for logging consistency
            const hatchDateObj = petData?.hatchDate ? new Date(petData.hatchDate) : null;
            const isHatchToday = hatchDateObj && isSameDay(hatchDateObj, now);
            console.log(`[UI Render Activity Calc] Current Date: ${now.toISOString()}, Parsed Hatch Date: ${hatchDateObj?.toISOString()}, Is Hatch Today?: ${isHatchToday}`);

            // *** FIX: Adjust progress calculation if hatched today ***
            if (isHatchToday) { // Use the calculated boolean
              // Use steps since hatching for display on hatch day
              activityStepsProgress = Math.max(0, dailySteps - (petData.dailyStepsAtHatch || 0));
              console.log(`[MiniGameCard Display] Hatched today. Using activityStepsProgress: ${activityStepsProgress} (daily: ${dailySteps}, atHatch: ${petData.dailyStepsAtHatch})`);
            }

            return (
              <>
                {/* Fetch Mini Game - Use adjusted activityStepsProgress */}
                <MiniGameCard
                  title="Play Fetch"
                  description={`Walk ${(fetchClaimsToday + 1) * 1000} steps to play fetch ${fetchClaimsToday === 0 ? '(first time)' : fetchClaimsToday === 1 ? '(second time)' : '(limit reached)'}.`}
                  icon="tennisball-outline"
                  stepsRequired={(fetchClaimsToday + 1) * 1000}
                  stepsProgress={activityStepsProgress} // Use the calculated value
                  isActive={canFetchToday}
                  isComplete={fetchClaimsToday >= MAX_FETCH_CLAIMS}
                  isLocked={petData.growthStage === 'Egg'}
                  onPress={() => handleMiniGamePress('fetch')}
                  color="#8C52FF"
                />

                {/* Feed Mini Game - Use adjusted activityStepsProgress */}
                <MiniGameCard
                  title="Feed Your Pet"
                  description="Walk 2,500 steps today to feed your pet."
                  icon="nutrition-outline"
                  stepsRequired={2500}
                  stepsProgress={activityStepsProgress} // Use the calculated value
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