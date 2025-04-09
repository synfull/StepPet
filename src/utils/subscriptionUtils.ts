import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SubscriptionPricing {
  [key: string]: {
    price: number;
    displayPrice: string;
    savePercent: number;
    duration: string;
  };
}

export const subscriptionPricing: SubscriptionPricing = {
  trial: {
    price: 0,
    displayPrice: 'Free',
    savePercent: 0,
    duration: '3 days'
  },
  monthly: {
    price: 7.99,
    displayPrice: '$7.99',
    savePercent: 0,
    duration: 'month'
  },
  annual: {
    price: 59.99,
    displayPrice: '$59.99',
    savePercent: 37,
    duration: 'year'
  },
  lifetime: {
    price: 129.99,
    displayPrice: '$129.99',
    savePercent: 64,
    duration: 'lifetime'
  }
};

// Mock purchase subscription function
export const mockPurchaseSubscription = async (tier: string) => {
  try {
    const now = new Date();
    
    if (tier === 'trial') {
      // Set trial expiration to 3 days from now
      const trialExpiration = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      await AsyncStorage.setItem('trialExpiration', trialExpiration.toISOString());
      await AsyncStorage.setItem('premiumStatus', 'trial');
      await AsyncStorage.setItem('subscriptionTier', 'monthly'); // Store that it will convert to monthly
      await AsyncStorage.setItem('autoConvertToMonthly', 'true'); // Flag for auto-conversion
    } else {
      // For paid tiers, set permanent premium status
      await AsyncStorage.setItem('premiumStatus', 'active');
      await AsyncStorage.setItem('subscriptionTier', tier);
      await AsyncStorage.removeItem('trialExpiration');
      await AsyncStorage.removeItem('autoConvertToMonthly');
    }
    
    return true;
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    return false;
  }
};

// Check if trial has expired and convert to monthly if needed
export const checkTrialStatus = async () => {
  try {
    const trialExpiration = await AsyncStorage.getItem('trialExpiration');
    const premiumStatus = await AsyncStorage.getItem('premiumStatus');
    const autoConvertToMonthly = await AsyncStorage.getItem('autoConvertToMonthly');
    
    if (premiumStatus === 'trial' && trialExpiration) {
      const expirationDate = new Date(trialExpiration);
      const now = new Date();
      
      if (now > expirationDate) {
        if (autoConvertToMonthly === 'true') {
          // Convert to monthly subscription
          await AsyncStorage.setItem('premiumStatus', 'active');
          await AsyncStorage.setItem('subscriptionTier', 'monthly');
          await AsyncStorage.removeItem('trialExpiration');
          await AsyncStorage.removeItem('autoConvertToMonthly');
          return true;
        } else {
          // Trial has expired without auto-conversion
          await AsyncStorage.setItem('premiumStatus', 'expired');
          return false;
        }
      }
    }
    
    return premiumStatus === 'active' || premiumStatus === 'trial';
  } catch (error) {
    console.error('Error checking trial status:', error);
    return false;
  }
}; 