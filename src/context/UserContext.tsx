import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, RegistrationStatus, SubscriptionStatus } from '../types/userTypes';
import { AuthContext, AuthContextType } from './AuthContext';

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
      try {
        if (session) {
            console.log('[UserContext] Session exists, proceeding with load...');
            const [storedUserData, storedRegistrationStatus] = await Promise.all([
              AsyncStorage.getItem('@user_data'),
              AsyncStorage.getItem('@registration_status')
            ]);

            if (storedUserData !== null) {
              const parsedUserData = JSON.parse(storedUserData);
              setUserData(parsedUserData);
              
              if (parsedUserData.isRegistered) {
                const currentRegStatus = registrationStatus;
                if (!currentRegStatus.isRegistered) {
                    const newRegistrationStatus = {
                      isRegistered: true,
                      lastCheck: new Date().toISOString()
                    };
                    console.log('[UserContext] Setting registration status during load because user data indicated registered');
                    setRegistrationStatus(newRegistrationStatus);
                    await AsyncStorage.setItem('@registration_status', JSON.stringify(newRegistrationStatus));
                }
              }
            }

            if (storedRegistrationStatus !== null) {
              console.log('[UserContext] Setting registration status from storage');
              setRegistrationStatus(JSON.parse(storedRegistrationStatus), 'InitialLoad');
            }
        } else {
            console.log('[UserContext] No session, skipping initial load.');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        console.log('[UserContext] Initial load finished.');
        setIsLoading(false);
      }
    };

    loadData();
  }, [session]);

  // Save user data to storage whenever it changes
  useEffect(() => {
    if (!isLoading && userData) {
      console.log('[UserContext] Saving userData to AsyncStorage');
      AsyncStorage.setItem('@user_data', JSON.stringify(userData));
    }
  }, [userData, isLoading]);

  // Save registration status to storage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      console.log(`[UserContext] Saving registrationStatus to AsyncStorage: ${JSON.stringify(registrationStatus)}`);
      AsyncStorage.setItem('@registration_status', JSON.stringify(registrationStatus));
    }
  }, [registrationStatus, isLoading]);

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