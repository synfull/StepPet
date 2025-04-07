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
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { PedometerContext } from '../context/PedometerContext';
import { RootStackParamList } from '../types/navigationTypes';
import { updatePetWithSteps, createNewPet, savePetData, PET_TYPES } from '../utils/petUtils';
import { fetchDailySteps, fetchWeeklySteps, subscribeToPedometer } from '../utils/pedometerUtils';
import { isSameDay } from '../utils/dateUtils';
import PetDisplay from '../components/PetDisplay';
import ProgressBar from '../components/ProgressBar';
import MiniGameCard from '../components/MiniGameCard';
import Button from '../components/Button';
import { getRandomPetType } from '../utils/petUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetData, GrowthStage } from '../types/petTypes';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Home: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const { petData, setPetData, isDevelopmentMode } = useData();
  const { 
    isAvailable, 
    dailySteps, 
    weeklySteps, 
    totalSteps,
    setDailySteps,
    setWeeklySteps,
    setTotalSteps
  } = useContext(PedometerContext);
  
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [showPulseHint, setShowPulseHint] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Pedometer subscription
  useEffect(() => {
    if (isAvailable && petData && !isDevelopmentMode) {
      // Use the pet's creation time as the start time for counting steps
      const petCreationTime = new Date(petData.created);
      const subscription = subscribeToPedometer((steps) => {
        // Always set daily steps directly from the pedometer
        setDailySteps(steps);
        
        // Update total steps based on pet stage
        if (petData.growthStage === 'Egg') {
          setTotalSteps(steps);
        } else {
          // For hatched pets, calculate XP based on new steps since hatching
          const stepsAfterHatch = Math.max(0, steps - petData.stepsSinceHatched);
          // Only update pet data if XP has actually changed
          if (stepsAfterHatch !== petData.xp) {
            const newXP = Math.min(stepsAfterHatch, petData.xpToNextLevel);
            if (newXP !== petData.xp) {
              // Check if this will cause a level up
              if (newXP >= petData.xpToNextLevel) {
                // Handle level up through updatePetWithSteps
                updatePetWithSteps(petData, newXP - petData.xp).then(({ updatedPet, leveledUp }) => {
                  // Preserve type and growth stage after level up
                  const preservedPet = {
                    ...updatedPet,
                    type: petData.type,
                    growthStage: petData.growthStage,
                  };
                  setPetData(preservedPet);
                  if (leveledUp) {
                    navigation.navigate('PetLevelUp', {
                      level: preservedPet.level,
                      petType: preservedPet.type
                    });
                  }
                });
              } else {
                // Just update XP without level up, preserving type and growth stage
                const updatedPet: PetData = {
                  ...petData,
                  xp: newXP
                };
                setPetData(updatedPet);
                // Save the updated pet
                savePetData(updatedPet);
              }
            }
          }
          setTotalSteps(petData.totalSteps);
        }
      }, petCreationTime);
      
      // Cleanup subscription on unmount
      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    }
  }, [isAvailable, petData?.id, petData?.stepsSinceHatched, petData?.xpToNextLevel, isDevelopmentMode]);
  
  // Refresh data periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshStepData();
    }, 15 * 60 * 1000); // Refresh every 15 minutes
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Show pulse hint after a delay
  useEffect(() => {
    if (petData && petData.growthStage !== 'Egg') {
      const timeoutId = setTimeout(() => {
        setShowPulseHint(true);
        startPulseAnimation();
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [petData]);
  
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
  
  // Refresh step data
  const refreshStepData = async () => {
    if (!isAvailable || !petData) return;
    
    try {
      // Use the pet's creation time as the start time for counting steps
      const petCreationTime = new Date(petData.created);
      const daily = await fetchDailySteps(petCreationTime);
      const weekly = await fetchWeeklySteps();
      
      // Update daily and weekly steps
      setDailySteps(daily);
      setWeeklySteps(weekly);
      setLastRefreshed(new Date());
      
      // Calculate new steps since last refresh
      const lastTotal = totalSteps;
      const newSteps = daily - lastTotal;
      
      if (newSteps > 0) {
        // For hatched pets, calculate XP based on new steps since hatching
        if (petData.growthStage !== 'Egg') {
          const stepsAfterHatch = Math.max(0, daily - petData.stepsSinceHatched);
          const newXP = Math.min(stepsAfterHatch, petData.xpToNextLevel);
          
          // Update pet with new XP, preserving type and growth stage
          const updatedPet = { 
            ...petData,
            xp: newXP,
            totalSteps: daily,
          };
          
          // Check for level up
          if (newXP >= petData.xpToNextLevel) {
            const { updatedPet: leveledPet, leveledUp } = await updatePetWithSteps(updatedPet, 0);
            // Preserve type and growth stage after level up
            const preservedPet = {
              ...leveledPet,
              type: petData.type,
              growthStage: petData.growthStage,
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
            await savePetData(updatedPet);
            setPetData(updatedPet);
            setTotalSteps(updatedPet.totalSteps);
          }
        } else {
          // For eggs, just update total steps while preserving type
          const { updatedPet, leveledUp, milestoneReached } = await updatePetWithSteps(petData, newSteps);
          // Preserve type if it exists
          const preservedPet = {
            ...updatedPet,
            type: petData.type || updatedPet.type,
          };
          setPetData(preservedPet);
          setTotalSteps(preservedPet.totalSteps);
          
          if (leveledUp) {
            navigation.navigate('PetLevelUp', { 
              level: preservedPet.level,
              petType: preservedPet.type 
            });
          }
          
          if (milestoneReached) {
            const milestone = preservedPet.milestones.find(m => m.id === milestoneReached);
            if (milestone) {
              navigation.navigate('MilestoneUnlocked', { 
                milestone: milestone 
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing step data:', error);
    }
  };
  
  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStepData();
    setRefreshing(false);
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
      
      // Create a new pet with current steps
      const newPet = await createNewPet(dailySteps);
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
      pulseAnim.stopAnimation();
    }
    
    if (petData?.growthStage === 'Egg') {
      if (dailySteps >= 25) {
        try {
          // Update pet data to reflect hatching
          const { type: randomPetType } = getRandomPetType();
          const updatedPet = {
            ...petData,
            type: randomPetType,
            growthStage: 'Baby' as const, // Set growth stage to Baby
            totalSteps: dailySteps,
            stepsSinceHatched: dailySteps,
            xp: 0,
            xpToNextLevel: 25, // Reset XP to next level
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
                lastStarted: null,
                lastCompleted: null,
                currentProgress: 0,
                isActive: false
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
          `Your egg needs ${25 - dailySteps} more steps to hatch! Keep walking to help it grow.`,
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
        progress: dailySteps / 25,
        currentValue: dailySteps,
        maxValue: 25
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
  
  // If no pet data, show pet selection screen
  if (!petData) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Welcome to StepPet!</Text>
          <Text style={styles.emptyText}>
            Looks like you don't have a pet yet. Let's get started by hatching an egg!
          </Text>
          <Button
            title="Get Your Egg"
            onPress={async () => {
              const newPet = await createNewPet(dailySteps);
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
            refreshing={refreshing}
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
              onPress={async () => {
                const success = await clearAppData();
                if (success) {
                  Alert.alert(
                    'Data Cleared',
                    'All app data has been cleared. You can now start fresh!',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert(
                    'Error',
                    'Failed to clear app data. Please try again.',
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
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
          <Animated.View 
            style={[
              styles.petContainer,
              showPulseHint ? { transform: [{ scale: pulseAnim }] } : null
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
            <Text style={styles.petName}>{petData.name}</Text>
            <Text style={styles.petType}>
              Level {petData.level} {petData.growthStage === 'Egg' ? 'Egg' : PET_TYPES[petData.type].name}
              {petData.appearance.hasEliteBadge && (
                <Ionicons name="shield-checkmark" size={20} color="#8C52FF" style={styles.badgeIcon} />
              )}
            </Text>
            <View style={styles.progressContainer}>
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
                    Reach 25 steps to hatch your egg!
                  </Text>
                  {dailySteps >= 25 && (
                    <TouchableOpacity 
                      style={styles.hatchButton}
                      onPress={handlePetTap}
                    >
                      <Text style={styles.hatchButtonText}>Hatch Egg</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Text style={styles.progressHint}>
                  Walk {progressData.maxValue - progressData.currentValue} more steps to reach level {petData.level + 1}!
                </Text>
              )}
            </View>
          </View>
        </View>
        
        {/* Mini Games Section */}
        <View style={styles.miniGamesSection}>
          <Text style={styles.sectionTitle}>Daily Activities</Text>
          
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
            color="#FF9500"
          />
          
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
            color="#34C759"
          />
          
          {/* Adventure Walk */}
          <MiniGameCard
            title="Adventure Walk"
            description="Walk 15,000 steps this week for a special adventure."
            icon="map-outline"
            stepsRequired={15000}
            stepsProgress={adventureActive ? weeklySteps : 0}
            isActive={!adventureComplete && !adventureActive}
            isComplete={adventureComplete}
            isLocked={petData.growthStage === 'Egg'}
            onPress={() => handleMiniGamePress('adventure')}
            color="#5856D6"
          />
        </View>
        
        {/* Last refreshed indicator */}
        <View style={styles.refreshInfo}>
          <Text style={styles.refreshText}>
            Last updated: {lastRefreshed.toLocaleTimeString()}
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
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'Caprasimo-Regular',
    fontSize: 24,
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  startButton: {
    marginTop: 20,
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
  petType: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  progressContainer: {
    width: '100%',
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
});

export default Home; 