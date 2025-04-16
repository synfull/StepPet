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
import { isSameDay } from '../utils/dateUtils';
import PetDisplay from '../components/PetDisplay';
import ProgressBar from '../components/ProgressBar';
import MiniGameCard from '../components/MiniGameCard';
import Button from '../components/Button';
import { PetData, GrowthStage } from '../types/petTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { sendEggHatchingNotification } from '../utils/notificationUtils';
import { supabase } from '../lib/supabase';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const dailySteps = await fetchDailySteps(petCreationTime);
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

const Home: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const { petData, setPetData } = useData();
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
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const eggShakeAnim = useRef(new Animated.Value(0)).current;
  const buttonShakeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  const appState = useRef(AppState.currentState);
  
  // Welcome screen animations
  useEffect(() => {
    if (!petData) {
      // Fade in and slide up animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    }
  }, [petData]);
  
  // Pedometer subscription
  useEffect(() => {
    if (isAvailable && petData) {
      // Use the pet's creation time as the start time for counting steps
      const petCreationTime = new Date(petData.created);
      
      const subscription = subscribeToPedometer(async (steps: number) => {
        // For new eggs, calculate steps since creation
        if (petData.growthStage === 'Egg') {
          const dailySteps = await fetchDailySteps(petCreationTime);
          const stepsSinceCreation = Math.max(0, dailySteps - (petData.startingStepCount || 0));
          setDailySteps(stepsSinceCreation);
          setTotalSteps(stepsSinceCreation);

          // Check if egg is ready to hatch
          if (stepsSinceCreation >= petData.stepsToHatch) {
            console.log('Egg is ready to hatch in pedometer subscription!');
            // Check if we've already sent a notification for this egg
            const hasSentNotification = await AsyncStorage.getItem(`egg_hatching_notification_${petData.id}`);
            if (!hasSentNotification) {
              console.log('Sending hatching notification from pedometer...');
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user?.id) {
                await sendEggHatchingNotification(session.user.id, petData.name);
                await AsyncStorage.setItem(`egg_hatching_notification_${petData.id}`, 'true');
                console.log('Hatching notification sent from pedometer');
              }
            }
          }
        } else {
          // For hatched pets, calculate XP based on new steps since hatching
          const stepsAfterHatch = Math.max(0, steps - petData.stepsSinceHatched);
          setDailySteps(steps);
          if (stepsAfterHatch !== petData.xp) {
            setTotalSteps(steps);
          }
        }
      }, petCreationTime);

      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    }
  }, [isAvailable, petData]);
  
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
      Animated.timing(buttonShakeAnim, {
        toValue: 2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonShakeAnim, {
        toValue: -2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonShakeAnim, {
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
    if (petData?.growthStage === 'Egg' && dailySteps >= petData.stepsToHatch) {
      startShakeAnimations();
    }
  }, [petData?.growthStage, dailySteps]);
  
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
    if (!isAvailable || !petData) return;
    
    try {
      // Use the pet's creation time as the start time for counting steps
      const petCreationTime = new Date(petData.created);
      const daily = await fetchDailySteps(petCreationTime);
      const weekly = await fetchWeeklySteps(petCreationTime);
      
      // For new eggs, only count steps after creation time
      if (petData.growthStage === 'Egg') {
        const stepsSinceCreation = Math.max(0, daily - (petData.startingStepCount || 0));
        setDailySteps(stepsSinceCreation);
        setWeeklySteps(weekly);
        setTotalSteps(stepsSinceCreation);
      } else {
        // For hatched pets, calculate XP based on new steps since hatching
        setDailySteps(daily);
        setWeeklySteps(weekly);
        
        const stepsAfterHatch = Math.max(0, daily - petData.stepsSinceHatched);
        const newXP = Math.min(stepsAfterHatch, petData.xpToNextLevel);
        
        // Check for level up
        if (newXP >= petData.xpToNextLevel) {
          const { updatedPet: leveledPet, leveledUp } = await updatePetWithSteps(petData, 0);
          // Preserve only the type after level up
          const preservedPet = {
            ...leveledPet,
            type: petData.type
          };
          setPetData(preservedPet);
          setTotalSteps(preservedPet.totalSteps);
          
          if (leveledUp) {
            navigation.navigate('PetLevelUp', { 
              level: preservedPet.level,
              petType: preservedPet.type 
            });
          }
        } else {
          // Just update XP without level up
          const updatedPet = {
            ...petData,
            xp: newXP,
            totalSteps: daily
          };
          await savePetData(updatedPet);
          setPetData(updatedPet);
          setTotalSteps(updatedPet.totalSteps);
        }
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
      await savePetData(newPet);
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
    if (showPulseHint) {
      setShowPulseHint(false);
      try {
        await AsyncStorage.setItem('hasInteractedWithPet', 'true');
        setHasInteractedWithPet(true);
      } catch (error) {
        console.error('Error saving interaction status:', error);
      }
    }
    
    if (petData?.growthStage === 'Egg') {
      if (dailySteps >= petData.stepsToHatch) {
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
            totalSteps: dailySteps,
            stepsSinceHatched: dailySteps,
            xp: 0,
            xpToNextLevel: LEVEL_REQUIREMENTS[0], // Use first level requirement
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
            }
          };
          
          // Update pet data to reflect hatching
          const { updatedPet: hatchedPet } = await updatePetWithSteps(updatedPet, 0);
          setPetData(hatchedPet);
          setTotalSteps(dailySteps);
          navigation.navigate('PetHatching', {
            petType: hatchedPet.type
          });
        } catch (error) {
          console.error('Error hatching egg:', error);
          Alert.alert(
            'Error',
            'There was a problem hatching your egg. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Not Ready to Hatch',
          `Your egg needs ${petData.stepsToHatch - dailySteps} more steps to hatch! Keep walking to help it grow.`,
          [{ text: 'OK' }]
        );
      }
    } else {
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
    if (!petData || petData.growthStage === 'Egg') {
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
    const lastFed = petData.miniGames.feed.lastClaimed 
      ? new Date(petData.miniGames.feed.lastClaimed) 
      : null;
    
    if (lastFed && isSameDay(lastFed, now) && petData.miniGames.feed.claimedToday) {
      Alert.alert(
        'Already Fed Today',
        'You have already fed your pet today. Come back tomorrow!',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if enough steps
    if (dailySteps < 2500) {
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
    updatedPet.xp += 100;
    
    // Check for level up
    if (updatedPet.xp >= updatedPet.xpToNextLevel) {
      Alert.alert(
        'Pet Fed',
        'Your pet is happy and well-fed! You earned 100 XP, which leveled up your pet!',
        [{ text: 'Great!' }]
      );
      
      // Save and update
      updatePetWithSteps(petData, 0).then(({ updatedPet, leveledUp }) => {
        setPetData(updatedPet);
        
        if (leveledUp) {
          navigation.navigate('PetLevelUp', { 
            level: updatedPet.level,
            petType: updatedPet.type 
          });
        }
      });
    } else {
      // Just add XP, no level up
      Alert.alert(
        'Pet Fed',
        'Your pet is happy and well-fed! You earned 100 XP.',
        [{ text: 'Great!' }]
      );
      
      setPetData(updatedPet);
      // Save the updated pet
      updatePetWithSteps(petData, 0);
    }
  };
  
  // Handle fetch game
  const handleFetchGame = () => {
    if (!petData) return;
    
    // Check fetch claims today
    const claims = petData.miniGames.fetch.claimsToday || 0;
    if (claims >= 2) {
      Alert.alert(
        'Fetch Limit Reached',
        'Your pet has already played fetch twice today. Come back tomorrow!',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if enough steps
    const stepsNeeded = (claims + 1) * 1000; // 1000 steps for first claim, 2000 for second
    if (dailySteps < stepsNeeded) {
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
    
    // Update claims
    updatedPet.miniGames.fetch.claimsToday = claims + 1;
    updatedPet.miniGames.fetch.lastClaimed = now.toISOString();
    updatedPet.xp += 50;
    
    // Check for level up
    if (updatedPet.xp >= updatedPet.xpToNextLevel) {
      Alert.alert(
        'Fetch Complete',
        'Your pet had fun playing fetch! You earned 50 XP, which leveled up your pet!',
        [{ text: 'Great!' }]
      );
      
      // Save and update
      updatePetWithSteps(petData, 0).then(({ updatedPet, leveledUp }) => {
        setPetData(updatedPet);
        
        if (leveledUp) {
          navigation.navigate('PetLevelUp', { 
            level: updatedPet.level,
            petType: updatedPet.type 
          });
        }
      });
    } else {
      // Just add XP, no level up
      Alert.alert(
        'Fetch Complete',
        'Your pet had fun playing fetch! You earned 50 XP.',
        [{ text: 'Great!' }]
      );
      
      setPetData(updatedPet);
      // Save the updated pet
      updatePetWithSteps(petData, 0);
    }
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
        updatedPet.xp += 300;
        
        // Check for level up
        if (updatedPet.xp >= updatedPet.xpToNextLevel) {
          Alert.alert(
            'Adventure Complete',
            'Congratulations! You completed the adventure walk with your pet! You earned 300 XP, which leveled up your pet!',
            [{ text: 'Great!' }]
          );
          
          // Save and update
          updatePetWithSteps(petData, 0).then(({ updatedPet, leveledUp }) => {
            setPetData(updatedPet);
            
            if (leveledUp) {
              navigation.navigate('PetLevelUp', { 
                level: updatedPet.level,
                petType: updatedPet.type 
              });
            }
          });
        } else {
          // Just add XP, no level up
          Alert.alert(
            'Adventure Complete',
            'Congratulations! You completed the adventure walk with your pet! You earned 300 XP.',
            [{ text: 'Great!' }]
          );
          
          setPetData(updatedPet);
          // Save the updated pet
          updatePetWithSteps(petData, 0);
        }
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
      
      setPetData(updatedPet);
      // Save the updated pet
      updatePetWithSteps(petData, 0);
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
      return {
        progress: dailySteps / petData.stepsToHatch,
        currentValue: dailySteps,
        maxValue: petData.stepsToHatch
      };
    } else {
      return {
        progress: petData.xp / petData.xpToNextLevel,
        currentValue: petData.xp,
        maxValue: petData.xpToNextLevel
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
        
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 1 * 60, // 1 minute for testing
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('Background task registered successfully');
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
  
  // If no pet data, show pet selection screen
  if (!petData) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.emptyContainer}>
          <Animated.View 
            style={[
              styles.welcomeContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.emptyTitle}>Welcome to StepPet!</Text>
            <Text style={styles.emptyText}>
              Looks like you don't have a pet yet. Let's get started by hatching an egg!
            </Text>
            <Button
              title="Get Your Egg"
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const newPet = await createNewPet(0, '', 'mythic', 'Egg');
                await savePetData(newPet);
                setPetData(newPet);
                // Reset step counters to 0 since we're starting fresh
                setDailySteps(0);
                setWeeklySteps(0);
                setTotalSteps(0);
              }}
              size="large"
              style={styles.startButton}
            />
          </Animated.View>
        </View>
      </View>
    );
  }
  
  // Determine feed status
  const canFeedToday = !petData.miniGames.feed.claimedToday || 
    !isSameDay(new Date(petData.miniGames.feed.lastClaimed || ''), new Date());
  
  // Determine fetch status
  const fetchClaimsToday = petData.miniGames.fetch.claimsToday || 0;
  const canFetchToday = fetchClaimsToday < 2;
  
  // Determine adventure status
  const adventureActive = petData.miniGames.adventure.isActive;
  const adventureComplete = petData.miniGames.adventure.lastCompleted 
    ? Math.floor((new Date().getTime() - new Date(petData.miniGames.adventure.lastCompleted).getTime()) 
      / (1000 * 60 * 60 * 24)) < 7
    : false;
  
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
          <View style={styles.headerButtons}>
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
              petData?.appearance.nameColor && { color: petData.appearance.nameColor }
            ]}>
              {petData?.name}
            </Text>
            <Text style={styles.petTypeText}>
              {petData.growthStage === 'Egg' ? 'Egg' : PET_TYPES[petData.type].name}
              {petData.appearance.hasEliteBadge && (
                <Ionicons name="shield-checkmark" size={20} color="#8C52FF" style={styles.badgeIcon} />
              )}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                Level {petData.growthStage === 'Egg' ? '0' : petData.level}
              </Text>
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Level Progress</Text>
              <ProgressBar
                progress={progressData.progress}
                height={12}
                fillColor="#8C52FF"
                backgroundColor="#E0E0E0"
                borderRadius={6}
                animated={petData.appearance.hasAnimatedBackground}
                showLabel
                labelStyle="outside"
                labelFormat="fraction"
                currentValue={progressData.currentValue}
                maxValue={progressData.maxValue}
              />
              {petData.growthStage === 'Egg' ? (
                <>
                  <Text style={styles.progressHint}>
                    Reach {petData.stepsToHatch} steps to hatch your egg!
                  </Text>
                  {dailySteps >= petData.stepsToHatch && (
                    <Animated.View style={{
                      transform: [{
                        translateX: buttonShakeAnim
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
          <Text style={styles.sectionTitle}>Daily Activities</Text>
          
          {/* Fetch Mini Game */}
          <MiniGameCard
            title="Play Fetch"
            description={`Walk ${(fetchClaimsToday + 1) * 1000} steps to play fetch ${fetchClaimsToday === 0 ? '(first time)' : '(second time)'}.`}
            icon="tennisball-outline"
            stepsRequired={(fetchClaimsToday + 1) * 1000}
            stepsProgress={dailySteps}
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
            stepsProgress={dailySteps}
            isActive={canFeedToday}
            isComplete={!canFeedToday}
            isLocked={petData.growthStage === 'Egg'}
            onPress={() => handleMiniGamePress('feed')}
            color="#8C52FF"
          />
          
          {/* Adventure Walk */}
          <MiniGameCard
            title="Adventure Walk"
            description="Walk 15,000 steps this week to take your pet on a special adventure."
            icon="map-outline"
            stepsRequired={15000}
            stepsProgress={adventureActive ? weeklySteps : 0}
            isActive={!adventureComplete && !adventureActive}
            isComplete={adventureComplete}
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
    justifyContent: 'space-between',
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
    marginBottom: 24,
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
    textAlign: 'center',
    marginTop: 8,
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
});

export default Home; 