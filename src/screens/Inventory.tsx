import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GemBalance } from '../components/GemBalance';

type Category = 'Hats' | 'Eyewear' | 'Body' | 'Neck';

type InventoryItem = {
  id: string;
  name: string;
  category: Category;
  image: any;
  isEquipped?: boolean;
};

const CATEGORIES: Category[] = ['Hats', 'Eyewear', 'Body', 'Neck'];

const InventoryItemCard: React.FC<{ item: InventoryItem }> = ({ item }) => (
  <TouchableOpacity style={styles.itemCard}>
    <View style={styles.itemImageContainer}>
      <Image source={item.image} style={styles.itemImage} />
      {item.isEquipped && (
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
  
  // Temporary data structure - will be replaced with context
  const inventoryItems: InventoryItem[] = [];

  const filteredItems = inventoryItems.filter(item => item.category === selectedCategory);

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
          {/* This will be populated with equipped items */}
          <Text style={styles.emptyStateText}>No items equipped</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
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

      {/* Items Grid */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length > 0 ? (
          <View style={styles.grid}>
            {filteredItems.map((item) => (
              <InventoryItemCard key={item.id} item={item} />
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 12,
  },
  equippedItems: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabs: {
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
    backgroundColor: '#FFFFFF',
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
    paddingVertical: 40,
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