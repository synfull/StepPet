import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerForPushNotifications } from './utils/notificationUtils';
import { preloadOnboardingImages, preloadLogo } from './utils/imagePreloader';
import { DataProvider } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import { GemProvider } from './context/GemContext';
import AppNavigator from './navigation/AppNavigator';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';

const Stack = createNativeStackNavigator();

const App = () => {
  useEffect(() => {
    registerForPushNotifications();
    preloadOnboardingImages();
    preloadLogo();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <UserProvider>
          <AuthProvider>
        <DataProvider>
            <NotificationProvider>
              <GemProvider>
                  <AppNavigator />
              </GemProvider>
            </NotificationProvider>
        </DataProvider>
          </AuthProvider>
        </UserProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App; 