import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
// Remove AsyncStorage import
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetData, PetType, GrowthStage, MiniGames, Milestone, PetAppearance, MiniGameStatus, FetchGameStatus, AdventureStatus } from '../types/petTypes'; // Ensure all necessary subtypes are imported
// Import Supabase client (adjust path if necessary)
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Session, User } from '@supabase/supabase-js';

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
    // Prevent converting keys within nested JSONB objects like appearance, miniGames, milestones, equippedItems
     if (['appearance', 'miniGames', 'milestones', 'equippedItems'].includes(key) && typeof obj[key] === 'object') {
       acc[key] = obj[key]; // Keep nested object keys as they are
     } else {
      const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      // Recursively convert nested objects unless they are the specifically excluded ones
      acc[snakeCaseKey] = keysToSnakeCase(obj[key]);
     }
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth(); // Assuming session is also available from useAuth
  const [petData, setPetDataState] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false); // To prevent concurrent saves
  // Ref for debounce timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); 

  // --- Load Data from Supabase ---
  const loadDataFromSupabase = async () => {
    console.log('[DataContext] loadDataFromSupabase called.');
    setIsLoading(true);
    try {
      if (!session?.user?.id) {
        console.log('[DataContext] No user/session found, clearing data.');
        setPetDataState(null);
        return;
      }
      const userId = session.user.id;
      console.log(`[DataContext] Loading pet data for user: ${userId}`);

      // 1. Fetch Pet Data
      const { data: petResult, error: petError } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to handle 0 or 1 result

      if (petError) {
        console.error('[DataContext] Error fetching pet:', petError);
        setPetDataState(null); // Clear data on error
        throw petError; // Re-throw to indicate failure
      }

      if (!petResult) {
        console.log(`[DataContext] No pet found for user: ${userId}`);
        setPetDataState(null);
        return; // No pet, nothing else to load
      }
       console.log('[DataContext] Raw Pet data fetched:', petResult);
      const petId = petResult.id;

      // 2. Fetch MiniGames Data (associated with the found pet)
      const { data: miniGamesResult, error: miniGamesError } = await supabase
        .from('mini_games')
        .select('*')
        .eq('pet_id', petId);
        
      if (miniGamesError) {
        console.error('[DataContext] Error fetching mini games:', miniGamesError);
        // Decide how to handle: clear all data? Or proceed with just pet data?
        // For now, let's log and continue, but the pet object will lack minigame data.
      }
      console.log('[DataContext] Raw MiniGames data fetched:', miniGamesResult);

      // 3. Fetch Milestones Data (associated with the found pet)
      // Assuming milestones are linked by pet_id. Adjust if needed.
      const { data: milestonesResult, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('pet_id', petId);

      if (milestonesError) {
        console.error('[DataContext] Error fetching milestones:', milestonesError);
        // Similar handling as miniGamesError
      }
       console.log('[DataContext] Raw Milestones data fetched:', milestonesResult);

      // 4. Combine and Format Data
      const formattedPetData = {
        ...keysToCamelCase(petResult),
        // Ensure nested structures match PetData type exactly
         miniGames: (
          (miniGamesResult || []).reduce((acc, game) => {
            const gameType = game.game_type as keyof MiniGames;
            if (gameType) {
              acc[gameType] = keysToCamelCase(game) as any; // Convert keys for each game object
            }
            return acc;
          }, {} as MiniGames)
         ) || { // Provide default structure if fetch failed or returned empty
            feed: { lastClaimed: null, claimedToday: false },
            fetch: { lastClaimed: null, claimsToday: 0 },
            adventure: { lastStarted: null, lastCompleted: null, currentProgress: 0, isActive: false }
          },
        milestones: keysToCamelCase(milestonesResult || []) as Milestone[],
        // Ensure appearance and equippedItems are correctly assigned (may not need conversion if fetched as jsonb)
        appearance: petResult.appearance as PetAppearance, // Assuming direct assignment works
        equippedItems: petResult.equippedItems as PetData['equippedItems'], // Assuming direct assignment
      };
       console.log('[DataContext] Combined and processed PetData:', formattedPetData);
      setPetDataState(formattedPetData);

    } catch (error) {
      console.error('[DataContext] General error loading data:', error);
      setPetDataState(null); // Clear data on any loading error
    } finally {
      console.log('[DataContext] Loading finished.');
      setIsLoading(false);
    }
  };

  // --- Define the reloadData function --- 
  const reloadData = async () => {
      console.log('[DataContext] reloadData triggered.');
      await loadDataFromSupabase();
  };

  // --- useEffect to load data on session change --- 
  useEffect(() => {
    loadDataFromSupabase();
  }, [session]);

  // --- Define Save Logic --- 
  // Modify implementation to take only one argument and get user ID from session
  const saveDataToSupabase = async (dataToSave: PetData) => {
    if (!session?.user?.id) {
      console.warn('[DataContext] saveDataToSupabase called, but no user ID available.');
      return; // Cannot save without user ID
    }
    const userId = session.user.id;
    console.log(`[DataContext] Attempting to save pet data for user: ${userId}, Pet ID: ${dataToSave.id}`);

    try {
        // 1. Prepare Pet fields for Upsert
        const { miniGames, milestones, ...petFieldsRaw } = dataToSave;
        // Ensure user_id is included for the upsert
        const petFieldsForUpsert = { 
            ...keysToSnakeCase(petFieldsRaw), 
            user_id: userId 
        };
        console.log('[DataContext] Upserting Pet fields:', petFieldsForUpsert);
        const { error: petUpsertError } = await supabase
            .from('pets')
            .upsert(petFieldsForUpsert, { onConflict: 'user_id' }); // Upsert based on user_id constraint

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
  };
  
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