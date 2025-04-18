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
import PetDisplay from '../components/PetDisplay';
import Button from '../components/Button';

type PetLevelUpProps = NativeStackScreenProps<RootStackParamList, 'PetLevelUp'>;
type PetLevelUpNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const PetLevelUp: React.FC<PetLevelUpProps> = ({ route }) => {
  const { level, petType } = route.params;
  const navigation = useNavigation<PetLevelUpNavigationProp>();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  
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
    // Show confetti first
    Animated.timing(confettiOpacity, {
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
      type: 'levelUp',
      data: {
        level,
        petType,
      },
    });
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Main', { screen: 'Home' });
  };
  
  // Get growth stage based on level
  const getGrowthStage = () => {
    if (level <= 1) return 'Egg';
    if (level === 2) return 'Baby';
    if (level === 3) return 'Juvenile';
    return 'Adult';
  };
  
  // Get colors based on pet type
  const getPetColors = () => {
    switch (petType) {
      case 'Dragon':
        return { main: '#8C52FF', accent: '#5EFFA9' };
      case 'Unicorn':
        return { main: '#FF9EDB', accent: '#F5F68C' };
      case 'Wolf':
        return { main: '#607D8B', accent: '#CFD8DC' };
      case 'Eagle':
        return { main: '#795548', accent: '#FFEB3B' };
      case 'FireLizard':
        return { main: '#FF5722', accent: '#FFC107' };
      case 'WaterTurtle':
        return { main: '#2196F3', accent: '#4CAF50' };
      case 'RobotDog':
        return { main: '#9E9E9E', accent: '#00BCD4' };
      case 'ClockworkBunny':
        return { main: '#FF9800', accent: '#9C27B0' };
      default:
        return { main: '#8C52FF', accent: '#5EFFA9' };
    }
  };
  
  const colors = getPetColors();
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Confetti animation */}
      <Animated.View
        style={[
          styles.confettiContainer,
          { opacity: confettiOpacity }
        ]}
      >
        <LottieView
          source={require('../../assets/animations/confetti.json')}
          autoPlay
          loop
          style={styles.confetti}
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
            petType={petType}
            growthStage={getGrowthStage()}
            level={level}
            mainColor={colors.main}
            accentColor={colors.accent}
            size="xlarge"
            interactive={false}
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.infoContainer,
            { opacity: opacityAnim },
          ]}
        >
          <Text style={styles.congratsText}>Level Up!</Text>
          <Text style={styles.levelText}>Your pet reached level {level}!</Text>
          
          <View style={styles.featuresContainer}>
            <Text style={styles.newFeaturesTitle}>What's New:</Text>
            
            {level === 2 && (
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.featureText}>Your egg hatched into a {petType}!</Text>
              </View>
            )}
            
            {level === 3 && (
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.featureText}>Your pet evolved to Juvenile stage!</Text>
              </View>
            )}
            
            {level === 4 && (
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.featureText}>Your pet reached Adult stage!</Text>
              </View>
            )}
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.featureText}>Increased XP gain from activities</Text>
            </View>
            
            {level % 2 === 0 && (
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.featureText}>New visual features unlocked!</Text>
              </View>
            )}
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
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  confetti: {
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
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  newFeaturesTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    color: '#333333',
    marginLeft: 10,
    flex: 1,
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