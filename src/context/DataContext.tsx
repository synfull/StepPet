import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetData, PetType, GrowthStage } from '../types/petTypes';
import { savePetData } from '../utils/petUtils';
import { useAuth } from './AuthContext';

interface DataContextType {
  petData: PetData | null;
  setPetData: (data: PetData | null) => void;
  isDevelopmentMode: boolean;
  setIsDevelopmentMode: (value: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getPetStorageKey = (userId: string) => `@pet_data_${userId}`;

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [petData, setPetData] = useState<PetData | null>(null);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load pet data from storage on mount or when user changes
  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.id) {
          const storageKey = getPetStorageKey(user.id);
          const storedData = await AsyncStorage.getItem(storageKey);
          if (storedData !== null) {
            setPetData(JSON.parse(storedData));
          } else {
            // If no pet data exists for this user, clear the state
            setPetData(null);
          }
        } else {
          // No user logged in, clear pet data
          setPetData(null);
        }
      } catch (error) {
        console.error('Error loading pet data:', error);
        setPetData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Save pet data to storage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      if (!isLoading && petData && user?.id) {
        const storageKey = getPetStorageKey(user.id);
        await AsyncStorage.setItem(storageKey, JSON.stringify(petData));
      }
    };

    saveData();
  }, [petData, isLoading, user]);

  return (
    <DataContext.Provider 
      value={{ 
        petData, 
        setPetData,
        isDevelopmentMode,
        setIsDevelopmentMode
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 