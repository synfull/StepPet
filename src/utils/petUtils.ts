import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PetData, 
  PetType, 
  PetCategory, 
  GrowthStage, 
  Milestone 
} from '../types/petTypes';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Pedometer } from 'expo-sensors';

// Pet Categories
export const PET_CATEGORIES: Record<PetCategory, {
  name: string;
  description: string;
  pets: PetType[];
}> = {
  'mythic': {
    name: 'Mythic Beasts',
    description: 'Legendary creatures of ancient power and majesty',
    pets: ['lunacorn', 'embermane', 'aetherfin', 'crystallisk']
  },
  'elemental': {
    name: 'Elemental Critters',
    description: 'Playful beings embodying the forces of nature',
    pets: ['flareep', 'aquabub', 'terrabun', 'gustling']
  },
  'forest': {
    name: 'Forest Folk',
    description: 'Magical creatures of the woodland realm',
    pets: ['mossling', 'twiggle', 'thistuff', 'glimmowl']
  },
  'shadow': {
    name: 'Shadow Whims',
    description: 'Mysterious beings of the night and dreams',
    pets: ['wispurr', 'batbun', 'noctuff', 'drimkin']
  }
};

// Pet Icons mapping
export const PET_ICONS: Record<PetType, Record<GrowthStage, any>> = {
  // Empty string case (for egg)
  '': {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/egg.png'),
    Juvenile: require('../../assets/images/egg.png'),
    Adult: require('../../assets/images/egg.png'),
  },
  
  // Mythic Beasts
  lunacorn: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/mythic/lunacorn_baby.png'),
    Juvenile: require('../../assets/images/pets/mythic/lunacorn_juvenile.png'),
    Adult: require('../../assets/images/pets/mythic/lunacorn_adult.png'),
  },
  embermane: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/mythic/embermane_baby.png'),
    Juvenile: require('../../assets/images/pets/mythic/embermane_juvenile.png'),
    Adult: require('../../assets/images/pets/mythic/embermane_adult.png'),
  },
  aetherfin: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/mythic/aetherfin_baby.png'),
    Juvenile: require('../../assets/images/pets/mythic/aetherfin_juvenile.png'),
    Adult: require('../../assets/images/pets/mythic/aetherfin_adult.png'),
  },
  crystallisk: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/mythic/crystallisk_baby.png'),
    Juvenile: require('../../assets/images/pets/mythic/crystallisk_juvenile.png'),
    Adult: require('../../assets/images/pets/mythic/crystallisk_adult.png'),
  },
  
  // Elemental Critters
  flareep: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/elemental/flareep_baby.png'),
    Juvenile: require('../../assets/images/pets/elemental/flareep_juvenile.png'),
    Adult: require('../../assets/images/pets/elemental/flareep_adult.png'),
  },
  aquabub: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/elemental/aquabub_baby.png'),
    Juvenile: require('../../assets/images/pets/elemental/aquabub_juvenile.png'),
    Adult: require('../../assets/images/pets/elemental/aquabub_adult.png'),
  },
  terrabun: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/elemental/terrabun_baby.png'),
    Juvenile: require('../../assets/images/pets/elemental/terrabun_juvenile.png'),
    Adult: require('../../assets/images/pets/elemental/terrabun_adult.png'),
  },
  gustling: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/elemental/gustling_baby.png'),
    Juvenile: require('../../assets/images/pets/elemental/gustling_juvenile.png'),
    Adult: require('../../assets/images/pets/elemental/gustling_adult.png'),
  },
  
  // Forest Folk
  mossling: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/forest/mossling_baby.png'),
    Juvenile: require('../../assets/images/pets/forest/mossling_juvenile.png'),
    Adult: require('../../assets/images/pets/forest/mossling_adult.png'),
  },
  twiggle: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/forest/twiggle_baby.png'),
    Juvenile: require('../../assets/images/pets/forest/twiggle_juvenile.png'),
    Adult: require('../../assets/images/pets/forest/twiggle_adult.png'),
  },
  thistuff: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/forest/thistuff_baby.png'),
    Juvenile: require('../../assets/images/pets/forest/thistuff_juvenile.png'),
    Adult: require('../../assets/images/pets/forest/thistuff_adult.png'),
  },
  glimmowl: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/forest/glimmowl_baby.png'),
    Juvenile: require('../../assets/images/pets/forest/glimmowl_juvenile.png'),
    Adult: require('../../assets/images/pets/forest/glimmowl_adult.png'),
  },
  
  // Shadow Whims
  wispurr: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/shadow/wispurr_baby.png'),
    Juvenile: require('../../assets/images/pets/shadow/wispurr_juvenile.png'),
    Adult: require('../../assets/images/pets/shadow/wispurr_adult.png'),
  },
  batbun: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/shadow/batbun_baby.png'),
    Juvenile: require('../../assets/images/pets/shadow/batbun_juvenile.png'),
    Adult: require('../../assets/images/pets/shadow/batbun_adult.png'),
  },
  noctuff: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/shadow/noctuff_baby.png'),
    Juvenile: require('../../assets/images/pets/shadow/noctuff_juvenile.png'),
    Adult: require('../../assets/images/pets/shadow/noctuff_adult.png'),
  },
  drimkin: {
    Egg: require('../../assets/images/egg.png'),
    Baby: require('../../assets/images/pets/shadow/drimkin_baby.png'),
    Juvenile: require('../../assets/images/pets/shadow/drimkin_juvenile.png'),
    Adult: require('../../assets/images/pets/shadow/drimkin_adult.png'),
  },
};

