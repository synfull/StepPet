import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetData, PetType, GrowthStage, MiniGames, Milestone, PetAppearance, MiniGameStatus, FetchGameStatus, AdventureStatus } from '../types/petTypes'; // Ensure all necessary subtypes are imported
// Import Supabase client (adjust path if necessary)
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Session, User } from '@supabase/supabase-js';
// Correct the import path for case conversion utils
import { Alert } from 'react-native';

// Helper function to convert object keys from snake_case to camelCase
const keysToCamelCase = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(keysToCamelCase);
  }
  return Object.keys(obj).reduce((acc, key) => {
    const camelCaseKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    // Recursively convert nested objects
    acc[camelCaseKey] = keysToCamelCase(obj[key]);
    return acc;
  }, {} as any);
};

// Helper function to convert object keys from camelCase to snake_case
const keysToSnakeCase = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(keysToSnakeCase);
  }
  return Object.keys(obj).reduce((acc, key) => {
    const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    // Recursively convert nested objects
    acc[snakeCaseKey] = keysToSnakeCase(obj[key]);
    return acc;
  }, {} as any);
};

interface DataContextType {
  petData: PetData | null;
  setPetData: (data: PetData | null) => void;
  saveDataToSupabase: (data: PetData) => Promise<void>;
  reloadData: () => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Remove AsyncStorage key generation
// const getPetStorageKey = (userId: string) => `@pet_data_${userId}`;

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session } = useAuth(); // Assuming session is also available from useAuth
  const [petData, setPetDataState] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false); // To prevent concurrent saves
  // Ref for debounce timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); 

  // --- Load Data from Supabase ---
  const loadDataFromSupabase = useCallback(async (userId: string) => {
    console.log('[DataContext] loadDataFromSupabase called for user:', userId);
    setIsLoading(true);
    try {
      // 1. Fetch main pet data
      const { data: petResult, error: petError } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (petError) {
        console.error('[DataContext] Error fetching pet data:', petError);
        throw new Error(`Error fetching pet data: ${petError.message}`);
      }

      if (!petResult) {
        console.log('[DataContext] No pet found for user:', userId);
        setPetDataState(null);
        setIsLoading(false);
        return; // Exit early if no pet found
      }

      console.log('[DataContext] Pet data fetched:', petResult);
      const petId = petResult.id;

      // 2. Fetch mini-games data associated with the pet
      const { data: miniGamesResult, error: miniGamesError } = await supabase
        .from('mini_games')
        .select('*')
        .eq('pet_id', petId);

      if (miniGamesError) {
        console.error('[DataContext] Error fetching mini-games data:', miniGamesError);
        // Decide if you want to throw or continue with partial data
        // For now, let's log and continue
      }

      // 3. Fetch milestones data associated with the pet
      const { data: milestonesResult, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('pet_id', petId);

      if (milestonesError) {
        console.error('[DataContext] Error fetching milestones data:', milestonesError);
        // Decide if you want to throw or continue with partial data
        // For now, let's log and continue
      }

      // 4. Combine data into the PetData structure
      let combinedPetData = keysToCamelCase(petResult) as PetData;
      
      // !!! Remove equippedItems loaded from Supabase !!!
      delete combinedPetData.equippedItems;
      console.log('[DataContext] Removed equippedItems potentially loaded from DB');

      combinedPetData.miniGames = {} as MiniGames;
      combinedPetData.milestones = [] as Milestone[];

      // Process mini-games
      if (miniGamesResult) {
        miniGamesResult.forEach((game: any) => {
          const gameType = game.game_type as keyof MiniGames;
          if (gameType) {
             // Convert keys for each game type
            combinedPetData.miniGames[gameType] = keysToCamelCase(game) as any;
            // Remove redundant fields if necessary (e.g., pet_id, game_type)
            delete (combinedPetData.miniGames[gameType] as any).petId;
            delete (combinedPetData.miniGames[gameType] as any).gameType;
          }
        });
      }

      // Process milestones
      if (milestonesResult) {
        combinedPetData.milestones = milestonesResult.map((milestone: any) => {
          // Map milestone_id from DB to id in the object
          const camelCaseMilestone = keysToCamelCase(milestone);
          return {
              ...camelCaseMilestone,
              id: milestone.milestone_id // Map explicitly
          } as Milestone;
        });
      }

      console.log('[DataContext] Combined PetData prepared (without equippedItems from DB):', combinedPetData);
      setPetDataState(combinedPetData);

    } catch (error) {
      console.error('[DataContext] General error in loadDataFromSupabase:', error);
      // Optionally set an error state here
      Alert.alert("Error Loading Data", "Could not load your pet's information. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Define the reloadData function --- 
  const reloadData = useCallback(async () => {
    if (user) {
      await loadDataFromSupabase(user.id);
    }
  }, [user, loadDataFromSupabase]);

  // --- useEffect to load data on session change --- 
  useEffect(() => {
    if (user) {
      console.log('[DataContext] User detected, loading data...');
      loadDataFromSupabase(user.id);
    } else {
      console.log('[DataContext] No user, clearing data...');
      setPetDataState(null); // Clear data if user logs out
      setIsLoading(false);
    }
  }, [user, loadDataFromSupabase]);

  // --- Define Save Logic --- 
  // Modify implementation to take only one argument and get user ID from session
  const saveDataToSupabase = useCallback(async (dataToSave: PetData) => {
    if (!session?.user?.id) {
      console.warn('[DataContext] saveDataToSupabase called, but no user ID available.');
      return; // Cannot save without user ID
    }
    const userId = session.user.id;
    console.log(`[DataContext] Attempting to save pet data for user: ${userId}, Pet ID: ${dataToSave.id}`);

    try {
        // 1. Prepare Pet fields for Upsert
        // !!! Exclude equippedItems from the data being saved to the 'pets' table !!!
        const { miniGames, milestones, equippedItems, ...petFieldsRaw } = dataToSave;
        
        const petFieldsForUpsert = { 
            ...keysToSnakeCase(petFieldsRaw), 
            user_id: userId 
        };
        console.log('[DataContext] Upserting Pet fields (excluding equippedItems):', petFieldsForUpsert);
        const { error: petUpsertError } = await supabase
            .from('pets')
            .upsert(petFieldsForUpsert, { onConflict: 'user_id' });

        if (petUpsertError) {
            console.error('[DataContext] Error upserting pet data:', petUpsertError);
            throw petUpsertError; // Propagate error
        }
        console.log('[DataContext] Pet fields successfully upserted.');

        // 2. Prepare and Upsert MiniGames data
        if (miniGames) {
            console.log('[DataContext] Preparing MiniGames upserts...');
            const gameTypes = Object.keys(miniGames) as Array<keyof MiniGames>;
            const upsertPromises = [];

            for (const gameType of gameTypes) {
                const gameData = miniGames[gameType];
                let rowToUpsert: any = {
                    pet_id: dataToSave.id, // Use the main pet ID
                    game_type: gameType,
                };
                
                // Add specific fields based on game type (ensure keys are snake_case)
                 if (gameType === 'feed') {
                    if ('lastClaimed' in gameData) rowToUpsert.last_claimed = gameData.lastClaimed || null;
                    if ('claimedToday' in gameData) rowToUpsert.claimed_today = gameData.claimedToday;
                 } else if (gameType === 'fetch') {
                     if ('lastClaimed' in gameData) rowToUpsert.last_claimed = gameData.lastClaimed || null;
                     if ('claimsToday' in gameData) rowToUpsert.claims_today = gameData.claimsToday;
                 } else if (gameType === 'adventure') {
                     if ('lastStarted' in gameData) rowToUpsert.last_started = gameData.lastStarted || null;
                     if ('lastCompleted' in gameData) rowToUpsert.last_completed = gameData.lastCompleted || null;
                     if ('currentProgress' in gameData) rowToUpsert.current_progress = gameData.currentProgress;
                     if ('isActive' in gameData) rowToUpsert.is_active = gameData.isActive;
                 }

                // Clean up undefined before upsert
                Object.keys(rowToUpsert).forEach(key => { if (rowToUpsert[key] === undefined) { rowToUpsert[key] = null; } });
                
                console.log(`[DataContext] Upserting MiniGame row:`, rowToUpsert);
                upsertPromises.push(
                    supabase
                        .from('mini_games')
                        .upsert(rowToUpsert, { onConflict: 'pet_id, game_type' }) // Composite key conflict
                );
            }
            
            // Execute all upserts
            const results = await Promise.allSettled(upsertPromises);
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const supabaseError = result.reason?.error || result.reason;
                    console.error(`[DataContext] Error upserting MiniGame (${gameTypes[index]}):`, supabaseError);
                    // Decide if this is critical - maybe throw an error?
                } else {
                    console.log(`[DataContext] MiniGame (${gameTypes[index]}) successfully upserted.`);
                }
            });
        }
        
        // 3. Prepare and Upsert Milestones data
        if (milestones && milestones.length > 0) {
          console.log('[DataContext] Preparing Milestones upserts...');
          const milestoneUpsertPromises = milestones.map(milestone => {
              // Map the code's 'id' field to the database's 'milestone_id' column
              // Omit the auto-generated 'id' field if present from fetch
              const { id: milestoneIdentifier, ...restOfMilestone } = milestone;
              const milestoneToUpsert = {
                ...keysToSnakeCase(restOfMilestone),
                milestone_id: milestoneIdentifier, // Ensure the text identifier is present
                pet_id: dataToSave.id, // Add the foreign key
              };
              // Clean up undefined values
              Object.keys(milestoneToUpsert).forEach(key => { 
                  if (milestoneToUpsert[key] === undefined) { 
                      milestoneToUpsert[key] = null; 
                  } 
              });
              console.log(`[DataContext] Upserting Milestone row:`, milestoneToUpsert);
              return supabase
                .from('milestones')
                .upsert(milestoneToUpsert, { onConflict: 'pet_id, milestone_id' }); // Upsert based on pet and milestone identifier
          });

          // Execute all milestone upserts
          const milestoneResults = await Promise.allSettled(milestoneUpsertPromises);
          milestoneResults.forEach((result, index) => {
              if (result.status === 'rejected') {
                  const supabaseError = result.reason?.error || result.reason;
                  console.error(`[DataContext] Error upserting Milestone (${milestones[index].id}):`, supabaseError);
              } else {
                  // console.log(`[DataContext] Milestone (${milestones[index].id}) successfully upserted.`); // Optional success log
              }
          });
           console.log('[DataContext] Finished milestone upserts.');
        } else {
            console.log('[DataContext] No milestones in data to save.');
        }

        console.log('[DataContext] Save completed successfully.');
    } catch (error) {
      console.error('[DataContext] Error saving data to Supabase:', error);
      // Potentially handle the error (e.g., show a message to the user)
    }
  }, [session]);
  
  // Debounced setPetData that triggers save
  // Modify this to call the new saveDataToSupabase signature
  const setPetDataAndSave = (data: PetData | null) => {
    setPetDataState(data);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (data) { // Only save if data is not null
      saveTimeoutRef.current = setTimeout(() => {
        saveDataToSupabase(data); // Call with the single data argument
      }, 1500); // Debounce time
    } else {
        console.log('[DataContext] setPetDataAndSave called with null, skipping save.');
        // Optionally handle clearing data in DB if needed on logout/deletion
    }
  };

  // --- Provide Context Value --- 
  return (
    <DataContext.Provider 
      value={{ 
        petData, 
        setPetData: setPetDataAndSave, // Use the debounced setter
        saveDataToSupabase, // Provide the corrected save function
        reloadData,
        isLoading 
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) { // Fix: Check for undefined
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 