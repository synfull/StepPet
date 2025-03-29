export type PetCategory = 'Fantasy' | 'Animals' | 'Elemental' | 'Quirky';

export type PetType = 
  | 'Dragon' 
  | 'Unicorn' 
  | 'Wolf' 
  | 'Eagle' 
  | 'FireLizard' 
  | 'WaterTurtle' 
  | 'RobotDog' 
  | 'ClockworkBunny';

export type GrowthStage = 'Egg' | 'Baby' | 'Juvenile' | 'Adult';

export interface PetAppearance {
  mainColor: string;
  accentColor: string;
  hasCustomization?: boolean;
  customizationApplied?: boolean;
}

export interface PetMiniGames {
  feed: {
    lastClaimed: string | null;
    claimedToday: boolean;
  };
  fetch: {
    lastClaimed: string[] | null;
    claimsToday: number;
  };
  adventure: {
    lastStarted: string | null;
    lastCompleted: string | null;
    currentProgress: number;
    isActive: boolean;
  };
}

export interface Milestone {
  id: string;
  steps: number;
  reward: 'xp' | 'appearance' | 'background' | 'animation' | 'badge';
  rewardDetails: string;
  claimed: boolean;
}

export interface PetData {
  id: string;
  name: string;
  type: PetType;
  category: PetCategory;
  level: number;
  xp: number;
  xpToNextLevel: number;
  growthStage: GrowthStage;
  stepsToHatch: number;
  stepsSinceHatched: number;
  totalSteps: number;
  appearance: PetAppearance;
  miniGames: PetMiniGames;
  milestones: Milestone[];
  created: string;
}

export interface Friend {
  id: string;
  username: string;
  petName: string;
  petType: PetType;
  petLevel: number;
  weeklySteps: number;
  lastActive: string;
  isCrowned?: boolean;
} 