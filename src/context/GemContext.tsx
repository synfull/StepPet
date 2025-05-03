import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';

interface GemContextType {
  gemBalance: number;
  addGems: (amount: number) => Promise<void>;
  deductGems: (amount: number) => Promise<boolean>;
  isLoading: boolean;
  setGemBalance: (balance: number) => void;
}

const GemContext = createContext<GemContextType | undefined>(undefined);

// Function to generate user-specific key
const getGemBalanceKey = (userId: string | undefined): string | null => {
  return userId ? `@gem_balance_${userId}` : null;
};

export const GemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData } = useUser();
  const userId = userData?.id;

  const [gemBalance, setGemBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load gem balance from storage on mount or user change
  useEffect(() => {
    const loadGemBalance = async () => {
      setIsLoading(true);
      const storageKey = getGemBalanceKey(userId);
      
      if (storageKey) {
        try {
          const storedBalance = await AsyncStorage.getItem(storageKey);
          if (storedBalance !== null) {
            setGemBalance(parseInt(storedBalance, 10));
          } else {
            setGemBalance(0);
          }
        } catch (error) {
          console.error('Error loading gem balance:', error);
          setGemBalance(0);
        } finally {
          setIsLoading(false);
        }
      } else {
        setGemBalance(0);
        setIsLoading(false);
      }
    };

    loadGemBalance();
  }, [userId]);

  const addGems = async (amount: number) => {
    const storageKey = getGemBalanceKey(userId);
    if (!storageKey) {
      console.error('Cannot add gems: No user logged in.');
      return;
    } 
    try {
      const newBalance = gemBalance + amount;
      await AsyncStorage.setItem(storageKey, newBalance.toString());
      setGemBalance(newBalance);
    } catch (error) {
      console.error('Error adding gems:', error);
      throw error;
    }
  };

  const deductGems = async (amount: number): Promise<boolean> => {
    const storageKey = getGemBalanceKey(userId);
    if (!storageKey) {
      console.error('Cannot deduct gems: No user logged in.');
      return false;
    }
    
    if (gemBalance < amount) {
      return false;
    }

    try {
      const newBalance = gemBalance - amount;
      await AsyncStorage.setItem(storageKey, newBalance.toString());
      setGemBalance(newBalance);
      return true;
    } catch (error) {
      console.error('Error deducting gems:', error);
      return false;
    }
  };

  return (
    <GemContext.Provider value={{ gemBalance, addGems, deductGems, isLoading, setGemBalance }}>
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