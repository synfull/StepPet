import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GemContextType {
  gemBalance: number;
  addGems: (amount: number) => Promise<void>;
  deductGems: (amount: number) => Promise<boolean>;
  isLoading: boolean;
}

const GemContext = createContext<GemContextType | undefined>(undefined);

const GEM_BALANCE_KEY = '@gem_balance';

export const GemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gemBalance, setGemBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load gem balance from storage on mount
  useEffect(() => {
    const loadGemBalance = async () => {
      try {
        const storedBalance = await AsyncStorage.getItem(GEM_BALANCE_KEY);
        if (storedBalance !== null) {
          setGemBalance(parseInt(storedBalance, 10));
        }
      } catch (error) {
        console.error('Error loading gem balance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGemBalance();
  }, []);

  const addGems = async (amount: number) => {
    try {
      const newBalance = gemBalance + amount;
      await AsyncStorage.setItem(GEM_BALANCE_KEY, newBalance.toString());
      setGemBalance(newBalance);
    } catch (error) {
      console.error('Error adding gems:', error);
      throw error;
    }
  };

  const deductGems = async (amount: number): Promise<boolean> => {
    if (gemBalance < amount) {
      return false;
    }

    try {
      const newBalance = gemBalance - amount;
      await AsyncStorage.setItem(GEM_BALANCE_KEY, newBalance.toString());
      setGemBalance(newBalance);
      return true;
    } catch (error) {
      console.error('Error deducting gems:', error);
      return false;
    }
  };

  return (
    <GemContext.Provider value={{ gemBalance, addGems, deductGems, isLoading }}>
      {children}
    </GemContext.Provider>
  );
};

export const useGems = () => {
  const context = useContext(GemContext);
  if (context === undefined) {
    throw new Error('useGems must be used within a GemProvider');
  }
  return context;
}; 