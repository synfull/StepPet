import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types/navigationTypes';
import { useData } from '../context/DataContext';
import { PedometerContext } from '../context/PedometerContext';
import { createNewPet, savePetData, getRandomPetType, PET_COLORS } from '../utils/petUtils';
import { PetCategory, GrowthStage } from '../types/petTypes';
import Button from '../components/Button';
import PetDisplay from '../components/PetDisplay';
import Header from '../components/Header';

type PetNamingNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PetNamingRouteProp = RouteProp<RootStackParamList, 'PetNaming'>;

const PetNaming: React.FC = () => {
  const route = useRoute<PetNamingRouteProp>();
  const navigation = useNavigation<PetNamingNavigationProp>();
  const { petType } = route.params;
  const [petName, setPetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { setPetData, petData } = useData();
  const { totalSteps } = useContext(PedometerContext);
  
  // Pet category based on pet type
  const getPetCategory = (): PetCategory => {
    if (['lunacorn', 'embermane', 'aetherfin', 'crystallisk'].includes(petType)) {
      return 'mythic';
    } else if (['flareep', 'aquabub', 'terrabun', 'gustling'].includes(petType)) {
      return 'elemental';
    } else if (['mossling', 'twiggle', 'thistuff', 'glimmowl'].includes(petType)) {
      return 'forest';
    } else if (['wispurr', 'batbun', 'noctuff', 'drimkin'].includes(petType)) {
      return 'shadow';
    } else {
      return 'mythic'; // Default to mythic if type is not recognized
    }
  };

  const handleNameChange = (text: string) => {
    setPetName(text);
  };

  const handleConfirmName = async () => {
    if (petName.trim().length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(true);

    try {
      if (!petData) {
        throw new Error('No pet data found');
      }

      // Update the existing pet with the new name while preserving all other properties
      const updatedPet = {
        ...petData,
        name: petName.trim(),
        type: petType,
        category: getPetCategory(),
        growthStage: 'Baby' as GrowthStage,
        appearance: {
          ...PET_COLORS[petType as keyof typeof PET_COLORS],
          hasCustomization: false,
          customizationApplied: false,
          backgroundTheme: '#FFFFFF',
          hasEliteBadge: false,
          hasAnimatedBackground: false
        }
      };
      
      // Save pet data
      await savePetData(updatedPet);
      
      // Update context
      setPetData(updatedPet);
      
      // Navigate to the main screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Error updating pet name:', error);
      setIsLoading(false);
    }
  };

  // Name suggestions based on pet category
  const generateRandomName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const mythicNames = ['Luna', 'Nova', 'Zephyr', 'Ember', 'Frost', 'Nimbus', 'Orion', 'Aurora', 'Storm'];
    const elementalNames = ['Pyro', 'Aqua', 'Terra', 'Aero', 'Bolt', 'Flare', 'Tide', 'Spark', 'Crystal'];
    const forestNames = ['Moss', 'Twig', 'Leaf', 'Bloom', 'Fern', 'Petal', 'Root', 'Seed', 'Sprout'];
    const shadowNames = ['Noct', 'Wisp', 'Shade', 'Dusk', 'Gloom', 'Mist', 'Veil', 'Echo', 'Rune'];
    
    let nameOptions: string[];
    
    switch (getPetCategory()) {
      case 'mythic':
        nameOptions = mythicNames;
        break;
      case 'elemental':
        nameOptions = elementalNames;
        break;
      case 'forest':
        nameOptions = forestNames;
        break;
      case 'shadow':
        nameOptions = shadowNames;
        break;
      default:
        nameOptions = [...mythicNames, ...elementalNames, ...forestNames, ...shadowNames];
    }
    
    const randomName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
    setPetName(randomName);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <Header
        title="Name Your Pet"
        showBackButton
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <PetDisplay
            petType={petType}
            growthStage="Baby"
            size="xlarge"
            showEquippedItems={false}
          />
          <Text style={styles.title}>What would you like to name your pet?</Text>
          <TextInput
            style={styles.input}
            value={petName}
            onChangeText={handleNameChange}
            placeholder="Enter a name"
            placeholderTextColor="#909090"
            maxLength={20}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
          <Button
            title="Generate Random Name"
            onPress={generateRandomName}
            size="medium"
            style={styles.randomButton}
          />
          <Button
            title="Confirm Name"
            onPress={handleConfirmName}
            size="large"
            style={styles.confirmButton}
            disabled={isLoading || petName.trim().length === 0}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 24,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: 'Montserrat-Regular',
    color: '#333333',
    marginBottom: 16,
  },
  randomButton: {
    marginBottom: 24,
  },
  confirmButton: {
    marginTop: 8,
  },
});

export default PetNaming; 