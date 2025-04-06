import React, { useState, useContext, useEffect } from 'react';
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
import { DataContext } from '../context/DataContext';
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
  const { setPetData, petData } = useContext(DataContext);
  const { totalSteps } = useContext(PedometerContext);
  
  // Pet category based on pet type
  const getPetCategory = () => {
    if (['Dragon', 'Unicorn'].includes(petType)) {
      return 'Fantasy';
    } else if (['Wolf', 'Eagle'].includes(petType)) {
      return 'Animals';
    } else if (['FireLizard', 'WaterTurtle'].includes(petType)) {
      return 'Elemental';
    } else {
      return 'Quirky';
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
        category: getPetCategory() as PetCategory,
        growthStage: 'Baby' as GrowthStage,
        appearance: {
          ...PET_COLORS[petType as keyof typeof PET_COLORS],
          hasCustomization: false,
          customizationApplied: false
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

  const generateRandomName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Different name sets based on pet type
    const fantasyNames = ['Luna', 'Nova', 'Zephyr', 'Ember', 'Frost', 'Nimbus', 'Orion', 'Aurora', 'Storm'];
    const animalNames = ['Shadow', 'Echo', 'Sierra', 'Blaze', 'Scout', 'Ranger', 'Sky', 'Rusty', 'Rocky'];
    const elementalNames = ['Pyro', 'Aqua', 'Terra', 'Aero', 'Bolt', 'Flare', 'Tide', 'Spark', 'Crystal'];
    const quirkyNames = ['Gizmo', 'Sprocket', 'Widget', 'Cog', 'Bolt', 'Tinker', 'Pixel', 'Glitch', 'Gadget'];
    
    let nameOptions: string[] = [];
    switch (getPetCategory()) {
      case 'Fantasy':
        nameOptions = fantasyNames;
        break;
      case 'Animals':
        nameOptions = animalNames;
        break;
      case 'Elemental':
        nameOptions = elementalNames;
        break;
      case 'Quirky':
        nameOptions = quirkyNames;
        break;
      default:
        nameOptions = [...fantasyNames, ...animalNames, ...elementalNames, ...quirkyNames];
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
            level={1}
            mainColor={PET_COLORS[petType as keyof typeof PET_COLORS].mainColor}
            accentColor={PET_COLORS[petType as keyof typeof PET_COLORS].accentColor}
            hasCustomization={false}
            size="xlarge"
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