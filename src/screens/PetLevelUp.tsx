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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Confetti from 'react-native-confetti';
import { RootStackParamList } from '../types/navigationTypes';
import PetDisplay from '../components/PetDisplay';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PetLevelUpProps = NativeStackScreenProps<RootStackParamList, 'PetLevelUp'>;

const { width, height } = Dimensions.get('window');

const PetLevelUp: React.FC<PetLevelUpProps> = ({ route, navigation }) => {
  const { level, petType } = route.params;
  const { petData } = useData();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPaywallActive, setIsPaywallActive] = useState(false);
  const confettiRef = useRef<any>(null);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Check if paywall is active
    const checkPaywallStatus = async () => {
      try {
        const paywallActive = await AsyncStorage.getItem('paywallActive');
        setIsPaywallActive(paywallActive === 'true');
      } catch (error) {
        console.error('Error checking paywall status:', error);
      }
    };
    
    checkPaywallStatus();
    
    // Play haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Load and play sound
    loadSound();
    
    // Start animations
    startAnimations();
    
    // Start confetti
    if (confettiRef.current) {
      confettiRef.current.startConfetti();
    }
    
    return () => {
      // Clean up sound
      if (sound) {
        sound.unloadAsync();
      }
      // Stop confetti
      if (confettiRef.current) {
        confettiRef.current.stopConfetti();
      }
    };
  }, []);
  
  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/level-up.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error loading sound', error);
    }
  };
  
  const startAnimations = () => {
    // Start gradient animation with a longer duration to reduce potential flickering
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slide in and scale up content with spring animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
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
    navigation.navigate('Share', {
      type: 'levelUp' as const,
      data: {
        level,
        petType,
      },
    });
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPaywallActive) {
      navigation.navigate('Paywall');
    } else {
      navigation.navigate('Main');
    }
  };
  
  const getGrowthStage = () => {
    if (level <= 1) return 'Egg';
    if (level === 2) return 'Baby';
    if (level === 3) return 'Juvenile';
    return 'Adult';
  };

  const hasEvolved = () => {
    const currentStage = getGrowthStage();
    const previousStage = level > 1 ? (level === 2 ? 'Egg' : level === 3 ? 'Baby' : 'Juvenile') : 'Egg';
    return currentStage !== previousStage;
  };

  const getEvolutionMessage = () => {
    const currentStage = getGrowthStage();
    const previousStage = level > 1 ? (level === 2 ? 'Egg' : level === 3 ? 'Baby' : 'Juvenile') : 'Egg';
    
    if (currentStage === 'Juvenile') return 'Your pet has grown into a juvenile!';
    if (currentStage === 'Adult') return 'Your pet has reached adulthood!';
    return '';
  };

  const gradientColors = gradientAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#8C52FF', '#6236B0', '#8C52FF'],
  });
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#8C52FF', '#6236B0']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.starsContainer}>
          {/* Add subtle star shapes in the background */}
          <Ionicons name="star" size={20} color="rgba(255,255,255,0.2)" style={styles.star1} />
          <Ionicons name="star" size={16} color="rgba(255,255,255,0.15)" style={styles.star2} />
          <Ionicons name="star" size={24} color="rgba(255,255,255,0.25)" style={styles.star3} />
        </View>
      </LinearGradient>

      <Confetti ref={confettiRef} />
      
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
          <BlurView intensity={20} style={styles.skipButtonBlur}>
            <Text style={styles.skipText}>Skip</Text>
          </BlurView>
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
            petType={petType}
            growthStage={getGrowthStage()}
            size="xlarge"
            showEquippedItems={true}
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.infoContainer,
            { opacity: opacityAnim },
          ]}
        >
          <BlurView intensity={60} style={styles.blurContainer}>
            <View style={styles.cardContent}>
              <Text style={styles.congratsText}>Level Up!</Text>
              <Text style={styles.levelText}>{petData?.name} has reached level {level}!</Text>
              
              {hasEvolved() && (
                <View style={styles.evolutionContainer}>
                  <Text style={styles.evolutionText}>{getEvolutionMessage()}</Text>
                </View>
              )}
              
              <Button
                title="Share Your Achievement"
                onPress={handleContinue}
                size="large"
                style={styles.button}
                textStyle={styles.buttonText}
                icon={<Ionicons name="share-social-outline" size={20} color="#8C52FF" />}
              />
              
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.continueButton}
              >
                <Text style={styles.continueText}>Continue without sharing</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  star1: {
    position: 'absolute',
    top: '15%',
    left: '25%',
  },
  star2: {
    position: 'absolute',
    top: '35%',
    right: '20%',
  },
  star3: {
    position: 'absolute',
    bottom: '30%',
    left: '15%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    overflow: 'hidden',
    borderRadius: 20,
  },
  skipButtonBlur: {
    padding: 10,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  petContainer: {
    marginBottom: 30,
  },
  infoContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  congratsText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    color: '#8C52FF',
    fontWeight: '600',
  },
  continueButton: {
    padding: 10,
  },
  continueText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  evolutionContainer: {
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(140, 82, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(140, 82, 255, 0.3)',
  },
  evolutionText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default PetLevelUp; 