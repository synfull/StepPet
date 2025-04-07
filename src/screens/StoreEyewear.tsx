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

export const eyewearItems: StoreItem[] = [
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    price: 200,
    image: require('../../assets/images/store/items/eyewear/sunglasses.png'),
    description: 'Stylish shades for sunny days',
  },
  {
    id: 'monocle',
    name: 'Monocle',
    price: 300,
    image: require('../../assets/images/store/items/eyewear/monocle.png'),
    description: 'A sophisticated single lens for distinguished pets',
  },
  {
    id: 'eye_patch',
    name: 'Eye Patch',
    price: 250,
    image: require('../../assets/images/store/items/eyewear/eye_patch.png'),
    description: 'A classic pirate accessory for adventurous pets',
  },
  {
    id: 'heart_glasses',
    name: 'Heart Shaped Glasses',
    price: 350,
    image: require('../../assets/images/store/items/eyewear/heart_glasses.png'),
    description: 'Cute heart-shaped frames for lovable pets',
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

const StoreEyewear = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eyewear</Text>
      </View>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {eyewearItems.map((item) => (
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

export default StoreEyewear; 