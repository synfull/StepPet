import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';
import { mockPurchaseSubscription } from '../utils/subscriptionUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SubscriptionScreenRouteProp = RouteProp<RootStackParamList, 'Subscription'>;
type SubscriptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SubscriptionScreen = () => {
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();
  const route = useRoute<SubscriptionScreenRouteProp>();
  const { tier } = route.params;

  React.useEffect(() => {
    const processPurchase = async () => {
      try {
        // In a real app, this is where you'd integrate with the App Store
        const success = await mockPurchaseSubscription(tier);
        
        if (success) {
          // Set subscription status
          await AsyncStorage.setItem('paywallActive', 'false');
          await AsyncStorage.setItem('hasSubscribed', 'true');
          
          // Check if this was part of the registration flow
          const isRegistrationFlow = await AsyncStorage.getItem('isRegistering');
          
          if (isRegistrationFlow === 'true') {
            // Clear the registration flag
            await AsyncStorage.removeItem('isRegistering');
            // Navigate to main screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          } else {
            // Regular subscription purchase, go back to previous screen
            navigation.goBack();
          }
        } else {
          // Purchase failed, keep paywall active
          await AsyncStorage.setItem('paywallActive', 'true');
          await AsyncStorage.setItem('hasSubscribed', 'false');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error processing purchase:', error);
        // On error, keep paywall active
        await AsyncStorage.setItem('paywallActive', 'true');
        await AsyncStorage.setItem('hasSubscribed', 'false');
        navigation.goBack();
      }
    };

    processPurchase();
  }, [tier, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8C52FF" />
      <Text style={styles.text}>Processing your {tier} subscription...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
}); 