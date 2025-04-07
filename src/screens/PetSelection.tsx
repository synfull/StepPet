import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types/navigationTypes';
import { PetType, PetCategory } from '../types/petTypes';
import { PET_CATEGORIES, PET_TYPES } from '../utils/petUtils';
import PetDisplay from '../components/PetDisplay';

type PetSelectionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PetSelection'>;

const PetSelection: React.FC = () => {
  const navigation = useNavigation<PetSelectionNavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState<PetCategory>('mythic');

  const handleCategorySelect = (category: PetCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handlePetSelect = (petType: PetType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PetHatching', { petType });
  };

  const renderCategories = () => {
    return Object.entries(PET_CATEGORIES).map(([category, data]) => (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryButton,
          selectedCategory === category && styles.selectedCategory,
        ]}
        onPress={() => handleCategorySelect(category as PetCategory)}
      >
        <Text
          style={[
            styles.categoryText,
            selectedCategory === category && styles.selectedCategoryText,
          ]}
        >
          {data.name}
        </Text>
      </TouchableOpacity>
    ));
  };

  const renderPets = () => {
    const petsInCategory = PET_CATEGORIES[selectedCategory].pets;
    return petsInCategory.map((petType) => (
      <TouchableOpacity
        key={petType}
        style={styles.petCard}
        onPress={() => handlePetSelect(petType)}
      >
        <View style={styles.petIconContainer}>
          <PetDisplay
            petType={petType}
            growthStage="Baby"
            level={1}
            mainColor={PET_TYPES[petType].baseStats.health.toString()}
            accentColor={PET_TYPES[petType].baseStats.attack.toString()}
            size="medium"
            showIcon={true}
          />
        </View>
        <Text style={styles.petName}>{PET_TYPES[petType].name}</Text>
        <Text style={styles.petDescription} numberOfLines={2}>
          {PET_TYPES[petType].description}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Pet</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {renderCategories()}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.petsScroll}
        contentContainerStyle={styles.petsContainer}
      >
        {renderPets()}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  categoryScroll: {
    maxHeight: 60,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  selectedCategory: {
    backgroundColor: '#8C52FF',
  },
  categoryText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#666666',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  petsScroll: {
    flex: 1,
  },
  petsContainer: {
    padding: 16,
    gap: 16,
  },
  petCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  petIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petName: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 4,
  },
  petDescription: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
  },
});

export default PetSelection; 