import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetData, PetType, GrowthStage } from '../types/petTypes';
import { savePetData } from '../utils/petUtils';

interface DataContextType {
  petData: PetData | null;
  setPetData: (data: PetData | null) => void;
  isDevelopmentMode: boolean;
  setIsDevelopmentMode: (value: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [petData, setPetData] = useState<PetData | null>({
    id: 'default',
    name: 'Default Pet',
    type: 'terrabun',
    category: 'mythic',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    growthStage: 'Egg',
    stepsToHatch: 1000,
    stepsSinceHatched: 0,
    totalSteps: 0,
    startingStepCount: 0,
    appearance: {
      mainColor: '#FFFFFF',
      accentColor: '#000000',
      hasCustomization: false,
      customizationApplied: false,
      backgroundTheme: 'default',
      hasEliteBadge: false,
      hasAnimatedBackground: false
    },
    miniGames: {
      feed: { lastClaimed: null, claimedToday: false },
      fetch: { lastClaimed: null, claimsToday: 0 },
      adventure: { lastStarted: null, lastCompleted: null, currentProgress: 0, isActive: false }
    },
    milestones: [],
    created: new Date().toISOString()
  });
  const [isDevelopmentMode, setIsDevelopmentMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load pet data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('@pet_data');
        if (storedData !== null) {
          setPetData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error('Error loading pet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save pet data to storage whenever it changes
  useEffect(() => {
    if (!isLoading && petData) {
      savePetData(petData);
    }
  }, [petData, isLoading]);

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