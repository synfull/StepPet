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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { RootStackParamList } from '../types/navigationTypes';
import { PetType } from '../types/petTypes';
import { getRandomPetType } from '../utils/petUtils';
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

const PetHatching: React.FC = () => {
  const navigation = useNavigation<PetHatchingNavigationProp>();
  const [animationState, setAnimationState] = useState<'cracking' | 'hatched'>('cracking');
  const [selectedPet, setSelectedPet] = useState<PetType | null>(null);
  const [sound, setSound] = useState<Audio.Sound>();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Load sound effect
  useEffect(() => {
    loadSound();
    return () => {
      sound?.unloadAsync();
    };
  }, []);

  // Start hatching automatically
  useEffect(() => {
    startHatchingAnimation();
  }, []);

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/egg_crack.mp3')
      );
      setSound(sound);
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const startHatchingAnimation = async () => {
    // Play cracking sound
    try {
      await sound?.playAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error playing sound:', error);
    }

    // Start cracking animation
    setTimeout(() => {
      // Select random pet type
      const { type } = getRandomPetType();
      setSelectedPet(type);
      setAnimationState('hatched');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
  };

  const handleContinue = () => {
    if (!selectedPet) return;
    
    navigation.navigate('PetNaming', {
      petType: selectedPet,
    });
  };

  const renderContent = () => {
    switch (animationState) {
      case 'cracking':
        return (
          <>
            <Image
              source={require('../../assets/images/pets/egg_cracking.png')}
              style={styles.eggImage}
              resizeMode="contain"
            />
            <Text style={styles.text}>Your egg is hatching!</Text>
          </>
        );
      case 'hatched':
        if (!selectedPet) return null;
        return (
          <>
            <Image
              source={PET_BABY_IMAGES[selectedPet]}
              style={styles.petImage}
              resizeMode="contain"
            />
            <Text style={styles.text}>It's a {selectedPet}!</Text>
            <Button
              title="Name Your Pet"
              onPress={handleContinue}
              size="large"
              style={styles.button}
            />
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