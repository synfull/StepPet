import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { RootStackParamList } from '../types/navigationTypes';
import { PetType } from '../types/petTypes';
import { PET_TYPES } from '../utils/petUtils';
import Button from '../components/Button';

// Pet baby images mapping
const PET_BABY_IMAGES: { [key in PetType]: ImageSourcePropType } = {
  // Empty string case (for egg)
  '': require('../../assets/images/egg.png'),
  
  // Mythic Beasts
  lunacorn: require('../../assets/images/pets/mythic/lunacorn_baby.png'),
  embermane: require('../../assets/images/pets/mythic/embermane_baby.png'),
  aetherfin: require('../../assets/images/pets/mythic/aetherfin_baby.png'),
  crystallisk: require('../../assets/images/pets/mythic/crystallisk_baby.png'),
  
  // Elemental Critters
  flareep: require('../../assets/images/pets/elemental/flareep_baby.png'),
  aquabub: require('../../assets/images/pets/elemental/aquabub_baby.png'),
  terrabun: require('../../assets/images/pets/elemental/terrabun_baby.png'),
  gustling: require('../../assets/images/pets/elemental/gustling_baby.png'),
  
  // Forest Folk
  mossling: require('../../assets/images/pets/forest/mossling_baby.png'),
  twiggle: require('../../assets/images/pets/forest/twiggle_baby.png'),
  thistuff: require('../../assets/images/pets/forest/thistuff_baby.png'),
  glimmowl: require('../../assets/images/pets/forest/glimmowl_baby.png'),
  
  // Shadow Whims
  wispurr: require('../../assets/images/pets/shadow/wispurr_baby.png'),
  batbun: require('../../assets/images/pets/shadow/batbun_baby.png'),
  noctuff: require('../../assets/images/pets/shadow/noctuff_baby.png'),
  drimkin: require('../../assets/images/pets/shadow/drimkin_baby.png'),
};

type PetHatchingNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PetHatchingRouteProp = RouteProp<RootStackParamList, 'PetHatching'>;

const { width, height } = Dimensions.get('window');