// Pet Types
export const PET_TYPES: Record<PetType, {
  name: string;
  category: PetCategory;
  description: string;
  baseStats: {
    health: number;
    attack: number;
    defense: number;
    speed: number;
  };
}> = {
  // Empty string case (for egg)
  '': {
    name: 'Egg',
    category: 'mythic',
    description: 'A mysterious egg waiting to hatch',
    baseStats: { health: 0, attack: 0, defense: 0, speed: 0 }
  },
  
  // Mythic Beasts
  lunacorn: {
    name: 'Lunacorn',
    category: 'mythic',
    description: 'A celestial unicorn with a mane of stardust',
    baseStats: { health: 90, attack: 85, defense: 80, speed: 95 }
  },
  embermane: {
    name: 'Embermane',
    category: 'mythic',
    description: 'A fiery lion with a mane of living flame',
    baseStats: { health: 85, attack: 95, defense: 75, speed: 85 }
  },
  aetherfin: {
    name: 'Aetherfin',
    category: 'mythic',
    description: 'A graceful dragon that swims through the sky',
    baseStats: { health: 80, attack: 90, defense: 85, speed: 90 }
  },
  crystallisk: {
    name: 'Crystallisk',
    category: 'mythic',
    description: 'A crystalline serpent that refracts light into rainbows',
    baseStats: { health: 95, attack: 80, defense: 95, speed: 75 }
  },
  
  // Elemental Critters
  flareep: {
    name: 'Flareep',
    category: 'elemental',
    description: 'A playful sheep with wool made of fire',
    baseStats: { health: 75, attack: 85, defense: 70, speed: 80 }
  },
  aquabub: {
    name: 'Aquabub',
    category: 'elemental',
    description: 'A bubbly water spirit that loves to splash',
    baseStats: { health: 80, attack: 75, defense: 85, speed: 80 }
  },
  terrabun: {
    name: 'Terrabun',
    category: 'elemental',
    description: 'A sturdy rabbit made of living earth',
    baseStats: { health: 90, attack: 70, defense: 95, speed: 65 }
  },
  gustling: {
    name: 'Gustling',
    category: 'elemental',
    description: 'A mischievous wind sprite that loves to play',
    baseStats: { health: 70, attack: 80, defense: 65, speed: 95 }
  },
  
  // Forest Folk
  mossling: {
    name: 'Mossling',
    category: 'forest',
    description: 'A tiny creature covered in soft moss',
    baseStats: { health: 85, attack: 70, defense: 90, speed: 75 }
  },
  twiggle: {
    name: 'Twiggle',
    category: 'forest',
    description: 'A playful twig that loves to dance',
    baseStats: { health: 75, attack: 80, defense: 75, speed: 90 }
  },
  thistuff: {
    name: 'Thistuff',
    category: 'forest',
    description: 'A fluffy creature with thistle-like fur',
    baseStats: { health: 80, attack: 85, defense: 80, speed: 85 }
  },
  glimmowl: {
    name: 'Glimmowl',
    category: 'forest',
    description: 'An owl that glows with bioluminescent patterns',
    baseStats: { health: 85, attack: 90, defense: 75, speed: 80 }
  },
  
  // Shadow Whims
  wispurr: {
    name: 'Wispurr',
    category: 'shadow',
    description: 'A ghostly cat that flickers like a candle',
    baseStats: { health: 75, attack: 85, defense: 70, speed: 90 }
  },
  batbun: {
    name: 'Batbun',
    category: 'shadow',
    description: 'A bat-eared rabbit that loves the night',
    baseStats: { health: 80, attack: 80, defense: 80, speed: 80 }
  },
  noctuff: {
    name: 'Noctuff',
    category: 'shadow',
    description: 'A puffball creature that feeds on nightmares',
    baseStats: { health: 80, attack: 75, defense: 80, speed: 75 }
  },
  drimkin: {
    name: 'Drimkin',
    category: 'shadow',
    description: 'A small dragon that weaves dreams with its tail',
    baseStats: { health: 85, attack: 90, defense: 75, speed: 80 }
  }
};

