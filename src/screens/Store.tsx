import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';

type GemPackage = {
  id: string;
  price: number;
  gems: number;
  bonus: number;
  image: any;
};

const gemPackages: GemPackage[] = [
  {
    id: 'starter',
    price: 1.99,
    gems: 100,
    bonus: 0,
    image: require('../../assets/images/store/gems/gems_100.png'),
  },
  {
    id: 'basic',
    price: 4.99,
    gems: 300,
    bonus: 50,
    image: require('../../assets/images/store/gems/gems_350.png'),
  },
  {
    id: 'popular',
    price: 9.99,
    gems: 650,
    bonus: 150,
    image: require('../../assets/images/store/gems/gems_800.png'),
  },
  {
    id: 'value',
    price: 19.99,
    gems: 1300,
    bonus: 400,
    image: require('../../assets/images/store/gems/gems_1700.png'),
  },
  {
    id: 'premium',
    price: 49.99,
    gems: 3300,
    bonus: 1200,
    image: require('../../assets/images/store/gems/gems_4500.png'),
  },
];

const GemPackageCard: React.FC<{ pack: GemPackage }> = ({ pack }) => (
  <TouchableOpacity style={styles.gemPackage}>
    <View style={styles.gemInfo}>
      <View style={styles.leftContent}>
        <Image source={pack.image} style={styles.gemImage} />
      </View>
      <View style={styles.rightContent}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${pack.price.toFixed(2)}</Text>
          <Text style={styles.priceLabel}>USD</Text>
        </View>
        <View style={styles.gemsContainer}>
          <Text style={styles.gemsAmount}>{pack.gems}</Text>
          {pack.bonus > 0 && (
            <Text style={styles.gemsBonus}>+{pack.bonus} Bonus</Text>
          )}
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const ItemCategory: React.FC<{ title: string; onPress: () => void; count: number }> = ({ title, onPress, count }) => (
  <TouchableOpacity style={styles.itemCategory} onPress={onPress}>
    <Text style={styles.categoryTitle}>{title}</Text>
    <Text style={styles.itemCount}>{count} items</Text>
  </TouchableOpacity>
);

const GemsTab = () => {
  return (
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Select Gem Package</Text>
      {gemPackages.map((pack) => (
        <GemPackageCard key={pack.id} pack={pack} />
      ))}
    </ScrollView>
  );
};

const ItemsTab = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCategoryPress = (category: string) => {
    switch (category) {
      case 'Eyewear':
        navigation.navigate('StoreEyewear');
        break;
      case 'Hats':
        navigation.navigate('StoreHats');
        break;
      case 'Neck':
        navigation.navigate('StoreNeck');
        break;
    }
  };

  return (
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Shop by Category</Text>
      <ItemCategory title="Eyewear" onPress={() => handleCategoryPress('Eyewear')} count={4} />
      <ItemCategory title="Hats" onPress={() => handleCategoryPress('Hats')} count={4} />
      <ItemCategory title="Neck" onPress={() => handleCategoryPress('Neck')} count={4} />
    </ScrollView>
  );
};

const Store = () => {
  const [activeTab, setActiveTab] = useState<'Gems' | 'Items'>('Gems');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCategoryPress = (category: string) => {
    switch (category) {
      case 'Eyewear':
        navigation.navigate('StoreEyewear');
        break;
      case 'Hats':
        navigation.navigate('StoreHats');
        break;
      case 'Neck':
        navigation.navigate('StoreNeck');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Store</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'Gems' && styles.activeTab
          ]} 
          onPress={() => setActiveTab('Gems')}
        >
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'Gems' ? '#8C52FF' : '#909090' }
          ]}>
            Gems
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'Items' && styles.activeTab
          ]} 
          onPress={() => setActiveTab('Items')}
        >
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'Items' ? '#8C52FF' : '#909090' }
          ]}>
            Items
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'Gems' ? <GemsTab /> : <ItemsTab />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#8C52FF',
  },
  tabLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
  },
  content: {
    flex: 1,
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
  gemPackage: {
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
  gemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContent: {
    marginRight: 16,
  },
  rightContent: {
    flex: 1,
  },
  gemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#333333',
  },
  priceLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  gemsContainer: {
    alignItems: 'flex-start',
  },
  gemsAmount: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#8C52FF',
  },
  gemsBonus: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#4CAF50',
  },
  comingSoonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#333333',
    marginBottom: 12,
  },
  subText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  itemCategory: {
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
  categoryTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 4,
  },
  itemCount: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
  },
});

export default Store; 