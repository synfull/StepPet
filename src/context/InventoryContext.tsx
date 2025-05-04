import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGems } from './GemContext';
import { useAuth } from './AuthContext';

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

// --- User-Specific AsyncStorage Keys ---
const getInventoryKey = (userId: string) => `@inventory_items_${userId}`;
const getEquippedItemsKey = (userId: string) => `@equipped_items_${userId}`;

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { deductGems } = useGems();
  const { user } = useAuth();

  // --- Load Data Logic (using user-specific keys) ---
  const loadData = useCallback(async (userId: string) => {
    console.log(`[InventoryContext] Loading data for user: ${userId}`);
    setIsLoading(true);
    const inventoryKey = getInventoryKey(userId);
    const equippedItemsKey = getEquippedItemsKey(userId);
    try {
      const [storedItems, storedEquippedItems] = await Promise.all([
        AsyncStorage.getItem(inventoryKey),
        AsyncStorage.getItem(equippedItemsKey),
      ]);

      const loadedOwnedItems = storedItems ? JSON.parse(storedItems) : [];
      const loadedEquippedItems = storedEquippedItems ? JSON.parse(storedEquippedItems) : {};

      setOwnedItems(loadedOwnedItems);
      setEquippedItems(loadedEquippedItems);

      console.log(`[InventoryContext] User ${userId} - Owned items loaded:`, loadedOwnedItems);
      console.log(`[InventoryContext] User ${userId} - Equipped items loaded:`, loadedEquippedItems);

    } catch (error) {
      console.error(`Error loading inventory data for user ${userId}:`, error);
      setOwnedItems([]);
      setEquippedItems({});
    } finally {
      setIsLoading(false);
      console.log(`[InventoryContext] Loading complete for user ${userId}.`);
    }
  }, []);

  // --- Clear Data Logic (using user-specific keys if user exists) ---
  // Note: This is called when user becomes null, so we might not have the old userId.
  // It's better to clear the generic keys if we can't get the specific user's keys.
  // However, the main fix is using user-specific keys on load/save.
  // We'll clear the state, and the *next* load for a user will get their specific data.
  const clearData = useCallback(async () => {
    console.log('[InventoryContext] Clearing local state...');
    setIsLoading(true);
    try {
      setOwnedItems([]);
      setEquippedItems({});
      // We don't have userId here, so we can't remove the specific keys.
      // This is okay because loadData uses user-specific keys.
      // If needed, we could store the last userId to clear specific keys on logout.
      console.log('[InventoryContext] Local state cleared.');
    } catch (error) {
      console.error('Error clearing inventory local state:', error);
    } finally {
       setIsLoading(false);
    }
  }, []);

  // --- Effect to Load/Clear Data based on User Auth State ---
  useEffect(() => {
    if (user) {
      // User logged in - load their specific data
      loadData(user.id);
    } else {
      // User logged out - clear local state
      clearData();
    }
  }, [user, loadData, clearData]);

  const isItemOwned = (itemId: string): boolean => {
    return ownedItems.includes(itemId);
  };

  const isItemEquipped = (itemId: string): boolean => {
    return Object.values(equippedItems).includes(itemId);
  };

  const purchaseItem = async (itemId: string, price: number): Promise<boolean> => {
    if (!user) return false; // Need user context
    if (isItemOwned(itemId)) return false;

    const success = await deductGems(price);
    if (!success) return false;

    try {
      const newOwnedItems = [...ownedItems, itemId];
      const inventoryKey = getInventoryKey(user.id);
      await AsyncStorage.setItem(inventoryKey, JSON.stringify(newOwnedItems));
      setOwnedItems(newOwnedItems);
      return true;
    } catch (error) {
      console.error('Error purchasing item:', error);
      return false;
    }
  };

  const equipItem = async (itemId: string, category: ItemCategory): Promise<boolean> => {
    if (!user) return false; // Need user context
    if (!isItemOwned(itemId)) return false;

    try {
      const newEquippedItems = {
        ...equippedItems,
        [category]: itemId,
      };
      const equippedItemsKey = getEquippedItemsKey(user.id);
      await AsyncStorage.setItem(equippedItemsKey, JSON.stringify(newEquippedItems));
      setEquippedItems(newEquippedItems);
      return true;
    } catch (error) {
      console.error('Error equipping item:', error);
      return false;
    }
  };

  const unequipItem = async (category: ItemCategory): Promise<boolean> => {
    if (!user) return false; // Need user context
    try {
      const newEquippedItems = { ...equippedItems };
      delete newEquippedItems[category];
      const equippedItemsKey = getEquippedItemsKey(user.id);
      await AsyncStorage.setItem(equippedItemsKey, JSON.stringify(newEquippedItems));
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