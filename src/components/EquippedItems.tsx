import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useInventory } from '../context/InventoryContext';
import type { ItemCategory } from '../context/InventoryContext';
import { ITEM_IMAGES } from '../utils/itemUtils';

// Define the positioning for each category
const ITEM_POSITIONS = {
  Hats: {
    top: -40,
    zIndex: 3,
  },
  Eyewear: {
    top: 20,
    zIndex: 2,
  },
  Neck: {
    top: 40,
    zIndex: 1,
  },
};

interface EquippedItemsProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

const EquippedItems: React.FC<EquippedItemsProps> = ({ size = 'large' }) => {
  const { equippedItems } = useInventory();

  // Debug logging
  console.log('Equipped Items:', equippedItems);

  // Get size multiplier based on prop
  const getSizeMultiplier = () => {
    switch (size) {
      case 'small':
        return 0.5;
      case 'medium':
        return 0.75;
      case 'large':
        return 1;
      case 'xlarge':
        return 1.5;
      default:
        return 1;
    }
  };

  const sizeMultiplier = getSizeMultiplier();

  const renderEquippedItem = (category: ItemCategory) => {
    const itemId = equippedItems[category];
    // Debug logging
    console.log('Rendering item for category:', category, 'itemId:', itemId);
    
    if (!itemId || !ITEM_IMAGES[category][itemId]) {
      console.log('No item found for category:', category);
      return null;
    }

    const baseSize = category === 'Hats' ? 80 : 60; // Hats are slightly larger
    const itemSize = baseSize * sizeMultiplier;

    const position = ITEM_POSITIONS[category];
    const adjustedPosition = {
      ...position,
      top: position.top * sizeMultiplier,
      marginLeft: -(itemSize / 2), // Center the item by offsetting it by half its width
    };

    // Debug logging
    console.log('Rendering item with size:', itemSize, 'position:', adjustedPosition);

    return (
      <View
        key={category}
        style={[
          styles.itemContainer,
          adjustedPosition,
          { width: itemSize, height: itemSize },
        ]}
      >
        <Image
          source={ITEM_IMAGES[category][itemId]}
          style={styles.itemImage}
          contentFit="contain"
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {Object.keys(ITEM_POSITIONS).map((category) => 
        renderEquippedItem(category as ItemCategory)
      )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    left: '50%',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
});

export default EquippedItems; 