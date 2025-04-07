import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StoreItemCard } from '../components/StoreItemCard';

export type StoreItem = {
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
});

export default StoreHats; 