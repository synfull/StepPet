import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Button from '../components/Button';
import { Pedometer } from 'expo-sensors';
import { Image as ExpoImage } from 'expo-image';

const { width, height } = Dimensions.get('window');

interface OnboardingProps {
  completeOnboarding: () => void;
}

interface SlideItem {
  id: string;
  title: string;
  description: string;
  image: any;
}

const slides: SlideItem[] = [
  {
    id: '1',
    title: 'Welcome to StepPet!',
    description: 'Turn your daily steps into a pet-nurturing adventure!',
    image: require('../../assets/images/onboarding1.png'),
  },
  {
    id: '2',
    title: 'Hatch & Evolve',
    description: 'Start with an egg that hatches into one of eight unique pets that evolve as you walk!',
    image: require('../../assets/images/onboarding2.png'),
  },
  {
    id: '3',
    title: 'Step Tracking',
    description: 'Track your daily steps automatically to power your pet\'s growth!',
    image: require('../../assets/images/onboarding3.png'),
  },
  {
    id: '4',
    title: 'Play Mini-Games',
    description: 'Care for your pet and earn extra rewards by playing fun mini-games!',
    image: require('../../assets/images/onboarding4.png'),
  },
  {
    id: '5',
    title: 'Milestone Rewards',
    description: 'Unlock special rewards as you hit step milestones!',
    image: require('../../assets/images/onboarding5.png'),
  },
  {
    id: '6',
    title: 'Compete With Friends',
    description: 'Connect with friends, climb the leaderboards, and see who walks the most!',
    image: require('../../assets/images/onboarding6.png'),
  },
  {
    id: '7',
    title: 'Customize Your Pet',
    description: 'Use gems earned from steps and rewards to buy fun accessories and personalize your pet!',
    image: require('../../assets/images/onboarding7.png'),
  },
];

const Onboarding: React.FC<OnboardingProps> = ({ completeOnboarding }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLastSlide, setIsLastSlide] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    checkPedometerPermission();
  }, []);

  useEffect(() => {
    setIsLastSlide(currentIndex === slides.length - 1);
  }, [currentIndex]);

  const checkPedometerPermission = async () => {
    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Pedometer Not Available',
          'Your device does not support step counting, which is required for StepPet.',
          [{ text: 'OK' }]
        );
        setHasPermission(false);
        return;
      }
      
      // For iOS, just checking availability is enough as permission will be requested when needed
      // For Android, we'd need to check permissions separately
      setHasPermission(true);
    } catch (error) {
      console.error('Error checking pedometer:', error);
      setHasPermission(false);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (isLastSlide) {
      handleGetStarted();
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
  };

  const handleGetStarted = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (hasPermission === false) {
      Alert.alert(
        'Permission Required',
        'StepPet needs access to your step count to function properly.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Permission is available or will be requested when needed
    completeOnboarding();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    flatListRef.current?.scrollToIndex({ 
      index: slides.length - 1, 
      animated: true 
    });
    setCurrentIndex(slides.length - 1);
  };

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item }: { item: SlideItem }) => (
    <View style={styles.slide}>
      <ExpoImage
        source={item.image}
        style={styles.image}
        contentFit="contain"
        transition={200}
      />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => {
    return slides.map((_, i) => {
      const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
      
      const dotWidth = scrollX.interpolate({
        inputRange,
        outputRange: [10, 20, 10],
        extrapolate: 'clamp',
      });
      
      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.3, 1, 0.3],
        extrapolate: 'clamp',
      });
      
      return (
        <Animated.View 
          key={`dot-${i}`} 
          style={[
            styles.dot, 
            { width: dotWidth, opacity },
            currentIndex === i ? styles.activeDot : styles.inactiveDot
          ]} 
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        {!isLastSlide && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />
      
      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {renderDots()}
        </View>
        
        <Button
          title={isLastSlide ? "Let's Start!" : "Next"}
          onPress={handleNext}
          size="large"
          style={styles.button}
          icon={
            isLastSlide ? (
              <Ionicons name="paw" size={20} color="#FFFFFF" />
            ) : (
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            )
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#8C52FF',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Caprasimo-Regular',
    fontSize: 28,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  footer: {
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#8C52FF',
  },
  inactiveDot: {
    backgroundColor: '#D0D0D0',
  },
  button: {
    width: '100%',
  },
});

export default Onboarding; 