import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInventory, ItemCategory } from '../context/InventoryContext';
import { hatItems, StoreItem } from './StoreHats';
import { eyewearItems } from './StoreEyewear';
import { neckItems } from './StoreNeck';
import { ITEM_IMAGES } from '../utils/itemUtils';

type Category = ItemCategory;

interface InventoryItem extends StoreItem {
  category: Category;
  isEquipped?: boolean;
}

const CATEGORIES: Category[] = ['Hats', 'Eyewear', 'Neck'];

const InventoryItemCard: React.FC<{ 
  item: InventoryItem;
  onPress: () => void;
  isEquipped: boolean;
}> = ({ item, onPress, isEquipped }) => (
  <TouchableOpacity style={styles.itemCard} onPress={onPress}>
    <View style={styles.itemImageContainer}>
      <Image source={ITEM_IMAGES[item.category][item.id]} style={styles.itemImage} />
      {isEquipped && (
        <View style={styles.equippedBadge}>
          <Text style={styles.equippedText}>Equipped</Text>
        </View>
      )}
    </View>
    <View style={styles.itemInfo}>
      <Text style={styles.itemName}>{item.name}</Text>
    </View>
  </TouchableOpacity>
);

const Inventory = () => {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<Category>('Hats');
  const { 
    ownedItems, 
    isLoading, 
    equippedItems, 
    equipItem, 
    unequipItem,
    isItemEquipped 
  } = useInventory();

  // Combine all store items
  const allStoreItems = {
    Hats: hatItems,
    Eyewear: eyewearItems,
    Neck: neckItems,
  };

  // Filter owned items for the selected category
  const getOwnedItemsForCategory = (category: Category) => {
    const categoryItems = allStoreItems[category];
    return categoryItems
      .filter(item => ownedItems.includes(item.id))
      .map(item => ({
        ...item,
        category,
      }));
  };

  const handleEquipItem = async (item: InventoryItem) => {
    const isCurrentlyEquipped = isItemEquipped(item.id);
    if (isCurrentlyEquipped) {
      await unequipItem(item.category);
    } else {
      await equipItem(item.id, item.category);
    }
  };

  const filteredItems = getOwnedItemsForCategory(selectedCategory);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
      </View>

      {/* Currently Equipped Section */}
      <View style={styles.equippedSection}>
        <Text style={styles.sectionTitle}>Currently Equipped</Text>
        <View style={styles.equippedItems}>
          {Object.values(equippedItems).some(itemId => itemId !== undefined) ? (
            <View style={styles.equippedGrid}>
              {Object.entries(equippedItems).map(([category, itemId]) => {
                if (!itemId) return null;
                const item = allStoreItems[category as Category].find((i: StoreItem) => i.id === itemId);
                if (!item) return null;
                return (
                  <View key={itemId} style={styles.equippedItem}>
                    <Image source={ITEM_IMAGES[category as Category][itemId]} style={styles.equippedItemImage} />
                    <Text style={styles.equippedItemText}>{item.name}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyStateText}>No items equipped</Text>
          )}
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.categoryTabActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text 
                style={[
                  styles.categoryTabText,
                  selectedCategory === category && styles.categoryTabTextActive
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Items Grid */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Loading...</Text>
          </View>
        ) : filteredItems.length > 0 ? (
          <View style={styles.grid}>
            {filteredItems.map((item) => (
              <InventoryItemCard 
                key={item.id} 
                item={item}
                onPress={() => handleEquipItem(item)}
                isEquipped={isItemEquipped(item.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No {selectedCategory.toLowerCase()} owned</Text>
            <Text style={styles.emptyStateSubtext}>Visit the store to purchase items</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 32,
    color: '#333333',
  },
  equippedSection: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 8,
  },
  equippedItems: {
    minHeight: 60,
    justifyContent: 'center',
  },
  equippedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  equippedItem: {
    alignItems: 'center',
    width: 80,
  },
  equippedItemImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  equippedItemText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryTabsContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginRight: 8,
  },
  categoryTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#8C52FF',
  },
  categoryTabText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#666666',
  },
  categoryTabTextActive: {
    color: '#8C52FF',
  },
  scrollView: {
    flex: 1,
  },
  gridContent: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  itemImageContainer: {
    aspectRatio: 1,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  equippedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8C52FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  equippedText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#333333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  emptyStateText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#999999',
  },
});

export default Inventory; 