// Colors for each pet type
export const PET_COLORS = {
  // Mythic Beasts
  lunacorn: { mainColor: '#FF9EDB', accentColor: '#F5F68C' },
  embermane: { mainColor: '#FF5722', accentColor: '#FFC107' },
  aetherfin: { mainColor: '#2196F3', accentColor: '#4CAF50' },
  crystallisk: { mainColor: '#9C27B0', accentColor: '#00BCD4' },
  
  // Elemental Critters
  flareep: { mainColor: '#FF5722', accentColor: '#FFC107' },
  aquabub: { mainColor: '#2196F3', accentColor: '#4CAF50' },
  terrabun: { mainColor: '#795548', accentColor: '#FFEB3B' },
  gustling: { mainColor: '#607D8B', accentColor: '#CFD8DC' },
  
  // Forest Folk
  mossling: { mainColor: '#4CAF50', accentColor: '#8BC34A' },
  twiggle: { mainColor: '#795548', accentColor: '#A1887F' },
  thistuff: { mainColor: '#9C27B0', accentColor: '#BA68C8' },
  glimmowl: { mainColor: '#FF9800', accentColor: '#FFC107' },
  
  // Shadow Whims
  wispurr: { mainColor: '#607D8B', accentColor: '#CFD8DC' },
  batbun: { mainColor: '#9E9E9E', accentColor: '#00BCD4' },
  noctuff: { mainColor: '#673AB7', accentColor: '#9C27B0' },
  drimkin: { mainColor: '#FF5722', accentColor: '#FFC107' }
};

// Revised Level Requirements
export const LEVEL_REQUIREMENTS = [
  5000,     // Level 1 to 2
  7500,     // Level 2 to 3
  10000,    // Level 3 to 4
  12500,    // Level 4 to 5
  15000,    // Level 5 to 6
  20000,    // Level 6 to 7
  25000,    // Level 7 to 8
  30000,    // Level 8 to 9
  35000,    // Level 9 to 10
  40000,    // Level 10 to 11
  45000,    // Level 11 to 12
  50000,    // Level 12 to 13
  55000,    // Level 13 to 14
  60000,    // Level 14 to 15
  65000,    // Level 15 to 16
  70000,    // Level 16 to 17
  75000,    // Level 17 to 18
  80000,    // Level 18 to 19
  85000,    // Level 19 to 20
  90000     // Level 20+
];

// Revised Milestones
export const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'milestone-5k',
    steps: 5000,
    reward: 'xp',
    rewardDetails: '+500 XP Boost',
    claimed: false
  },
  {
    id: 'milestone-15k',
    steps: 15000,
    reward: 'appearance',
    rewardDetails: 'Pet Appearance Tweak',
    claimed: false
  },
  {
    id: 'milestone-30k',
    steps: 30000,
    reward: 'nameColor',
    rewardDetails: 'Pet Name Color',
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
    id: 'milestone-75k',
    steps: 75000,
    reward: 'background',
    rewardDetails: 'Animated Background',
    claimed: false
  },
  {
    id: 'milestone-90k',
    steps: 90000,
    reward: 'badge',
    rewardDetails: 'Elite Badge',
    claimed: false
  }
];

// Available accessories for milestone rewards
export const MILESTONE_ACCESSORIES = {
  Eyewear: ['sunglasses'],
  Hats: ['top_hat'],
  Neck: ['bow_tie']
};

