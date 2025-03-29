import React, { useState, useEffect, useRef, useContext } from 'react';
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
import { DataContext } from '../context/DataContext';
import Button from '../components/Button';

type MilestoneUnlockedProps = NativeStackScreenProps<RootStackParamList, 'MilestoneUnlocked'>;
type MilestoneUnlockedNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const MilestoneUnlocked: React.FC<MilestoneUnlockedProps> = ({ route }) => {
  const { milestoneId } = route.params;
  const navigation = useNavigation<MilestoneUnlockedNavigationProp>();
  const { petData } = useContext(DataContext);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Find the milestone
  const milestone = petData?.milestones.find(m => m.id === milestoneId);
  
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
  
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to the Share screen if the user wants to share
    navigation.navigate('Share', {
      type: 'milestone',
      data: {
        milestoneId,
        steps: milestone?.steps,
        reward: milestone?.reward,
        rewardDetails: milestone?.rewardDetails,
      },
    });
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Main');
  };
  
  // Get milestone icon
  const getMilestoneIcon = () => {
    if (!milestone) return 'trophy-outline';
    
    switch (milestone.reward) {
      case 'xp':
        return 'flash-outline';
      case 'appearance':
        return 'color-palette-outline';
      case 'background':
        return 'image-outline';
      case 'animation':
        return 'sparkles-outline';
      case 'badge':
        return 'shield-checkmark-outline';
      default:
        return 'trophy-outline';
    }
  };
  
  // Determine milestone color
  const getMilestoneColor = () => {
    if (!milestone) return '#8C52FF';
    
    switch (milestone.reward) {
      case 'xp':
        return '#FF9500';
      case 'appearance':
        return '#FF2D55';
      case 'background':
        return '#34C759';
      case 'animation':
        return '#5856D6';
      case 'badge':
        return '#FF9500';
      default:
        return '#8C52FF';
    }
  };
  
  const milestoneColor = getMilestoneColor();
  
  return (
    <View style={[styles.container, { backgroundColor: milestoneColor }]}>
      <StatusBar style="light" />
      
      {/* Stars animation */}
      <Animated.View
        style={[
          styles.starsContainer,
          { opacity: starsOpacity }
        ]}
      >
        <LottieView
          source={require('../../assets/animations/stars.json')}
          autoPlay
          loop
          style={styles.stars}
        />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              { translateX: slideAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: scaleAnim },
              ],
              backgroundColor: milestoneColor,
            },
          ]}
        >
          <Ionicons name={getMilestoneIcon() as any} size={80} color="#FFFFFF" />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.infoContainer,
            { opacity: opacityAnim },
          ]}
        >
          <Text style={styles.congratsText}>Milestone Unlocked!</Text>
          <Text style={styles.milestoneText}>
            {milestone?.steps.toLocaleString()} Steps Reached
          </Text>
          
          <View style={styles.rewardContainer}>
            <Text style={styles.rewardTitle}>Your Reward:</Text>
            <Text style={[styles.rewardText, { color: milestoneColor }]}>
              {milestone?.rewardDetails}
            </Text>
            
            <View style={styles.rewardDescription}>
              {milestone?.reward === 'xp' && (
                <Text style={styles.descriptionText}>
                  You've earned a significant XP boost to help level up your pet faster!
                </Text>
              )}
              
              {milestone?.reward === 'appearance' && (
                <Text style={styles.descriptionText}>
                  Your pet now has a special appearance upgrade! Check it out in the Pet Details.
                </Text>
              )}
              
              {milestone?.reward === 'background' && (
                <Text style={styles.descriptionText}>
                  You've unlocked a special themed background for your pet's home!
                </Text>
              )}
              
              {milestone?.reward === 'animation' && (
                <Text style={styles.descriptionText}>
                  Your pet can now perform a unique animation! Try tapping on your pet.
                </Text>
              )}
              
              {milestone?.reward === 'badge' && (
                <Text style={styles.descriptionText}>
                  You've earned an elite badge and animated background for your exceptional walking achievements!
                </Text>
              )}
            </View>
          </View>
          
          <Button
            title="Share Your Achievement"
            onPress={handleContinue}
            size="large"
            style={styles.button}
            icon={<Ionicons name="share-social-outline" size={20} color="#FFFFFF" />}
          />
          
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>Continue without sharing</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8C52FF',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  stars: {
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
  skipButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    padding: 10,
  },
  skipText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#8C52FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  congratsText: {
    fontFamily: 'Caprasimo-Regular',
    fontSize: 28,
    color: '#333333',
    marginBottom: 8,
  },
  milestoneText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#333333',
    marginBottom: 24,
  },
  rewardContainer: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  rewardTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  rewardText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    marginBottom: 16,
  },
  rewardDescription: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  descriptionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
  continueButton: {
    padding: 10,
  },
  continueText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
  },
});

export default MilestoneUnlocked; 