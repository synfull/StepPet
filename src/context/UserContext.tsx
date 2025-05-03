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
                    .maybeSingle();
                
                if (profileError) {
                    // Log error but don't necessarily fail the whole load if profile just doesn't exist yet
                    console.error('[UserContext] Error fetching profile directly:', profileError);
                    // Let profileData remain null
                }
                
                // If profile was fetched successfully, assign it
                if (fetchedProfile) {
                    profileData = fetchedProfile;
                    console.log('[UserContext] Profile fetched successfully:', profileData);
                } else {
                     console.log('[UserContext] Profile fetch returned null (may be temporary after signup).');
                     // Profile doesn't exist yet, profileData remains null
                }
            } catch (fetchError) {
                 console.error('[UserContext] Critical error fetching profile:', fetchError);
                 // Let profileData remain null
            }
            // --- End Profile Fetch ---

            // --- Load Registration Status from Storage --- 
            let finalRegistrationStatus = { isRegistered: false, lastCheck: new Date().toISOString() };
            const storedRegistrationStatus = await AsyncStorage.getItem('@registration_status');
            if (storedRegistrationStatus !== null) {
                 const parsedStatus: RegistrationStatus = JSON.parse(storedRegistrationStatus);
                 // If storage says true, trust it.
                 if (parsedStatus.isRegistered) { 
                     finalRegistrationStatus = parsedStatus;
                     console.log('[UserContext] Using stored TRUE registration status.');
                 } else {
                      // Storage says false.
                      // If profile *was* fetched, override stored false status -> user is registered.
                      if (profileData) {
                          finalRegistrationStatus = { isRegistered: true, lastCheck: new Date().toISOString() };
                          console.log('[UserContext] Setting registration status TRUE based on profile existence (overriding stored false).');
                      } else {
                          // Storage is false, profile not found -> stick with stored false for now.
                          finalRegistrationStatus = parsedStatus;
                          console.log('[UserContext] Using stored FALSE registration status (profile not found).');
                      }
                 }
            } else if (profileData) {
                 // No stored status, but profile exists -> user is registered
                 finalRegistrationStatus = { isRegistered: true, lastCheck: new Date().toISOString() };
                 console.log('[UserContext] Setting registration status TRUE based on profile existence (no stored status found).');
            } else {
                 // No stored status and no profile found -> user is not registered
                  console.log('[UserContext] No stored registration status and no profile found.');
                  // finalRegistrationStatus remains default false
            }
            setRegistrationStatusState(finalRegistrationStatus);
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
                // Profile data is null (either fetch error or didn't exist yet)
                // Ensure userData state reflects this. We might not have username yet.
                // If registration status is true (likely set by Registration.tsx), 
                // create a minimal UserData object.
                 if (finalRegistrationStatus.isRegistered) {
                     console.warn('[UserContext] Profile data missing, but registration status is true. Creating minimal UserData.');
                     const minimalUserData: UserData = {
                        id: userId,
                        username: '...', // Placeholder
                        createdAt: new Date().toISOString(), // Placeholder
                        lastActive: new Date().toISOString(),
                        subscription: { // Provide default subscription object
                            tier: 'free',
                            startDate: new Date().toISOString(),
                            endDate: null,
                            isActive: true,
                            autoRenew: false
                         },
                        isRegistered: true
                     };
                     setUserDataState(minimalUserData);
                     // Save this minimal data? Or wait for next load?
                     // Let's avoid saving this minimal data for now.
                     // await AsyncStorage.setItem('@user_data', JSON.stringify(minimalUserData));
                 } else {
                     setUserDataState(null);
                 }
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