import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

type StoreItem = {
  id: string;
  name: string;
  price: number;
  image: any;
  description?: string;
};

export const hatItems: StoreItem[] = [
  {
    id: 'crown',
    name: 'Crown',
    price: 500,
    image: require('../../assets/images/store/items/hats/crown.png'),
    description: 'A majestic crown fit for royalty',
  },
  {
    id: 'halo',
    name: 'Halo',
    price: 400,
    image: require('../../assets/images/store/items/hats/halo.png'),
    description: 'A divine halo that radiates pure light',
  },
  {
    id: 'top_hat',
    name: 'Top Hat',
    price: 300,
    image: require('../../assets/images/store/items/hats/top_hat.png'),
    description: 'A classy top hat for sophisticated pets',
  },
  {
    id: 'wizard_hat',
    name: 'Wizard Hat',
    price: 450,
    image: require('../../assets/images/store/items/hats/wizard_hat.png'),
    description: 'A mystical hat imbued with magical properties',
  },
];

const StoreItemCard: React.FC<{ item: StoreItem }> = ({ item }) => (
  <TouchableOpacity style={styles.itemCard}>
    <View style={styles.itemImageContainer}>
      {item.image && <Image source={item.image} style={styles.itemImage} />}
    </View>
    <View style={styles.itemInfo}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>{item.price} Gems</Text>
    </View>
  </TouchableOpacity>
);

const StoreHats = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hats</Text>
      </View>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {hatItems.map((item) => (
          <StoreItemCard key={item.id} item={item} />
        ))}
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
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    color: '#333333',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gridContent: {
    padding: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  itemPrice: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#8C52FF',
  },
});

export default StoreHats; 