import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { PET_ICONS } from '../utils/petUtils';
import EquippedItems from './EquippedItems';
import type { PetType } from '../types/petTypes';
import type { GrowthStage } from '../types/petTypes';

interface PetDisplayProps {
  petType: PetType;
  growthStage: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showEquippedItems?: boolean;
}

const PetDisplay: React.FC<PetDisplayProps> = ({
  petType,
  growthStage,
  size = 'medium',
  showEquippedItems = false,
}) => {
  // Debug logging
  console.log('PetDisplay props:', { petType, growthStage, size, showEquippedItems });

  // Function to get image size based on size prop
  const getImageSize = (size: string) => {
    switch (size) {
      case 'small':
        return styles.smallImage;
      case 'large':
        return styles.largeImage;
      case 'xlarge':
        return styles.xlargeImage;
      default:
        return styles.mediumImage;
    }
  };

  // Skip empty pet type
  if (!petType) {
    return null;
  }

  // Normalize growth stage to match PET_ICONS keys
  const normalizedGrowthStage = growthStage.charAt(0).toUpperCase() + growthStage.slice(1).toLowerCase() as GrowthStage;

  // Get the image source safely
  const petImages = PET_ICONS[petType];
  if (!petImages || !petImages[normalizedGrowthStage]) {
    console.error('Could not find image for pet:', petType, normalizedGrowthStage);
    return null;
  }

  return (
    <View style={styles.container}>
      <Image
        source={petImages[normalizedGrowthStage]}
        style={[styles.image, getImageSize(size)]}
        contentFit="contain"
      />
      {showEquippedItems && normalizedGrowthStage !== 'Egg' && (
        <EquippedItems
          petType={petType}
          growthStage={normalizedGrowthStage}
          size={size}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  smallImage: {
    width: 80,
    height: 80,
  },
  mediumImage: {
    width: 120,
    height: 120,
  },
  largeImage: {
    width: 160,
    height: 160,
  },
  xlargeImage: {
    width: 200,
    height: 200,
  },
});

export default PetDisplay; 