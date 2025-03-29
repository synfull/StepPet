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
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (growthStage === 'Egg') {
      startEggAnimations();
    } else {
      startPetAnimations();
    }
  }, [growthStage, animationSpeed]);

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

  const handlePress = () => {
    if (!interactive) return;
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Random rotation on press
    Animated.timing(rotateAnim, {
      toValue: Math.random() > 0.5 ? 0.05 : -0.05,
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
    if (growthStage === 'Egg') {
      return (
        <Image
          source={require('../../assets/images/egg.png')}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
        />
      );
    }
    
    // Based on pet type, render the appropriate pet component
    switch (petType) {
      case 'Dragon':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/dragon_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/dragon_juvenile.png') :
                require('../../assets/images/pets/dragon_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'Unicorn':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/unicorn_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/unicorn_juvenile.png') :
                require('../../assets/images/pets/unicorn_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'Wolf':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/wolf_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/wolf_juvenile.png') :
                require('../../assets/images/pets/wolf_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'Eagle':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/eagle_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/eagle_juvenile.png') :
                require('../../assets/images/pets/eagle_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'FireLizard':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/firelizard_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/firelizard_juvenile.png') :
                require('../../assets/images/pets/firelizard_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'WaterTurtle':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/waterturtle_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/waterturtle_juvenile.png') :
                require('../../assets/images/pets/waterturtle_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'RobotDog':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/robotdog_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/robotdog_juvenile.png') :
                require('../../assets/images/pets/robotdog_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'ClockworkBunny':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/clockworkbunny_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/clockworkbunny_juvenile.png') :
                require('../../assets/images/pets/clockworkbunny_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      default:
        // Fallback to egg if pet type is not recognized
        return (
          <Image
            source={require('../../assets/images/egg.png')}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
    }
  };
  
  return (
    <TouchableWithoutFeedback onPress={handlePress} disabled={!interactive}>
      <Animated.View 
        style={[
          styles.container,
          getSizeStyle(),
          style,
          {
            transform: [
              { translateY: bounceAnim },
              { rotate: rotate },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {renderPet()}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    width: 60,
    height: 60,
  },
  medium: {
    width: 120,
    height: 120,
  },
  large: {
    width: 180,
    height: 180,
  },
  xlarge: {
    width: 240,
    height: 240,
  },
  petPlaceholder: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
  },
});

export default PetDisplay; 