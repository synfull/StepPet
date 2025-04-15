import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize pedometer and check if it's available
export const pedoInit = async (): Promise<boolean> => {
  const isAvailable = await Pedometer.isAvailableAsync();
  return isAvailable;
};

// Get steps for today (since midnight or custom start time)
export const fetchDailySteps = async (startTime?: Date): Promise<number> => {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      console.log('Pedometer is not available');
      return 0;
    }

    const now = new Date();
    const start = startTime || new Date();
    if (!startTime) {
      start.setHours(0, 0, 0, 0);
    }
    
    const { steps } = await Pedometer.getStepCountAsync(start, now);
    
    // Save to storage
    await AsyncStorage.setItem('@daily_steps', steps.toString());
    
    return steps;
  } catch (error) {
    console.error('Error fetching daily steps:', error);
    
    // Try to get from storage as fallback
    try {
      const storedSteps = await AsyncStorage.getItem('@daily_steps');
      return storedSteps ? parseInt(storedSteps, 10) : 0;
    } catch (storageError) {
      console.error('Error reading stored steps:', storageError);
      return 0;
    }
  }
};

// Get steps for this week (last 7 days)
export const fetchWeeklySteps = async (startDate?: Date): Promise<number> => {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      console.log('Pedometer is not available');
      return 0;
    }

    const now = new Date();
    // If startDate is provided, use it as the start point
    // Otherwise, use 7 days ago
    const startOfWeek = startDate || new Date();
    if (!startDate) {
      startOfWeek.setDate(now.getDate() - 7);
    }
    startOfWeek.setHours(0, 0, 0, 0);
    
    const { steps } = await Pedometer.getStepCountAsync(startOfWeek, now);
    
    // Save to storage
    await AsyncStorage.setItem('@weekly_steps', steps.toString());
    
    return steps;
  } catch (error) {
    console.error('Error fetching weekly steps:', error);
    
    // Try to get from storage as fallback
    try {
      const storedSteps = await AsyncStorage.getItem('@weekly_steps');
      return storedSteps ? parseInt(storedSteps, 10) : 0;
    } catch (storageError) {
      console.error('Error reading stored weekly steps:', storageError);
      return 0;
    }
  }
};

// Update total steps
export const updateTotalSteps = async (newSteps: number): Promise<number> => {
  try {
    const currentTotalStr = await AsyncStorage.getItem('@total_steps');
    const currentTotal = currentTotalStr ? parseInt(currentTotalStr, 10) : 0;
    
    const updatedTotal = currentTotal + newSteps;
    await AsyncStorage.setItem('@total_steps', updatedTotal.toString());
    
    return updatedTotal;
  } catch (error) {
    console.error('Error updating total steps:', error);
    return 0;
  }
};

// Subscribe to pedometer updates
export const subscribeToPedometer = (callback: (steps: number) => void, startTime?: Date) => {
  const now = new Date();
  const start = startTime || new Date();
  if (!startTime) {
    start.setHours(0, 0, 0, 0);
  }
  
  let subscription: { remove: () => void } | null = null;
  
  try {
    // First get the current step count from our start time
    Pedometer.getStepCountAsync(start, now).then(({ steps }) => {
      callback(steps); // Call immediately with initial steps
    }).catch(error => {
      console.error('Error getting initial step count:', error);
    });
    
    // Then subscribe to updates
    subscription = Pedometer.watchStepCount(result => {
      // Get current steps from start time to now
      Pedometer.getStepCountAsync(start, new Date()).then(({ steps }) => {
        callback(steps);
      }).catch(error => {
        console.error('Error getting updated step count:', error);
      });
    });
  } catch (error) {
    console.error('Error subscribing to pedometer:', error);
  }
  
  return subscription;
}; 