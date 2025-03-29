import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PetData, 
  PetType, 
  PetCategory, 
  GrowthStage, 
  Milestone 
} from '../types/petTypes';

// Pet categories
export const PET_CATEGORIES = {
  Fantasy: ['Dragon', 'Unicorn'],
  Animals: ['Wolf', 'Eagle'],
  Elemental: ['FireLizard', 'WaterTurtle'],
  Quirky: ['RobotDog', 'ClockworkBunny']
};

// Colors for each pet type
export const PET_COLORS = {
  Dragon: { mainColor: '#8C52FF', accentColor: '#5EFFA9' },
  Unicorn: { mainColor: '#FF9EDB', accentColor: '#F5F68C' },
  Wolf: { mainColor: '#607D8B', accentColor: '#CFD8DC' },
  Eagle: { mainColor: '#795548', accentColor: '#FFEB3B' },
  FireLizard: { mainColor: '#FF5722', accentColor: '#FFC107' },
  WaterTurtle: { mainColor: '#2196F3', accentColor: '#4CAF50' },
  RobotDog: { mainColor: '#9E9E9E', accentColor: '#00BCD4' },
  ClockworkBunny: { mainColor: '#FF9800', accentColor: '#9C27B0' }
};

// Steps required for each level
export const LEVEL_REQUIREMENTS = [
  7500,    // Level 1 to 2 (hatching egg)
  12500,   // Level 2 to 3
  17500,   // Level 3 to 4
  22500,   // Level 4 to 5
  27500,   // Level 5 to 6
  32500,   // Level 6 to 7
  37500,   // Level 7 to 8
  42500,   // Level 8 to 9
  47500,   // Level 9 to 10
  52500    // Level 10+
];

// Default milestones
export const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'milestone-5k',
    steps: 5000,
    reward: 'xp',
    rewardDetails: '+500 XP Boost',
    claimed: false
  },
  {
    id: 'milestone-10k',
    steps: 10000,
    reward: 'appearance',
    rewardDetails: 'Pet Appearance Tweak',
    claimed: false
  },
  {
    id: 'milestone-25k',
    steps: 25000,
    reward: 'background',
    rewardDetails: 'Background Theme',
    claimed: false
  },
  {
    id: 'milestone-50k',
    steps: 50000,
    reward: 'animation',
    rewardDetails: 'Special Animation',
    claimed: false
  },
  {
    id: 'milestone-100k',
    steps: 100000,
    reward: 'badge',
    rewardDetails: 'Elite Badge + Animated Background',
    claimed: false
  }
];

// Custom UUID generation function that works in React Native
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get a random pet type
export const getRandomPetType = (): { type: PetType; category: PetCategory } => {
  const categories = Object.keys(PET_CATEGORIES) as PetCategory[];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  const petsInCategory = PET_CATEGORIES[randomCategory] as PetType[];
  const randomPet = petsInCategory[Math.floor(Math.random() * petsInCategory.length)];
  
  return {
    type: randomPet,
    category: randomCategory
  };
};

// Create a new pet
export const createNewPet = (type?: PetType | '', category?: PetCategory | '', name?: string): PetData => {
  const now = new Date().toISOString();
  
  return {
    id: generateUUID(),
    name: name || 'Egg',
    type: type || '',
    category: category || '',
    level: 1,
    xp: 0,
    xpToNextLevel: LEVEL_REQUIREMENTS[0],
    growthStage: 'Egg',
    stepsToHatch: LEVEL_REQUIREMENTS[0],
    stepsSinceHatched: 0,
    totalSteps: 0,
    appearance: type ? {
      ...PET_COLORS[type as PetType],
      hasCustomization: false,
      customizationApplied: false
    } : {
      mainColor: '#8C8C8C',
      accentColor: '#E0E0E0',
      hasCustomization: false,
      customizationApplied: false
    },
    miniGames: {
      feed: {
        lastClaimed: null,
        claimedToday: false
      },
      fetch: {
        lastClaimed: null,
        claimsToday: 0
      },
      adventure: {
        lastStarted: null,
        lastCompleted: null,
        currentProgress: 0,
        isActive: false
      }
    },
    milestones: DEFAULT_MILESTONES,
    created: now
  };
};

// Save pet data
export const savePetData = async (pet: PetData): Promise<void> => {
  try {
    await AsyncStorage.setItem('@pet_data', JSON.stringify(pet));
  } catch (error) {
    console.error('Error saving pet data:', error);
    throw error;
  }
};

// Load pet data
export const loadPetData = async (): Promise<PetData | null> => {
  try {
    const petDataString = await AsyncStorage.getItem('@pet_data');
    if (petDataString) {
      return JSON.parse(petDataString);
    }
    return null;
  } catch (error) {
    console.error('Error loading pet data:', error);
    return null;
  }
};

// Update pet with new steps
export const updatePetWithSteps = async (
  pet: PetData,
  newSteps: number
): Promise<{ updatedPet: PetData; leveledUp: boolean; milestoneReached: string | null }> => {
  let leveledUp = false;
  let milestoneReached: string | null = null;
  
  // Deep clone the pet to avoid mutation
  const updatedPet: PetData = JSON.parse(JSON.stringify(pet));
  
  // Update steps
  updatedPet.totalSteps += newSteps;
  
  // Handle egg hatching
  if (updatedPet.growthStage === 'Egg') {
    if (updatedPet.totalSteps >= updatedPet.stepsToHatch) {
      updatedPet.growthStage = 'Baby';
      updatedPet.level = 2;
      updatedPet.xp = 0;
      updatedPet.xpToNextLevel = LEVEL_REQUIREMENTS[1];
      updatedPet.stepsSinceHatched = updatedPet.totalSteps - updatedPet.stepsToHatch;
      leveledUp = true;
    }
  } else {
    // Pet is already hatched, add XP and update level
    updatedPet.xp += newSteps;
    updatedPet.stepsSinceHatched += newSteps;
    
    // Check for level up
    if (updatedPet.xp >= updatedPet.xpToNextLevel) {
      updatedPet.level += 1;
      updatedPet.xp = updatedPet.xp - updatedPet.xpToNextLevel;
      
      // Update growth stage
      if (updatedPet.level === 3 && updatedPet.growthStage === 'Baby') {
        updatedPet.growthStage = 'Juvenile';
      } else if (updatedPet.level === 4 && updatedPet.growthStage === 'Juvenile') {
        updatedPet.growthStage = 'Adult';
      }
      
      // Update XP to next level
      const nextLevelIndex = Math.min(updatedPet.level - 1, LEVEL_REQUIREMENTS.length - 1);
      updatedPet.xpToNextLevel = LEVEL_REQUIREMENTS[nextLevelIndex];
      
      leveledUp = true;
    }
  }
  
  // Check for milestones
  for (const milestone of updatedPet.milestones) {
    if (!milestone.claimed && updatedPet.totalSteps >= milestone.steps) {
      milestoneReached = milestone.id;
      break;
    }
  }
  
  // Save the updated pet
  await savePetData(updatedPet);
  
  return { updatedPet, leveledUp, milestoneReached };
}; 