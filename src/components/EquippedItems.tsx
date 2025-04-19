import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useInventory } from '../context/InventoryContext';
import type { ItemCategory } from '../context/InventoryContext';
import { ITEM_IMAGES } from '../utils/itemUtils';
import { PET_ANCHOR_POINTS, PET_OFFSETS, PetAnchors } from '../utils/petAnchors';
import type { PetType } from '../types/petTypes';
import type { GrowthStage } from '../types/petTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SIZE = SCREEN_WIDTH * 0.8; // 80% of screen width

interface EquippedItemsProps {
  petType: PetType;
  growthStage: GrowthStage;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

const EquippedItems: React.FC<EquippedItemsProps> = ({
  petType,
  growthStage,
  size = 'medium',
}) => {
  const { equippedItems } = useInventory();

  // Skip empty pet type or Egg stage
  if (!petType || growthStage === 'Egg') {
    return null;
  }

  // Skip if pet type is not in PET_ANCHOR_POINTS or PET_OFFSETS
  const anchorPoints = PET_ANCHOR_POINTS[petType as keyof typeof PET_ANCHOR_POINTS];
  const offsets = PET_OFFSETS[petType as keyof typeof PET_OFFSETS];
  
  if (!anchorPoints || !offsets) {
    return null;
  }

  // Convert growth stage to lowercase for anchor points
  const stage = growthStage.toLowerCase() as 'baby' | 'juvenile' | 'adult';
  const anchors = anchorPoints[stage];

  if (!anchors) {
    return null;
  }

  // Get size multiplier based on prop
  const getSizeMultiplier = () => {
    switch (size) {
      case 'small':
        return 0.8;
      case 'large':
        return 1.2;
      case 'xlarge':
        return 1.5;
      default:
        return 1;
    }
  };

  const sizeMultiplier = getSizeMultiplier();

  // Map item categories to anchor point names
  const categoryToAnchorMap: Record<ItemCategory, keyof PetAnchors> = {
    'Hats': 'head',
    'Eyewear': 'eyes',
    'Neck': 'neck'
  };

  // Get anchor point for an item category
  const getAnchorPoint = (category: ItemCategory) => {
    const anchorName = categoryToAnchorMap[category];
    const anchorPoint = anchors[anchorName];
    
    if (!anchorPoint) {
      return null;
    }

    const stageOffsets = offsets[stage];
    if (!stageOffsets) {
      return null;
    }

    const offset = stageOffsets[category];
    if (!offset) {
      return null;
    }

    const baseSize = category === 'Hats' ? 80 : 60;
    const itemSize = baseSize * sizeMultiplier * (anchorPoint.scale || 1) * (offset.scale || 1);

    return {
      ...anchorPoint,
      ...offset,
      size: itemSize,
    };
  };

  return (
    <View style={styles.container}>
      {Object.entries(equippedItems).map(([category, item]) => {
        if (!item) {
          return null;
        }

        const anchorPoint = getAnchorPoint(category as ItemCategory);
        if (!anchorPoint) {
          return null;
        }

        const itemStyle = {
          position: 'absolute' as const,
          width: anchorPoint.size,
          height: anchorPoint.size,
          left: (BASE_SIZE * anchorPoint.x) / 100,
          top: (BASE_SIZE * anchorPoint.y) / 100,
          transform: [
            { translateX: -anchorPoint.size / 2 },
            { translateY: -anchorPoint.size / 2 },
          ],
        };

        return (
          <Image
            key={`${category}-${item}`}
            source={ITEM_IMAGES[category as ItemCategory][item]}
            style={itemStyle}
            contentFit="contain"
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default EquippedItems; 