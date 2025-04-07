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
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const specialAnim = useRef(new Animated.Value(0)).current;

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
    if (showIcon) {
      return (
        <Image
          source={PET_ICONS[petType]}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
        />
      );
    }

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
      // Mythic Beasts
      case 'lunacorn':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/mythic/lunacorn_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/mythic/lunacorn_juvenile.png') :
                require('../../assets/images/pets/mythic/lunacorn_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'embermane':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/mythic/embermane_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/mythic/embermane_juvenile.png') :
                require('../../assets/images/pets/mythic/embermane_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'aetherfin':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/mythic/aetherfin_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/mythic/aetherfin_juvenile.png') :
                require('../../assets/images/pets/mythic/aetherfin_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'crystallisk':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/mythic/crystallisk_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/mythic/crystallisk_juvenile.png') :
                require('../../assets/images/pets/mythic/crystallisk_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      
      // Elemental Critters
      case 'flareep':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/elemental/flareep_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/elemental/flareep_juvenile.png') :
                require('../../assets/images/pets/elemental/flareep_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'aquabub':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/elemental/aquabub_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/elemental/aquabub_juvenile.png') :
                require('../../assets/images/pets/elemental/aquabub_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'terrabun':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/elemental/terrabun_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/elemental/terrabun_juvenile.png') :
                require('../../assets/images/pets/elemental/terrabun_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'gustling':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/elemental/gustling_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/elemental/gustling_juvenile.png') :
                require('../../assets/images/pets/elemental/gustling_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      
      // Forest Folk
      case 'mossling':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/forest/mossling_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/forest/mossling_juvenile.png') :
                require('../../assets/images/pets/forest/mossling_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'twiggle':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/forest/twiggle_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/forest/twiggle_juvenile.png') :
                require('../../assets/images/pets/forest/twiggle_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'thistuff':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/forest/thistuff_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/forest/thistuff_juvenile.png') :
                require('../../assets/images/pets/forest/thistuff_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'glimmowl':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/forest/glimmowl_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/forest/glimmowl_juvenile.png') :
                require('../../assets/images/pets/forest/glimmowl_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      
      // Shadow Whims
      case 'wispurr':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/shadow/wispurr_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/shadow/wispurr_juvenile.png') :
                require('../../assets/images/pets/shadow/wispurr_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'batbun':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/shadow/batbun_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/shadow/batbun_juvenile.png') :
                require('../../assets/images/pets/shadow/batbun_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'noctuff':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/shadow/noctuff_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/shadow/noctuff_juvenile.png') :
                require('../../assets/images/pets/shadow/noctuff_adult.png')
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        );
      case 'drimkin':
        return (
          <Image
            source={
              growthStage === 'Baby' ? 
                require('../../assets/images/pets/shadow/drimkin_baby.png') :
              growthStage === 'Juvenile' ?
                require('../../assets/images/pets/shadow/drimkin_juvenile.png') :
                require('../../assets/images/pets/shadow/drimkin_adult.png')
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