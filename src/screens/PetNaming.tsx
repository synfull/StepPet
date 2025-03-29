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
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types/navigationTypes';
import { DataContext } from '../context/DataContext';
import { PedometerContext } from '../context/PedometerContext';
import { createNewPet, savePetData, getRandomPetType, PET_COLORS } from '../utils/petUtils';
import { PetCategory, GrowthStage } from '../types/petTypes';
import Button from '../components/Button';
import PetDisplay from '../components/PetDisplay';
import Header from '../components/Header';

type PetNamingProps = NativeStackScreenProps<RootStackParamList, 'PetNaming'>;

const PetNaming: React.FC<PetNamingProps> = ({ navigation, route }) => {
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <StatusBar style="dark" />
        <Header 
          title="Name Your Pet" 
          showBackButton
        />
        
        <View style={styles.content}>
          <View style={styles.petContainer}>
            <PetDisplay
              petType={petType}
              growthStage="Baby"
              level={1}
              mainColor="#8C52FF"
              accentColor="#5EFFA9"
              size="large"
            />
          </View>
          
          <Text style={styles.promptText}>
            What would you like to name your new {petType}?
          </Text>
          
          <View style={[styles.inputContainer, isInputFocused && styles.inputContainerFocused]}>
            <TextInput
              style={styles.input}
              placeholder="Enter pet name"
              placeholderTextColor="#A0A0A0"
              value={petName}
              onChangeText={handleNameChange}
              maxLength={15}
              autoCapitalize="words"
              autoCorrect={false}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </View>
          
          <TouchableWithoutFeedback onPress={generateRandomName}>
            <View style={styles.randomNameButton}>
              <Text style={styles.randomNameText}>Generate random name</Text>
            </View>
          </TouchableWithoutFeedback>
          
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              Tip: Choose a name that you'll love seeing every day on your pet journey!
            </Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Confirm Name"
            onPress={handleConfirmName}
            loading={isLoading}
            disabled={petName.trim().length === 0}
            size="large"
            style={styles.button}
          />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  petContainer: {
    marginVertical: 20,
  },
  promptText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  inputContainerFocused: {
    borderColor: '#8C52FF',
  },
  input: {
    flex: 1,
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#333333',
  },
  randomNameButton: {
    padding: 10,
    marginBottom: 20,
  },
  randomNameText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#8C52FF',
    textDecorationLine: 'underline',
  },
  tipContainer: {
    backgroundColor: '#F3EDFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  tipText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  button: {
    width: '100%',
  },
});

export default PetNaming; 