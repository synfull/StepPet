import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, RegistrationStatus, SubscriptionStatus } from '../types/userTypes';

interface UserContextType {
  userData: UserData | null;
  registrationStatus: RegistrationStatus;
  setUserData: (data: UserData | null) => void;
  setRegistrationStatus: (status: RegistrationStatus) => void;
  updateSubscriptionStatus: (status: SubscriptionStatus) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>({
    isRegistered: false,
    lastCheck: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user data and registration status from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedUserData, storedRegistrationStatus] = await Promise.all([
          AsyncStorage.getItem('@user_data'),
          AsyncStorage.getItem('@registration_status')
        ]);

        if (storedUserData !== null) {
          setUserData(JSON.parse(storedUserData));
        }

        if (storedRegistrationStatus !== null) {
          setRegistrationStatus(JSON.parse(storedRegistrationStatus));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save user data to storage whenever it changes
  useEffect(() => {
    if (!isLoading && userData) {
      AsyncStorage.setItem('@user_data', JSON.stringify(userData));
    }
  }, [userData, isLoading]);

  // Save registration status to storage whenever it changes
  useEffect(() => {
    if (!isLoading) {
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