const PetHatching: React.FC = () => {
  const route = useRoute<PetHatchingRouteProp>();
  const navigation = useNavigation<PetHatchingNavigationProp>();
  const { petType } = route.params;
  const [animationState, setAnimationState] = useState<'cracking' | 'hatched'>('cracking');
  const [hatchingSound, setHatchingSound] = useState<Audio.Sound>();
  const [isSoundLoaded, setIsSoundLoaded] = useState(false);
  
  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [shakeIntensity, setShakeIntensity] = useState(1);

  // Initialize audio system and load sound
  useEffect(() => {
    let mounted = true;

    const setupAudio = async () => {
      try {
        console.log('Setting up audio...');
        
        // Initialize audio system
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        console.log('Loading sound file...');
        const soundObject = new Audio.Sound();
        await soundObject.loadAsync(require('../../assets/sounds/egg-crack.mp3'));
        
        if (!mounted) {
          await soundObject.unloadAsync();
          return;
        }

        console.log('Sound loaded, checking status...');
        const status = await soundObject.getStatusAsync();
        console.log('Sound status:', status);

        if (status.isLoaded) {
          setHatchingSound(soundObject);
          setIsSoundLoaded(true);
          console.log('Sound successfully loaded and ready');
        } else {
          console.error('Sound loaded but status check failed');
        }
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };

    setupAudio();

    return () => {
      mounted = false;
      if (hatchingSound) {
        console.log('Cleaning up sound...');
        hatchingSound.unloadAsync();
      }
    };
  }, []);

  // Start animations
  useEffect(() => {
    // Start initial animations
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Only start hatching process once sound is loaded
    if (isSoundLoaded) {
      startHatchingAnimation();
      startShakeAnimation();
    }

    // Cleanup function
    return () => {
      // Clear any pending timeouts
      clearTimeout(shakeTimeout);
      clearTimeout(hatchTimeout);
    };
  }, [isSoundLoaded]);

  // Remove the old useEffect and move initial animations to a separate one
  useEffect(() => {
    // Start initial animations immediately
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []); // This runs once on mount

  // Play hatching sound
  const playHatchingSound = async () => {
    try {
      if (!hatchingSound || !isSoundLoaded) {
        console.error('Sound not ready:', { hasSound: !!hatchingSound, isLoaded: isSoundLoaded });
        return;
      }

      const status = await hatchingSound.getStatusAsync();
      console.log('Current sound status before playing:', status);

      if (status.isLoaded) {
        // Reset to beginning and ensure volume is up
        await hatchingSound.setPositionAsync(0);
        await hatchingSound.setVolumeAsync(1.0);
        
        console.log('Playing sound...');
        await hatchingSound.playAsync();
      } else {
        console.error('Sound was marked as loaded but status check failed');
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  let shakeTimeout: NodeJS.Timeout;
  let hatchTimeout: NodeJS.Timeout;

  const startShakeAnimation = () => {
    // Trigger haptic feedback with each shake
    if (animationState === 'cracking') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -0.3 * shakeIntensity,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0.3 * shakeIntensity,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (animationState === 'cracking') {
        shakeTimeout = setTimeout(() => {
          startShakeAnimation();
          // Increase haptic intensity as shaking intensifies
          if (shakeIntensity >= 1.5) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else if (shakeIntensity >= 1.8) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
        }, 1000);
      }
    });
  };

  const startHatchingAnimation = async () => {
    // Initial strong vibration
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Gradually increase shake intensity with corresponding haptic feedback
    setTimeout(async () => {
      setShakeIntensity(1.2);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 2000);

    setTimeout(async () => {
      setShakeIntensity(1.5);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 4000);

    // Play the cracking sound at the moment of hatching
    setTimeout(async () => {
      console.log('Attempting to play sound at hatching moment...');
      setShakeIntensity(1.8);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (!isSoundLoaded) {
        console.log('Sound not loaded at hatching moment');
      }
      await playHatchingSound();
    }, 6000);

    // Complete hatching after 7 seconds with final celebration haptic
    hatchTimeout = setTimeout(async () => {
      setAnimationState('hatched');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 7000);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PetNaming', {
      petType,
    });
  };

  const getPetCategory = () => {
    if (petType.includes('lunacorn') || petType.includes('embermane') || 
        petType.includes('aetherfin') || petType.includes('crystallisk')) {
      return 'Mythic Beasts';
    } else if (petType.includes('flareep') || petType.includes('aquabub') || 
               petType.includes('terrabun') || petType.includes('gustling')) {
      return 'Elemental Critters';
    } else if (petType.includes('mossling') || petType.includes('twiggle') || 
               petType.includes('thistuff') || petType.includes('glimmowl')) {
      return 'Forest Folk';
    } else if (petType.includes('wispurr') || petType.includes('batbun') || 
               petType.includes('noctuff') || petType.includes('drimkin')) {
      return 'Shadow Whims';
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {animationState === 'cracking' ? (
          <View style={styles.cardContainer}>
            <Animated.Image
              source={require('../../assets/images/egg.png')}
              style={[
                styles.eggImage,
                {
                  transform: [
                    { scale: scaleAnim },
                    { 
                      rotate: shakeAnim.interpolate({
                        inputRange: [-1, 1],
                        outputRange: [`${-25 * shakeIntensity}deg`, `${25 * shakeIntensity}deg`]
                      })
                    }
                  ],
                  opacity: opacityAnim,
                },
              ]}
              resizeMode="contain"
            />
            <Animated.Text style={[styles.title, { opacity: opacityAnim }]}>
              Your egg is hatching!
            </Animated.Text>
            <Animated.Text style={[styles.subtitle, { opacity: opacityAnim }]}>
              Something magical is about to happen...
            </Animated.Text>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            <Animated.Image
              source={PET_BABY_IMAGES[petType]}
              style={[styles.petImage, { transform: [{ scale: scaleAnim }] }]}
              resizeMode="contain"
            />
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{getPetCategory()}</Text>
            </View>
            <Text style={styles.title}>
              It's a {PET_TYPES[petType].name}!
            </Text>
            <Text style={styles.subtitle}>
              A new friend has joined your journey
            </Text>
            
            <Button
              title="Name Your Pet"
              onPress={handleContinue}
              size="large"
              style={styles.button}
              textStyle={styles.buttonText}
              icon={<Ionicons name="heart-outline" size={20} color="#FFFFFF" />}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  eggImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  petImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#F0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryText: {
    color: '#8C52FF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginTop: 8,
    backgroundColor: '#8C52FF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default PetHatching; 