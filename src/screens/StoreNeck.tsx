import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StoreItemCard } from '../components/StoreItemCard';
import { StoreItem } from './StoreHats';

export const neckItems: StoreItem[] = [
  {
    id: 'bow_tie',
    name: 'Bow Tie',
    price: 200,
    image: require('../../assets/images/store/items/neck/bow_tie.png'),
    description: 'A dapper bow tie for formal occasions',
  },
  {
    id: 'magic_amulet',
    name: 'Magic Amulet',
    price: 500,
    image: require('../../assets/images/store/items/neck/magic_amulet.png'),
    description: 'An enchanted amulet with mysterious powers',
  },
  {
    id: 'gold_chain',
    name: 'Gold Chain',
    price: 450,
    image: require('../../assets/images/store/items/neck/gold_chain.png'),
    description: 'A luxurious gold chain for the stylish pet',
  },
  {
    id: 'bandana',
    name: 'Bandana',
    price: 250,
    image: require('../../assets/images/store/items/neck/bandana.png'),
    description: 'A stylish bandana for a casual look',
  },
];

const StoreNeck = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Neck</Text>
      </View>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {neckItems.map((item) => (
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

export default StoreNeck; 