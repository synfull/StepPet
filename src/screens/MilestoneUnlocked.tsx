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
import PetDisplay from '../components/PetDisplay';

type MilestoneUnlockedProps = NativeStackScreenProps<RootStackParamList, 'MilestoneUnlocked'>;
type MilestoneUnlockedNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const MilestoneUnlocked: React.FC<MilestoneUnlockedProps> = ({ route }) => {
  const { milestoneId } = route.params;
  const navigation = useNavigation<MilestoneUnlockedNavigationProp>();
  const { petData } = useContext(DataContext);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showSpecialAnimation, setShowSpecialAnimation] = useState(false);
  
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
    
    // Trigger special animation for 200-step milestone
    if (milestoneId === '200_steps') {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Main', { screen: 'Home' });
  };
  
  if (!petData) {
    return null;
  }
  
  return (
    <View style={styles.container}>
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
            styles.petContainer,
            {
              transform: [
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <PetDisplay
            petType={petData.type}
            growthStage={petData.growthStage}
            level={petData.level}
            mainColor={petData.appearance.mainColor}
            accentColor={petData.appearance.accentColor}
            hasCustomization={petData.appearance.hasCustomization}
            size="xlarge"
            interactive={false}
            specialAnimation={showSpecialAnimation}
          />
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
          <Text style={styles.descriptionText}>
            {milestone?.reward === 'animation' ? 
              "Your pet can now perform a special animation! Try tapping on your pet." :
              "Congratulations on reaching this milestone!"}
          </Text>
          
          <Button
            title="Continue"
            onPress={handleSkip}
            type="primary"
            size="large"
          />
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
  petContainer: {
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
  descriptionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default MilestoneUnlocked; 