import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PetData {
  id: string;
  name: string;
  type: string;
  level: number;
  experience: number;
  happiness: number;
  lastInteraction: number;
  createdAt: number;
}

interface PetContextType {
  pets: PetData[];
  setPets: (pets: PetData[]) => void;
  addPet: (pet: PetData) => Promise<void>;
  updatePet: (pet: PetData) => Promise<void>;
  removePet: (petId: string) => Promise<void>;
  isLoading: boolean;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

const PETS_KEY = '@pets_data';

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pets, setPets] = useState<PetData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load pets from storage on mount
  useEffect(() => {
    const loadPets = async () => {
      try {
        const storedPets = await AsyncStorage.getItem(PETS_KEY);
        if (storedPets !== null) {
          setPets(JSON.parse(storedPets));
        }
      } catch (error) {
        console.error('Error loading pets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPets();
  }, []);

  const addPet = async (pet: PetData) => {
    try {
      const newPets = [...pets, pet];
      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(newPets));
      setPets(newPets);
    } catch (error) {
      console.error('Error adding pet:', error);
      throw error;
    }
  };

  const updatePet = async (pet: PetData) => {
    try {
      const newPets = pets.map(p => p.id === pet.id ? pet : p);
      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(newPets));
      setPets(newPets);
    } catch (error) {
      console.error('Error updating pet:', error);
      throw error;
    }
  };

  const removePet = async (petId: string) => {
    try {
      const newPets = pets.filter(p => p.id !== petId);
      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(newPets));
      setPets(newPets);
    } catch (error) {
      console.error('Error removing pet:', error);
      throw error;
    }
  };

  return (
    <PetContext.Provider value={{ pets, setPets, addPet, updatePet, removePet, isLoading }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePets = () => {
  const context = useContext(PetContext);
  if (context === undefined) {
    throw new Error('usePets must be used within a PetProvider');
  }
  return context;
}; 