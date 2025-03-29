import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import { RootStackParamList } from '../types/navigationTypes';
import Button from '../components/Button';
import { getRandomPetType } from '../utils/petUtils';

type PetHatchingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

// Pet baby images mapping
const PET_BABY_IMAGES: { [key: string]: ImageSourcePropType } = {
  Dragon: require('../../assets/images/pets/dragon_baby.png'),
  Wolf: require('../../assets/images/pets/wolf_baby.png'),
  Eagle: require('../../assets/images/pets/eagle_baby.png'),
  Unicorn: require('../../assets/images/pets/unicorn_baby.png'),
  WaterTurtle: require('../../assets/images/pets/waterturtle_baby.png'),
  FireLizard: require('../../assets/images/pets/firelizard_baby.png'),
  RobotDog: require('../../assets/images/pets/robotdog_baby.png'),
  ClockworkBunny: require('../../assets/images/pets/clockworkbunny_baby.png'),
};

const PetHatching: React.FC = () => {
  const navigation = useNavigation<PetHatchingNavigationProp>();
  const [animationState, setAnimationState] = useState<'idle' | 'cracking' | 'hatched'>('idle');
  const [selectedPet, setSelectedPet] = useState<{ type: string; category: string } | null>(null);
  const crackingAnim = useRef(new Animated.Value(0)).current;
  const hatchedAnim = useRef(new Animated.Value(0)).current;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Animations
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    startIdleAnimation();
    
    // Determine random pet on load but don't reveal yet
    const { type, category } = getRandomPetType();
    setSelectedPet({ type, category });
    
    // Load sound
    loadSound();
    
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
        require('../../assets/sounds/egg-crack.mp3')
      );
      setSound(sound);
    } catch (error) {
      console.error('Error loading sound', error);
    }
  };
  
  const playSound = async () => {
    if (sound) {
      try {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch (error) {
        console.error('Error playing sound', error);
      }
    }
  };
  
  const startIdleAnimation = () => {
    // Subtle continuous shake animation for idle state
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  const startHatchingAnimation = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Play sound
    playSound();
    
    // Stop idle animation
    shakeAnimation.stopAnimation();
    
    // Set state to cracking
    setAnimationState('cracking');
    
    // Cracking animation
    Animated.sequence([
      Animated.timing(crackingAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(hatchedAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Hatch completed, show pet
      setAnimationState('hatched');
      
      // Vibrate
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };
  
  const handleContinue = () => {
    if (selectedPet) {
      navigation.replace('PetNaming', {
        petType: selectedPet.type as any,
      });
    }
  };
  
  const renderContent = () => {
    switch (animationState) {
      case 'idle':
        return (
          <View style={styles.centeredContent}>
            <Animated.View
              style={[
                styles.eggContainer,
                {
                  transform: [
                    {
                      rotate: shakeAnimation.interpolate({
                        inputRange: [-1, 1],
                        outputRange: ['-5deg', '5deg'],
                      }),
                    },
                    {
                      scale: scaleAnimation,
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/images/egg.png')}
                style={styles.eggImage}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={styles.instructionText}>
              Tap the egg to start hatching!
            </Text>
            <Button
              title="Start Hatching"
              onPress={startHatchingAnimation}
              size="large"
              style={styles.button}
            />
          </View>
        );
        
      case 'cracking':
        return (
          <View style={styles.centeredContent}>
            <Animated.View
              style={[
                styles.eggContainer,
                {
                  opacity: crackingAnim.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [1, 1, 0],
                  }),
                  transform: [
                    {
                      scale: crackingAnim.interpolate({
                        inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
                        outputRange: [1, 1.1, 1, 1.1, 1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LottieView
                source={require('../../assets/animations/egg-cracking.json')}
                autoPlay
                loop={false}
                style={styles.crackingAnimation}
              />
            </Animated.View>
            <Text style={styles.hatchingText}>
              Your egg is hatching...
            </Text>
          </View>
        );
        
      case 'hatched':
        return (
          <View style={styles.centeredContent}>
            <Animated.View
              style={[
                styles.petContainer,
                {
                  opacity: hatchedAnim,
                  transform: [
                    {
                      scale: hatchedAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={selectedPet ? PET_BABY_IMAGES[selectedPet.type] : PET_BABY_IMAGES.Dragon}
                style={styles.petImage}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={styles.congratsText}>
              Congratulations! You hatched a {selectedPet?.type}!
            </Text>
            <Text style={styles.subText}>
              Now it's time to give your pet a name.
            </Text>
            <Button
              title="Continue"
              onPress={handleContinue}
              size="large"
              style={styles.button}
            />
          </View>
        );
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  eggContainer: {
    width: width * 0.7,
    height: width * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  eggImage: {
    width: '100%',
    height: '100%',
  },
  crackingAnimation: {
    width: '100%',
    height: '100%',
  },
  petContainer: {
    width: width * 0.7,
    height: width * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  instructionText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 20,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 30,
  },
  hatchingText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#8C52FF',
    textAlign: 'center',
    marginBottom: 30,
  },
  congratsText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#8C52FF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    width: '80%',
  },
});

export default PetHatching; 