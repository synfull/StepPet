import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetData, PetType, GrowthStage, MiniGames, Milestone, PetAppearance, MiniGameStatus, FetchGameStatus, AdventureStatus } from '../types/petTypes'; // Ensure all necessary subtypes are imported
// Import Supabase client (adjust path if necessary)
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Session, User } from '@supabase/supabase-js';
// Correct the import path for case conversion utils
import { Alert, AppState, Platform } from 'react-native';

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

export const DataContext = createContext<DataContextType | undefined>(undefined);

// Remove AsyncStorage key generation
// const getPetStorageKey = (userId: string) => `@pet_data_${userId}`;

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session } = useAuth(); // Assuming session is also available from useAuth
  const [petData, setPetDataState] = useState<PetData | null>(null);
  const petDataRef = useRef(petData); // Ref to hold current petData for AppState listener

  useEffect(() => { // Keep petDataRef in sync with petData state
    petDataRef.current = petData;
  }, [petData]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false); // To prevent concurrent saves
  // Ref for debounce timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); 
  const lastSuccessfulSaveTimeRef = useRef<number | null>(null); // Added missing ref declaration

  // --- Load Data from Supabase ---
  const loadDataFromSupabase = useCallback(async (userId: string) => {
    // console.log('[DataContext] loadDataFromSupabase called for user:', userId);
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
        // console.log('[DataContext] No pet found for user:', userId);
        setPetDataState(null);
        setIsLoading(false);
        return; // Exit early if no pet found
      }

      // console.log('[DataContext] Pet data fetched:', petResult);
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
      
      // currentWeekStartDate is automatically included by keysToCamelCase
      // Ensure it's handled correctly if it's null from DB
      if (!combinedPetData.currentWeekStartDate) {
          console.warn("[DataContext] currentWeekStartDate is null/undefined from DB. This might happen for older pets.");
          // Optionally, set a default based on 'created' date here if needed for robustness
          // combinedPetData.currentWeekStartDate = getStartOfWeekUTC(new Date(combinedPetData.created)).toISOString();
      }

      delete combinedPetData.equippedItems;
      // console.log('[DataContext] Removed equippedItems potentially loaded from DB');

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

      // console.log('[DataContext] Combined PetData prepared (without equippedItems from DB):', combinedPetData);
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
      // console.log('[DataContext] User detected, loading data...');
      loadDataFromSupabase(user.id);
    } else {
      // console.log('[DataContext] No user, clearing data...');
      setPetDataState(null); // Clear data if user logs out
      setIsLoading(false);
    }
  }, [user, loadDataFromSupabase]);

  // --- Define Save Logic --- 
  const saveDataToSupabase = useCallback(async (dataToSave: PetData) => {
    if (!session?.user?.id) {
      console.warn('[DataContext] saveDataToSupabase called, but no user ID available.');
      return; // Cannot save without user ID
    }
    // Check if a save is already in progress from any source (debounced or direct)
    if (isSaving) {
      // console.log('[DataContext] Save already in progress, skipping new save request.');
      return;
    }
    const userId = session.user.id;
    // console.log(`[DataContext] Attempting to save pet data for user: ${userId}, Pet ID: ${dataToSave.id}`);
    setIsSaving(true); // Indicate saving started
    try {
        // 1. Prepare Pet fields for Upsert
        // equippedItems is already excluded here
        const { miniGames, milestones, equippedItems, ...petFieldsRaw } = dataToSave;
        
        // currentWeekStartDate will be in petFieldsRaw
        const petFieldsForUpsert = { 
            ...keysToSnakeCase(petFieldsRaw), // keysToSnakeCase will convert currentWeekStartDate -> current_week_start_date
            user_id: userId 
        };
        // console.log('[DataContext] Upserting Pet fields:', petFieldsForUpsert);
        const { error: petUpsertError } = await supabase
            .from('pets')
            .upsert(petFieldsForUpsert, { onConflict: 'user_id' });

        if (petUpsertError) {
            console.error('[DataContext] Error upserting pet data:', petUpsertError);
            throw petUpsertError; // Propagate error
        }
        // console.log('[DataContext] Pet fields successfully upserted.');

        // 2. Prepare and Upsert MiniGames data
        if (miniGames) {
            // console.log('[DataContext] Preparing MiniGames upserts (Simplified)...');
            const gameTypes = Object.keys(miniGames) as Array<keyof MiniGames>;
            const upsertPromises = [];

            for (const gameType of gameTypes) {
                const gameData = miniGames[gameType];
                if (!gameData) {
                    console.warn(`[DataContext] Skipping upsert for null/undefined gameData for type: ${gameType}`);
                    continue; // Skip if gameData is null/undefined for some reason
                }
                
                const gameDataSnake = keysToSnakeCase(gameData);
                
                let rowToUpsert = {
                    pet_id: dataToSave.id, // Add foreign key
                    game_type: gameType,    // Add game type identifier
                    ...gameDataSnake       // Spread the snake_case fields
                };
                
                // console.log(`[DataContext] Upserting MiniGame row (Simplified):`, rowToUpsert);

                upsertPromises.push(
                    supabase.from('mini_games').upsert(rowToUpsert, { onConflict: 'pet_id, game_type' })
                );
            }

            const results = await Promise.allSettled(upsertPromises);
            results.forEach((result, index) => {
                const gameType = gameTypes[index];
                if (result.status === 'fulfilled') {
                    // const { data: upsertData, error: upsertError } = result.value;
                    // console.log(`[DataContext] Result for MiniGame upsert (${gameType}):`, JSON.stringify(result.value, null, 2));
                } else {
                    // Log the detailed error if the upsert failed for a specific game type
                    console.error(`[DataContext] Error upserting MiniGame (${gameType}):`, result.reason);
                }
            });
        } else {
             // console.warn('[DataContext] No miniGames data to save.');
        }

        // 3. Prepare and Upsert Milestones data
        if (milestones && milestones.length > 0) {
            // console.log('[DataContext] Preparing Milestones upserts...');
            const milestoneUpsertPromises = milestones.map(milestone => {
                const { id: milestoneIdentifier, ...milestoneData } = milestone; // original id is the string milestone_id
                const milestoneToUpsert = {
                    ...keysToSnakeCase(milestoneData),
                    pet_id: dataToSave.id, // Foreign key to pets table
                    milestone_id: milestoneIdentifier // The actual string ID like 'milestone-5k'
                };
                 // console.log(`[DataContext] Upserting Milestone row:`, milestoneToUpsert);
                return supabase.from('milestones').upsert(milestoneToUpsert, { onConflict: 'pet_id, milestone_id' });
            });
            const milestoneResults = await Promise.allSettled(milestoneUpsertPromises);
            milestoneResults.forEach((result, index) => {
                const milestoneId = milestones[index].id;
                if (result.status === 'fulfilled') {
                    // console.log(`[DataContext] Upsert successful for milestone: ${milestoneId}`);
                } else {
                    console.error(`[DataContext] Error upserting milestone ${milestoneId}:`, result.reason);
                }
            });
            // console.log('[DataContext] Finished milestone upserts.');
        } else {
            // console.log('[DataContext] No milestones in data to save.');
        }

        // console.log('[DataContext] Save completed successfully.');
        // Reset last successful save time
        lastSuccessfulSaveTimeRef.current = Date.now();
    } catch (error) {
      console.error('[DataContext] Error during save operation:', error);
    } finally {
      setIsSaving(false); // Indicate saving finished
    }
  }, [session, isSaving]); // Dependency: session and isSaving

  // --- useEffect for AppState changes --- 
  // Moved AFTER saveDataToSupabase definition
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      // console.log('[DataContext] AppState changed to:', nextAppState);
      if (
        (nextAppState === 'background' || nextAppState === 'inactive') &&
        Platform.OS !== 'web' // Do not save on web when tab loses focus
      ) {
        if (petDataRef.current) {
          // console.log('[DataContext] App moving to background/inactive, attempting immediate save.');
          // Clear any pending debounced save
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
          }
          saveDataToSupabase(petDataRef.current);
        } else {
          // console.log('[DataContext] App moving to background/inactive, but no petData to save.');
        }
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [saveDataToSupabase]); // Add saveDataToSupabase to dependency array

  // --- Define the function that updates state and triggers debounced save ---
  const setPetDataAndSave = useCallback((newData: PetData | null) => {
    // Always update the local state immediately for UI responsiveness
    setPetDataState(newData);

    // If data is null (e.g., logout), clear any pending save and don't save
    if (newData === null) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      return; 
    }

    // Clear any existing timeout to reset the debounce timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout
    saveTimeoutRef.current = setTimeout(() => {
      // console.log('[DataContext] Debounce timer expired, calling saveDataToSupabase.');
      // *** FIX: Pass the newData directly to the save function ***
      // This ensures we save the state intended when the debounce was triggered,
      // rather than relying on a potentially stale closure over `petData`.
      saveDataToSupabase(newData); 
      saveTimeoutRef.current = null; // Clear ref after execution
    }, 500); // 500ms debounce period

  }, [saveDataToSupabase]); // Dependency: saveDataToSupabase

  // --- Provide the context value --- 
  const contextValue: DataContextType = {
    petData,
    setPetData: setPetDataAndSave, // Expose the combined function
    saveDataToSupabase, // Keep original save accessible if needed directly?
    reloadData,
    isLoading,
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

// Custom hook to use the DataContext
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 