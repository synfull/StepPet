import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { RootStackParamList } from '../types/navigationTypes';
import { PetType } from '../types/petTypes';
import Button from '../components/Button';

// Pet baby images mapping
const PET_BABY_IMAGES: { [key in Exclude<PetType, ''>]: ImageSourcePropType } = {
  Dragon: require('../../assets/images/pets/dragon_baby.png'),
  Wolf: require('../../assets/images/pets/wolf_baby.png'),
  Eagle: require('../../assets/images/pets/eagle_baby.png'),
  Unicorn: require('../../assets/images/pets/unicorn_baby.png'),
  WaterTurtle: require('../../assets/images/pets/waterturtle_baby.png'),
  FireLizard: require('../../assets/images/pets/firelizard_baby.png'),
  RobotDog: require('../../assets/images/pets/robotdog_baby.png'),
  ClockworkBunny: require('../../assets/images/pets/clockworkbunny_baby.png'),
};

type PetHatchingNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PetHatchingRouteProp = RouteProp<RootStackParamList, 'PetHatching'>;

const PetHatching: React.FC = () => {
  const route = useRoute<PetHatchingRouteProp>();
  const navigation = useNavigation<PetHatchingNavigationProp>();
  const { petType } = route.params;
  const [animationState, setAnimationState] = useState<'cracking' | 'hatched'>('cracking');
  const [hatchingSound, setHatchingSound] = useState<Audio.Sound>();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Load hatching sound
  useEffect(() => {
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/egg-crack.wav')
        );
        setHatchingSound(sound);
      } catch (error) {
        console.log('Could not load hatching sound:', error);
        // Continue without sound
      }
    }
    loadSound();
  }, []);

  // Start hatching automatically
  useEffect(() => {
    startHatchingAnimation();
  }, []);

  // Play hatching sound
  const playHatchingSound = async () => {
    try {
      if (hatchingSound) {
        await hatchingSound.playAsync();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Could not play hatching sound:', error);
      // Continue without sound
    }
  };

  const startHatchingAnimation = async () => {
    // Play hatching sound
    await playHatchingSound();

    // Start cracking animation
    setTimeout(() => {
      setAnimationState('hatched');
    }, 3000);
  };

  const handleContinue = () => {
    console.log('Continue button pressed'); // Debug log
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PetNaming', {
      petType,
    });
  };

  const renderContent = () => {
    switch (animationState) {
      case 'cracking':
        return (
          <>
            <Image
              source={require('../../assets/images/egg.png')}
              style={styles.eggImage}
              resizeMode="contain"
            />
            <Text style={styles.text}>Your egg is hatching!</Text>
          </>
        );
      case 'hatched':
        return (
          <>
            <Image
              source={petType && petType in PET_BABY_IMAGES ? PET_BABY_IMAGES[petType as keyof typeof PET_BABY_IMAGES] : require('../../assets/images/egg.png')}
              style={styles.petImage}
              resizeMode="contain"
            />
            <Text style={styles.text}>
              It's a {petType === '' ? 'Mystery Pet' : petType.replace(/([A-Z])/g, ' $1').trim()}!
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#8C52FF', padding: 16, borderRadius: 30 }]}
              onPress={handleContinue}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 18 }}>
                Name Your Pet
              </Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {renderContent()}
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
  eggImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  petImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  text: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 24,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    marginTop: 20,
  },
});

export default PetHatching; 