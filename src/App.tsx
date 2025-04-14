import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerForPushNotifications } from './utils/notificationUtils';
import { DataProvider } from './context/DataContext';
import { PedometerProvider } from './context/PedometerContext';
import { NotificationProvider } from './context/NotificationContext';
import { GemProvider } from './context/GemContext';
import RootNavigator from './navigation/RootNavigator';

const Stack = createNativeStackNavigator();

const App = () => {
  useEffect(() => {
    // Register for push notifications when app starts
    registerForPushNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <DataProvider>
          <PedometerProvider>
            <NotificationProvider>
              <GemProvider>
                <RootNavigator />
              </GemProvider>
            </NotificationProvider>
          </PedometerProvider>
        </DataProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App; 