import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useInventory } from '../context/InventoryContext';
import { useGems } from '../context/GemContext';

interface StoreItem {
  id: string;
  name: string;
  price: number;
  image: any;
  description?: string;
}

interface StoreItemCardProps {
  item: StoreItem;
  onPurchaseSuccess?: () => void;
}

export const StoreItemCard: React.FC<StoreItemCardProps> = ({ item, onPurchaseSuccess }) => {
  const { isItemOwned, purchaseItem } = useInventory();
  const { gemBalance } = useGems();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const success = await purchaseItem(item.id, item.price);
      if (success && onPurchaseSuccess) {
        onPurchaseSuccess();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isOwned = isItemOwned(item.id);
  const canAfford = gemBalance >= item.price;

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isOwned && styles.ownedContainer,
        !canAfford && !isOwned && styles.cannotAffordContainer
      ]}
      onPress={handlePurchase}
      disabled={isOwned || isProcessing || !canAfford}
    >
      <View style={styles.imageContainer}>
        {item.image && <Image source={item.image} style={styles.image} />}
        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#8C52FF" />
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={[
            styles.price,
            !canAfford && !isOwned && styles.cannotAffordPrice
          ]}>
            {item.price} Gems
          </Text>
          {isOwned && (
            <Text style={styles.ownedLabel}>Owned</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    margin: 8,
    width: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ownedContainer: {
    backgroundColor: '#F0F0F0',
  },
  cannotAffordContainer: {
    opacity: 0.5,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    color: '#8C52FF',
    fontWeight: 'bold',
  },
  cannotAffordPrice: {
    color: '#FF3B30',
  },
  ownedLabel: {
    fontSize: 12,
    color: '#8C52FF',
    fontWeight: 'bold',
  },
}); 