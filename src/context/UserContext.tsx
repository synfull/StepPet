import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, RegistrationStatus, SubscriptionStatus } from '../types/userTypes';
import { AuthContext, AuthContextType } from './AuthContext';
import { supabase } from '../lib/supabase';

interface UserContextType {
  userData: UserData | null;
  registrationStatus: RegistrationStatus;
  setUserData: (data: UserData | null) => void;
  setRegistrationStatus: (status: RegistrationStatus, caller?: string) => void;
  updateSubscriptionStatus: (status: SubscriptionStatus) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [registrationStatus, setRegistrationStatusState] = useState<RegistrationStatus>({
    isRegistered: false,
    lastCheck: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { session } = useContext(AuthContext) as AuthContextType;

  // Create wrapped setters for logging
  const setUserData = (data: UserData | null) => {
    console.log(`[UserContext] setUserData called. Data: ${!!data}`);
    setUserDataState(data);
  };
  
  const setRegistrationStatus = (status: RegistrationStatus, caller: string = 'Unknown') => {
    console.log(`[UserContext] setRegistrationStatus called from ${caller}. Status: ${JSON.stringify(status)}`);
    setRegistrationStatusState(status);
  };

  // Load user data and registration status from storage on mount
  useEffect(() => {
    console.log('[UserContext] Initial load effect running...');
    const loadData = async () => {
      setIsLoading(true); // Set loading true at the start
      try {
        if (session?.user?.id) {
            const userId = session.user.id;
            console.log(`[UserContext] Session found for user ${userId}. Loading profile and status...`);

            // --- Fetch Profile Data Directly --- 
            let profileData: any = null;
            try {
                console.log(`[UserContext] Fetching profile for user ${userId}...`);
                const { data: fetchedProfile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();
                
                if (profileError) {
                    console.error('[UserContext] Error fetching profile directly:', profileError);
                    // Handle case where profile might not exist yet (e.g., right after sign up before profile insertion completes?)
                    // Maybe clear state and return?
                    setUserDataState(null);
                    setRegistrationStatusState({ isRegistered: false, lastCheck: new Date().toISOString() });
                    setIsLoading(false);
                    return; 
                } 
                profileData = fetchedProfile;
                console.log('[UserContext] Profile fetched successfully:', profileData);
            } catch (fetchError) {
                 console.error('[UserContext] Critical error fetching profile:', fetchError);
                 setUserDataState(null);
                 setRegistrationStatusState({ isRegistered: false, lastCheck: new Date().toISOString() });
                 setIsLoading(false);
                 return;
            }
            // --- End Profile Fetch ---

            // --- Load Registration Status from Storage --- (Keep previous logic for this)
            let finalRegistrationStatus = { isRegistered: false, lastCheck: new Date().toISOString() };
            const storedRegistrationStatus = await AsyncStorage.getItem('@registration_status');
            if (storedRegistrationStatus !== null) {
                 const parsedStatus: RegistrationStatus = JSON.parse(storedRegistrationStatus);
                 // Prioritize a stored 'true' if profile exists
                 if (parsedStatus.isRegistered && profileData) { 
                     finalRegistrationStatus = parsedStatus;
                     console.log('[UserContext] Using stored TRUE registration status.');
                 } else if (profileData) {
                     // If profile exists but stored status is false, assume registered
                     finalRegistrationStatus = { isRegistered: true, lastCheck: new Date().toISOString() };
                     console.log('[UserContext] Setting registration status TRUE based on profile existence.');
                 } else {
                      console.log('[UserContext] Using stored FALSE registration status (or no profile yet).');
                      finalRegistrationStatus = parsedStatus; // Keep stored false if profile fetch failed
                 }
            } else if (profileData) {
                 // No stored status, but profile exists -> assume registered
                 finalRegistrationStatus = { isRegistered: true, lastCheck: new Date().toISOString() };
                 console.log('[UserContext] Setting registration status TRUE based on profile existence (no stored status found).');
            }
            setRegistrationStatusState(finalRegistrationStatus);
             // Save potentially updated status back
             await AsyncStorage.setItem('@registration_status', JSON.stringify(finalRegistrationStatus));
             console.log('[UserContext] Saved final registration status to storage.');
            // --- End Registration Status Logic ---

            // --- Construct and Set UserData State --- 
            if (profileData) {
                const loadedUserData: UserData = {
                    id: profileData.id,
                    username: profileData.username, // Use fetched username
                    createdAt: profileData.created_at,
                    lastActive: profileData.last_active,
                    // TODO: Fetch or default subscription status correctly
                    subscription: {
                        tier: 'free',
                        startDate: new Date().toISOString(),
                        endDate: null,
                        isActive: true,
                        autoRenew: false
                    },
                    isRegistered: finalRegistrationStatus.isRegistered // Use determined status
                };
                setUserDataState(loadedUserData);
                 console.log('[UserContext] UserData state set from fetched profile.');
                // Save fetched data to storage as the source of truth now
                 await AsyncStorage.setItem('@user_data', JSON.stringify(loadedUserData));
                 console.log('[UserContext] Saved fetched UserData to storage.');
            } else {
                // If profile fetch failed earlier, ensure userData state is null
                setUserDataState(null);
            }

        } else {
            // No session
            console.log('[UserContext] No session, clearing user data state.');
            setUserDataState(null);
            setRegistrationStatusState({ isRegistered: false, lastCheck: new Date().toISOString() });
        }
      } catch (error) {
        console.error('[UserContext] Error in initial load effect:', error);
        // Clear state on general error
        setUserDataState(null);
        setRegistrationStatusState({ isRegistered: false, lastCheck: new Date().toISOString() });
      } finally {
        console.log('[UserContext] Initial load finished.');
        setIsLoading(false);
      }
    };

    loadData();
  }, [session]); // Rerun when session changes

  const updateSubscriptionStatus = async (status: SubscriptionStatus) => {
    if (userData) {
      const updatedUserData = {
        ...userData,
        subscription: status
      };
      setUserData(updatedUserData);
    }
  };

  return (
    <UserContext.Provider 
      value={{ 
        userData,
        registrationStatus,
        setUserData,
        setRegistrationStatus,
        updateSubscriptionStatus,
        isLoading
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 