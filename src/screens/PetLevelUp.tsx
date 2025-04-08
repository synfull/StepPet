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
import { RootStackParamList } from '../types/navigationTypes';
import PetDisplay from '../components/PetDisplay';
import Button from '../components/Button';
import { useData } from '../context/DataContext';

type PetLevelUpProps = NativeStackScreenProps<RootStackParamList, 'PetLevelUp'>;

const { width } = Dimensions.get('window');

const PetLevelUp: React.FC<PetLevelUpProps> = ({ route, navigation }) => {
  const { level, petType } = route.params;
  const { petData } = useData();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
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
        require('../../assets/sounds/level-up.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error loading sound', error);
    }
  };
  
  const startAnimations = () => {
    // Slide in the content
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
    navigation.navigate('Main');
  };
  
  // Get growth stage based on level
  const getGrowthStage = () => {
    if (level <= 1) return 'Egg';
    if (level === 2) return 'Baby';
    if (level === 3) return 'Juvenile';
    return 'Adult';
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
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
          <Text style={styles.congratsText}>Level Up!</Text>
          <Text style={styles.levelText}>{petData?.name} has reached level {level}!</Text>
          
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
    padding: 10,
  },
  skipText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  petContainer: {
    marginBottom: 30,
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
    fontSize: 32,
    color: '#8C52FF',
    marginBottom: 8,
  },
  levelText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 24,
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

export default PetLevelUp; 