import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSameDay } from './dateUtils';

// Initialize pedometer and check if it's available
export const pedoInit = async (): Promise<boolean> => {
  const isAvailable = await Pedometer.isAvailableAsync();
  return isAvailable;
};

// Get steps for today (since midnight)
export const fetchDailySteps = async (startTime?: Date, startingStepCount: number = 0): Promise<number> => {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      console.log('Pedometer is not available');
      return 0;
    }

    const now = new Date();
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    
    // Always use today's midnight for daily steps
    const { steps } = await Pedometer.getStepCountAsync(todayMidnight, now);
    
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
export const fetchWeeklySteps = async (startDate?: Date, startingStepCount: number = 0): Promise<number> => {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      console.log('Pedometer is not available');
      return 0;
    }

    const now = new Date();
    // Use a rolling 7-day window for weekly steps
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    // If startDate (egg creation) is more recent than 7 days ago, use that instead
    const startTime = startDate && new Date(startDate) > sevenDaysAgo 
      ? new Date(startDate) 
      : sevenDaysAgo;
    
    // Get steps since the start time
    const { steps } = await Pedometer.getStepCountAsync(startTime, now);
    
    // Subtract startingStepCount ONLY if the calculation period starts today.
    let adjustedSteps = 0;
    if (isSameDay(startTime, now)) {
      // If start time is today, subtract the initial steps from that day
      adjustedSteps = Math.max(0, steps - startingStepCount);
    } else {
      // If start time was before today, use the raw steps since then
      adjustedSteps = steps;
    }
    
    // Save to storage with context
    await AsyncStorage.setItem('@weekly_steps', JSON.stringify({
      steps: adjustedSteps,
      startTime: startTime.toISOString(),
      startingStepCount
    }));
    
    return adjustedSteps;
  } catch (error) {
    console.error('Error fetching weekly steps:', error);
    
    // Try to get from storage as fallback
    try {
      const storedData = await AsyncStorage.getItem('@weekly_steps');
      if (storedData) {
        const { steps } = JSON.parse(storedData);
        return steps;
      }
      return 0;
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
export const subscribeToPedometer = (
  callback: (steps: number) => void,
  startTime?: Date,
  startingStepCount: number = 0,
  onWeeklyUpdate?: (weeklySteps: number) => void
) => {
  const now = new Date();
  const start = startTime || new Date();
  if (!startTime) {
    start.setHours(0, 0, 0, 0);
  }
  
  let subscription: { remove: () => void } | null = null;
  let lastWeeklyUpdate = 0;
  const WEEKLY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  let weeklyUpdateInterval: NodeJS.Timeout | null = null;
  
  try {
    // First get the current step count from our start time
    Pedometer.getStepCountAsync(start, now).then(({ steps }) => {
      // Subtract startingStepCount from initial steps
      const adjustedSteps = Math.max(0, steps - startingStepCount);
      callback(adjustedSteps);
      
      // Update weekly steps if callback provided
      if (onWeeklyUpdate) {
        fetchWeeklySteps(startTime, startingStepCount).then(weeklySteps => {
          onWeeklyUpdate(weeklySteps);
          lastWeeklyUpdate = Date.now();
        });
      }
    }).catch(error => {
      console.error('Error getting initial step count:', error);
    });
    
    // Set up periodic weekly updates
    if (onWeeklyUpdate) {
      weeklyUpdateInterval = setInterval(() => {
        fetchWeeklySteps(startTime, startingStepCount).then(weeklySteps => {
          onWeeklyUpdate(weeklySteps);
          lastWeeklyUpdate = Date.now();
        });
      }, WEEKLY_UPDATE_INTERVAL);
    }
    
    // Then subscribe to updates
    subscription = Pedometer.watchStepCount(result => {
      // Get current steps from start time to now
      Pedometer.getStepCountAsync(start, new Date()).then(({ steps }) => {
        // Subtract startingStepCount from updated steps
        const adjustedSteps = Math.max(0, steps - startingStepCount);
        callback(adjustedSteps);
        
        // Update weekly steps if callback provided and enough time has passed
        if (onWeeklyUpdate && Date.now() - lastWeeklyUpdate >= WEEKLY_UPDATE_INTERVAL) {
          fetchWeeklySteps(startTime, startingStepCount).then(weeklySteps => {
            onWeeklyUpdate(weeklySteps);
            lastWeeklyUpdate = Date.now();
          });
        }
      }).catch(error => {
        console.error('Error getting updated step count:', error);
      });
    });
  } catch (error) {
    console.error('Error subscribing to pedometer:', error);
  }
  
  // Return a cleanup function that clears both the pedometer subscription and interval
  return {
    remove: () => {
      if (subscription) {
        subscription.remove();
      }
      if (weeklyUpdateInterval) {
        clearInterval(weeklyUpdateInterval);
      }
    }
  };
}; 