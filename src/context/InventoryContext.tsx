import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGems } from './GemContext';

interface InventoryContextType {
  ownedItems: string[]; // Array of item IDs
  isItemOwned: (itemId: string) => boolean;
  purchaseItem: (itemId: string, price: number) => Promise<boolean>;
  isLoading: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INVENTORY_KEY = '@inventory_items';

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { deductGems } = useGems();

  // Load inventory from storage on mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const storedItems = await AsyncStorage.getItem(INVENTORY_KEY);
        if (storedItems !== null) {
          setOwnedItems(JSON.parse(storedItems));
        }
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInventory();
  }, []);

  const isItemOwned = (itemId: string): boolean => {
    return ownedItems.includes(itemId);
  };

  const purchaseItem = async (itemId: string, price: number): Promise<boolean> => {
    if (isItemOwned(itemId)) {
      return false; // Item already owned
    }

    const success = await deductGems(price);
    if (!success) {
      return false; // Not enough gems
    }

    try {
      const newOwnedItems = [...ownedItems, itemId];
      await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(newOwnedItems));
      setOwnedItems(newOwnedItems);
      return true;
    } catch (error) {
      console.error('Error purchasing item:', error);
      return false;
    }
  };

  return (
    <InventoryContext.Provider value={{ ownedItems, isItemOwned, purchaseItem, isLoading }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}; 