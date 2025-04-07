import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StoreItemCard } from '../components/StoreItemCard';
import { StoreItem } from './StoreHats';

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
});

export default StoreEyewear; 