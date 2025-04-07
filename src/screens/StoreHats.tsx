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

const hatItems: StoreItem[] = [
  {
    id: 'top_hat',
    name: 'Top Hat',
    price: 100,
    image: require('../../assets/images/store/hats/top_hat.png'),
    description: 'A classic and elegant top hat',
  },
  {
    id: 'wizard_hat',
    name: 'Wizard Hat',
    price: 120,
    image: require('../../assets/images/store/hats/wizard_hat.png'),
    description: 'Perfect for magical adventures',
  },
  {
    id: 'halo',
    name: 'Halo',
    price: 150,
    image: require('../../assets/images/store/hats/halo.png'),
    description: 'A divine accessory for your pet',
  },
  {
    id: 'crown',
    name: 'Crown',
    price: 200,
    image: require('../../assets/images/store/hats/crown.png'),
    description: 'A majestic crown fit for a royal pet',
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

const StoreHats = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hats</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Available Hats</Text>
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

export default StoreHats; 