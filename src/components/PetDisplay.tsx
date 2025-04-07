import React, { useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  TouchableWithoutFeedback, 
  ViewStyle 
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { PetType, GrowthStage } from '../types/petTypes';
import { PET_ICONS } from '../utils/petUtils';
import EquippedItems from './EquippedItems';

interface PetDisplayProps {
  petType: PetType;
  growthStage: GrowthStage;
  level: number;
  mainColor: string;
  accentColor: string;
  hasCustomization?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
  animationSpeed?: number;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  interactive?: boolean;
  specialAnimation?: boolean;
  showIcon?: boolean;
  showEquippedItems?: boolean;
}

const PetDisplay: React.FC<PetDisplayProps> = ({
  petType,
  growthStage,
  level,
  mainColor,
  accentColor,
  hasCustomization = false,
  style,
  onPress,
  animationSpeed = 1,
  size = 'large',
  interactive = true,
  specialAnimation = false,
  showIcon = false,
  showEquippedItems = true,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const specialAnim = useRef(new Animated.Value(0)).current;

  // Debug logging
  console.log('PetDisplay props:', {
    petType,
    growthStage,
    size,
    showEquippedItems
  });

  useEffect(() => {
    if (growthStage === 'Egg') {
      startEggAnimations();
    } else {
      startPetAnimations();
    }
  }, [growthStage, animationSpeed]);

  useEffect(() => {
    if (specialAnimation) {
      startSpecialAnimation();
    }
  }, [specialAnimation]);

  const startEggAnimations = () => {
    // For the egg, we do a gentle bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1000 / animationSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000 / animationSpeed,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startPetAnimations = () => {
    // For regular pets, we do idle animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 1200 / animationSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1200 / animationSpeed,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startSpecialAnimation = () => {
    // Reset any ongoing animations
    bounceAnim.stopAnimation();
    rotateAnim.stopAnimation();
    scaleAnim.stopAnimation();
    
    // Start special animation sequence - more dramatic
    Animated.sequence([
      // Bounce up higher
      Animated.timing(bounceAnim, {
        toValue: -30,
        duration: 300,
        useNativeDriver: true,
      }),
      // Rotate and scale more dramatically
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Bounce down and reset
      Animated.parallel([
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Restart regular animations
      if (growthStage === 'Egg') {
        startEggAnimations();
      } else {
        startPetAnimations();
      }
    });
  };

  const handlePress = () => {
    if (!interactive) return;
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Regular tap animation - more subtle
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Random rotation on press - more subtle
    Animated.timing(rotateAnim, {
      toValue: Math.random() > 0.5 ? 0.02 : -0.02,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
    
    if (onPress) {
      onPress();
    }
  };
  
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'medium':
        return styles.medium;
      case 'large':
        return styles.large;
      case 'xlarge':
        return styles.xlarge;
      default:
        return styles.large;
    }
  };
  
  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });
  
  // Render the appropriate pet based on type and growth stage
  const renderPet = () => {
    const sizeStyle = getSizeStyle();
    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <TouchableWithoutFeedback onPress={handlePress} disabled={!interactive}>
        <Animated.View
          style={[
            styles.container,
            sizeStyle,
            style,
            {
              transform: [
                { translateY: bounceAnim },
                { scale: scaleAnim },
                { rotate },
              ],
            },
          ]}
        >
          <Image
            source={PET_ICONS[petType][growthStage]}
            style={[styles.petImage]}
            contentFit="contain"
          />
          {showEquippedItems && growthStage !== 'Egg' && (
            <EquippedItems size={size} />
          )}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };
  
  return (
    renderPet()
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible', // Changed from 'hidden' to allow items to overflow
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  small: {
    width: 60,
    height: 60,
  },
  medium: {
    width: 100,
    height: 100,
  },
  large: {
    width: 160,
    height: 160,
  },
  xlarge: {
    width: 200,
    height: 200,
  },
});

export default PetDisplay; 