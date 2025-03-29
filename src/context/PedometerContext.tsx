import { createContext } from 'react';

type PedometerContextType = {
  isAvailable: boolean;
  currentSteps: number;
  dailySteps: number;
  weeklySteps: number;
  totalSteps: number;
  setCurrentSteps: (steps: number) => void;
  setDailySteps: (steps: number) => void;
  setWeeklySteps: (steps: number) => void;
  setTotalSteps: (steps: number) => void;
};

export const PedometerContext = createContext<PedometerContextType>({
  isAvailable: false,
  currentSteps: 0,
  dailySteps: 0,
  weeklySteps: 0,
  totalSteps: 0,
  setCurrentSteps: () => {},
  setDailySteps: () => {},
  setWeeklySteps: () => {},
  setTotalSteps: () => {},
}); 