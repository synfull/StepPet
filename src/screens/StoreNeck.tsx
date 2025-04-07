import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

type StoreItem = {
  id: string;
  name: string;
  price: number;
  image: any;
  description: string;
};

const neckItems: StoreItem[] = [
  {
    id: 'bandana',
    name: 'Bandana',
    price: 50,
    image: require('../../assets/images/store/neck/bandana.png'),
    description: 'A stylish bandana for your pet',
  },
  {
    id: 'gold_chain',
    name: 'Gold Chain',
    price: 150,
    image: require('../../assets/images/store/neck/gold_chain.png'),
    description: 'A luxurious gold chain',
  },
  {
    id: 'magic_amulet',
    name: 'Magic Amulet',
    price: 200,
    image: require('../../assets/images/store/neck/magic_amulet.png'),
    description: 'An enchanted amulet with mysterious powers',
  },
  {
    id: 'bow_tie',
    name: 'Bow Tie',
    price: 80,
    image: require('../../assets/images/store/neck/bow_tie.png'),
    description: 'Perfect for formal occasions',
  },
];

const StoreItemCard: React.FC<{ item: StoreItem }> = ({ item }) => (
  <TouchableOpacity style={styles.itemCard}>
    <View style={styles.itemInfo}>
      <View style={styles.leftContent}>
        <Image source={item.image} style={styles.itemImage} />
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.price}</Text>
          <Text style={styles.priceLabel}>Gems</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const StoreNeck = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Neck</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Available Neck Items</Text>
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
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#333333',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContent: {
    marginRight: 16,
  },
  rightContent: {
    flex: 1,
  },
  itemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  itemName: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 4,
  },
  itemDescription: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#8C52FF',
  },
  priceLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
});

export default StoreNeck; 