// Get a random accessory for milestone reward
export const getRandomMilestoneAccessory = () => {
  const categories = Object.keys(MILESTONE_ACCESSORIES) as (keyof typeof MILESTONE_ACCESSORIES)[];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const accessories = MILESTONE_ACCESSORIES[randomCategory];
  const randomAccessory = accessories[Math.floor(Math.random() * accessories.length)];
  
  return {
    category: randomCategory,
    accessory: randomAccessory
  };
};

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
  
  const petsInCategory = PET_CATEGORIES[randomCategory].pets;
  const randomPet = petsInCategory[Math.floor(Math.random() * petsInCategory.length)];
  
  return {
    type: randomPet,
    category: randomCategory
  };
};

// Create a new pet
export const createNewPet = async (currentSteps: number, type?: PetType, category?: PetCategory, name?: string): Promise<PetData> => {
  const now = new Date().toISOString();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('No user found');
  }

  // Get the current day's steps to use as the starting point
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const { steps: currentDaySteps } = await Pedometer.getStepCountAsync(todayMidnight, new Date());
  
  return {
    id: generateUUID(),
    name: name || 'Egg',
    type: type || '',
    category: category || 'mythic',
    level: 1,
    xp: 0,
    xpToNextLevel: LEVEL_REQUIREMENTS[0],
    growthStage: 'Egg' as GrowthStage,
    stepsToHatch: 5000, // Updated to match first level requirement
    stepsSinceHatched: 0,
    totalSteps: 0,
    startingStepCount: currentDaySteps, // Set the starting point to current day's steps
    appearance: {
      mainColor: '#FFFFFF',
      accentColor: '#FFFFFF',
      hasCustomization: false,
      customizationApplied: false,
      backgroundTheme: '#FFFFFF',
      hasEliteBadge: false,
      hasAnimatedBackground: false
    },
    miniGames: {
      feed: { lastClaimed: null, claimedToday: false },
      fetch: { lastClaimed: null, claimsToday: 0 },
      adventure: { 
        lastStarted: now, 
        lastCompleted: null, 
        currentProgress: 0, 
        isActive: true 
      }
    },
    milestones: [...DEFAULT_MILESTONES],
    created: now
  };
};

// Add this helper function
const getPetStorageKey = (userId: string) => `@pet_data_${userId}`;

// Save pet data
export const savePetData = async (pet: PetData): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('No user found');
    }
    const storageKey = getPetStorageKey(session.user.id);
    await AsyncStorage.setItem(storageKey, JSON.stringify(pet));
  } catch (error) {
    console.error('Error saving pet data:', error);
    throw error;
  }
};

// Load pet data
export const loadPetData = async (): Promise<PetData | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return null;
    }
    const storageKey = getPetStorageKey(session.user.id);
    const data = await AsyncStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading pet data:', error);
    return null;
  }
};

// Update growth stage based on level
const updateGrowthStage = (pet: PetData): GrowthStage => {
  if (pet.growthStage === 'Egg') return 'Egg';
  if (pet.level >= 11) return 'Adult';
  if (pet.level >= 6) return 'Juvenile';
  return 'Baby';
};

// Update pet with new steps and/or XP
export const updatePetWithSteps = async (
  pet: PetData,
  newSteps: number,
  xpReward: number = 0 // New parameter for XP rewards
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
      updatedPet.xp = 0;
      updatedPet.xpToNextLevel = LEVEL_REQUIREMENTS[0];
      updatedPet.stepsSinceHatched = updatedPet.totalSteps - updatedPet.stepsToHatch;
      leveledUp = false;
    }
  } else {
    // Pet is already hatched, add XP from both steps and rewards
    updatedPet.xp += newSteps + xpReward;
    if (newSteps > 0) {
      updatedPet.stepsSinceHatched += newSteps;
    }
    
    // Check for level up
    if (updatedPet.xp >= updatedPet.xpToNextLevel) {
      updatedPet.level += 1;
      updatedPet.xp = updatedPet.xp - updatedPet.xpToNextLevel;
      
      // Update XP to next level
      const nextLevelIndex = Math.min(updatedPet.level - 1, LEVEL_REQUIREMENTS.length - 1);
      updatedPet.xpToNextLevel = LEVEL_REQUIREMENTS[nextLevelIndex];
      
      leveledUp = true;
    }
    
    // Always update growth stage based on current level
    updatedPet.growthStage = updateGrowthStage(updatedPet);
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

const getPetCategory = (type: PetType): string => {
  for (const [category, types] of Object.entries(PET_CATEGORIES)) {
    if (types.pets.includes(type)) {
      return category;
    }
  }
  return '';
}; 