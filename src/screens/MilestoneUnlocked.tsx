import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import { RootStackParamList } from '../types/navigationTypes';
import { useData } from '../context/DataContext';
import Button from '../components/Button';
import PetDisplay from '../components/PetDisplay';

type MilestoneUnlockedProps = NativeStackScreenProps<RootStackParamList, 'MilestoneUnlocked'>;
type MilestoneUnlockedNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const MilestoneUnlocked: React.FC<MilestoneUnlockedProps> = ({ route }) => {
  const { milestone } = route.params;
  const navigation = useNavigation<MilestoneUnlockedNavigationProp>();
  const { petData } = useData();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showSpecialAnimation, setShowSpecialAnimation] = useState(false);
  
  // Find the milestone
  const milestoneData = petData?.milestones.find(m => m.id === milestone.id);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const starsOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Play haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Load and play sound
    loadSound();
    
    // Start animations
    startAnimations();
    
    // Trigger special animation for 200-step milestone
    if (milestone.id === '200_steps') {
      setShowSpecialAnimation(true);
    }
    
    return () => {
      // Clean up sound
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);
  
  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/milestone-unlocked.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error loading sound', error);
    }
  };
  
  const startAnimations = () => {
    // Show stars first
    Animated.timing(starsOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Then slide in the content
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handleSkip = () => {
    navigation.navigate('Main');
  };
  
  if (!petData || !milestoneData) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Stars background animation */}
      <Animated.View style={[styles.starsContainer, { opacity: starsOpacity }]}>
        <LottieView
          source={require('../../assets/animations/stars.json')}
          autoPlay
          loop
          style={styles.starsAnimation}
        />
      </Animated.View>
      
      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={
                milestoneData.reward === 'xp' ? 'trophy' :
                milestoneData.reward === 'appearance' ? 'color-palette' :
                milestoneData.reward === 'background' ? 'image' :
                milestoneData.reward === 'animation' ? 'sparkles' :
                milestoneData.reward === 'badge' ? 'shield-checkmark' :
                'ribbon'
              }
              size={40}
              color="#8C52FF"
            />
          </View>

          <Text style={styles.title}>Milestone Achieved!</Text>
          
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsCount}>
              {milestoneData.steps.toLocaleString()}
            </Text>
            <Text style={styles.stepsLabel}>Steps Reached</Text>
          </View>
          
          <View style={styles.petContainer}>
            <PetDisplay
              petType={petData.type}
              growthStage={petData.growthStage}
              size="large"
              showEquippedItems
            />
          </View>
          
          <View style={styles.rewardContainer}>
            <Text style={styles.rewardTitle}>Reward Unlocked</Text>
            <Text style={styles.rewardDescription}>
              {milestoneData.reward === 'animation' ? 
                "Your pet can now perform a special animation! Try tapping on your pet." :
                milestoneData.rewardDetails}
            </Text>
          </View>
          
          <Button
            title="Claim Reward"
            onPress={handleSkip}
            style={styles.button}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  starsAnimation: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepsCount: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 36,
    color: '#8C52FF',
    marginBottom: 4,
  },
  stepsLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#666666',
  },
  petContainer: {
    marginBottom: 24,
  },
  rewardContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  rewardTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  rewardDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#8C52FF',
  },
});

export default MilestoneUnlocked; 