import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGems } from './GemContext';
import { useData } from './DataContext';

export type ItemCategory = 'Hats' | 'Eyewear' | 'Neck';

export interface EquippedItems {
  Hats?: string;
  Eyewear?: string;
  Neck?: string;
}

interface InventoryContextType {
  ownedItems: string[]; // Array of item IDs
  equippedItems: EquippedItems;
  isItemOwned: (itemId: string) => boolean;
  isItemEquipped: (itemId: string) => boolean;
  purchaseItem: (itemId: string, price: number) => Promise<boolean>;
  equipItem: (itemId: string, category: ItemCategory) => Promise<boolean>;
  unequipItem: (category: ItemCategory) => Promise<boolean>;
  getEquippedItemForCategory: (category: ItemCategory) => string | undefined;
  isLoading: boolean;
  setOwnedItems: (items: string[]) => void;
  setEquippedItems: (items: EquippedItems) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INVENTORY_KEY = '@inventory_items';
const EQUIPPED_ITEMS_KEY = '@equipped_items';

// Default items for development mode
const DEFAULT_ITEMS = {
  Hats: 'top_hat',
  Eyewear: 'sunglasses',
  Neck: 'bow_tie'
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { deductGems } = useGems();
  const { isDevelopmentMode } = useData();

  // Load inventory and equipped items from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedItems, storedEquippedItems] = await Promise.all([
          AsyncStorage.getItem(INVENTORY_KEY),
          AsyncStorage.getItem(EQUIPPED_ITEMS_KEY),
        ]);

        if (isDevelopmentMode) {
          // In development mode, use default items
          const defaultItemIds = Object.values(DEFAULT_ITEMS);
          setOwnedItems(defaultItemIds);
          setEquippedItems(DEFAULT_ITEMS);
          // Save the default items
          await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(defaultItemIds));
          await AsyncStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(DEFAULT_ITEMS));
        } else {
          // Normal mode, load from storage
          if (storedItems !== null) {
            setOwnedItems(JSON.parse(storedItems));
          }
          if (storedEquippedItems !== null) {
            setEquippedItems(JSON.parse(storedEquippedItems));
          }
        }
      } catch (error) {
        console.error('Error loading inventory data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isDevelopmentMode]);

  const isItemOwned = (itemId: string): boolean => {
    return ownedItems.includes(itemId);
  };

  const isItemEquipped = (itemId: string): boolean => {
    return Object.values(equippedItems).includes(itemId);
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

  const equipItem = async (itemId: string, category: ItemCategory): Promise<boolean> => {
    if (!isItemOwned(itemId)) {
      return false; // Can't equip unowned items
    }

    try {
      const newEquippedItems = {
        ...equippedItems,
        [category]: itemId,
      };
      await AsyncStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(newEquippedItems));
      setEquippedItems(newEquippedItems);
      return true;
    } catch (error) {
      console.error('Error equipping item:', error);
      return false;
    }
  };

  const unequipItem = async (category: ItemCategory): Promise<boolean> => {
    try {
      const newEquippedItems = { ...equippedItems };
      delete newEquippedItems[category];
      await AsyncStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(newEquippedItems));
      setEquippedItems(newEquippedItems);
      return true;
    } catch (error) {
      console.error('Error unequipping item:', error);
      return false;
    }
  };

  const getEquippedItemForCategory = (category: ItemCategory): string | undefined => {
    return equippedItems[category];
  };

  return (
    <InventoryContext.Provider 
      value={{ 
        ownedItems, 
        equippedItems,
        isItemOwned, 
        isItemEquipped,
        purchaseItem, 
        equipItem,
        unequipItem,
        getEquippedItemForCategory,
        isLoading,
        setOwnedItems,
        setEquippedItems
      }}
    >
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