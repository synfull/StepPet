import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PetData, 
  PetType, 
  PetCategory, 
  GrowthStage, 
  Milestone 
} from '../types/petTypes';

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
export const PET_ICONS: Record<PetType, any> = {
  // Empty string case (for egg)
  '': require('../../assets/images/pets/icons/default_icon.png'),
  
  // Mythic Beasts
  lunacorn: require('../../assets/images/pets/icons/lunacorn_icon.png'),
  embermane: require('../../assets/images/pets/icons/embermane_icon.png'),
  aetherfin: require('../../assets/images/pets/icons/aetherfin_icon.png'),
  crystallisk: require('../../assets/images/pets/icons/crystallisk_icon.png'),
  
  // Elemental Critters
  flareep: require('../../assets/images/pets/icons/flareep_icon.png'),
  aquabub: require('../../assets/images/pets/icons/aquabub_icon.png'),
  terrabun: require('../../assets/images/pets/icons/terrabun_icon.png'),
  gustling: require('../../assets/images/pets/icons/gustling_icon.png'),
  
  // Forest Folk
  mossling: require('../../assets/images/pets/icons/mossling_icon.png'),
  twiggle: require('../../assets/images/pets/icons/twiggle_icon.png'),
  thistuff: require('../../assets/images/pets/icons/thistuff_icon.png'),
  glimmowl: require('../../assets/images/pets/icons/glimmowl_icon.png'),
  
  // Shadow Whims
  wispurr: require('../../assets/images/pets/icons/wispurr_icon.png'),
  batbun: require('../../assets/images/pets/icons/batbun_icon.png'),
  noctuff: require('../../assets/images/pets/icons/noctuff_icon.png'),
  drimkin: require('../../assets/images/pets/icons/drimkin_icon.png'),
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

// ORIGINAL VALUES (DO NOT DELETE)
// export const LEVEL_REQUIREMENTS = [
//    7500,    // Level 1 to 2 (hatching egg)
//    12500,   // Level 2 to 3
//    17500,   // Level 3 to 4
//    22500,   // Level 4 to 5
//    27500,   // Level 5 to 6
//    32500,   // Level 6 to 7
//    37500,   // Level 7 to 8
//    42500,   // Level 8 to 9
//    47500,   // Level 9 to 10
//    52500    // Level 10+
// ];

// TEST VALUES
export const LEVEL_REQUIREMENTS = [
  25,      // Level 1 to 2 (hatching egg)
  200,     // Level 2 to 3
  300,     // Level 3 to 4
  400,     // Level 4 to 5
  500,     // Level 5 to 6
  600,     // Level 6 to 7
  700,     // Level 7 to 8
  800,     // Level 8 to 9
  900,     // Level 9 to 10
  1000     // Level 10+
];

// ORIGINAL VALUES (DO NOT DELETE)
// export const DEFAULT_MILESTONES: Milestone[] = [
//   {
//     id: 'milestone-5k',
//     steps: 5000,
//     reward: 'xp',
//     rewardDetails: '+500 XP Boost',
//     claimed: false
//   },
//   {
//     id: 'milestone-10k',
//     steps: 10000,
//     reward: 'appearance',
//     rewardDetails: 'Pet Appearance Tweak',
//     claimed: false
//   },
//   {
//     id: 'milestone-25k',
//     steps: 25000,
//     reward: 'background',
//     rewardDetails: 'Background Theme',
//     claimed: false
//   },
//   {
//     id: 'milestone-50k',
//     steps: 50000,
//     reward: 'animation',
//     rewardDetails: 'Special Animation',
//     claimed: false
//   },
//   {
//     id: 'milestone-100k',
//     steps: 100000,
//     reward: 'badge',
//     rewardDetails: 'Elite Badge + Animated Background',
//     claimed: false
//   }
// ];

// TEST VALUES
export const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'milestone-50',
    steps: 50,
    reward: 'xp',
    rewardDetails: '+500 XP Boost',
    claimed: false
  },
  {
    id: 'milestone-100',
    steps: 100,
    reward: 'appearance',
    rewardDetails: 'Pet Appearance Tweak',
    claimed: false
  },
  {
    id: 'milestone-150',
    steps: 150,
    reward: 'background',
    rewardDetails: 'Background Theme',
    claimed: false
  },
  {
    id: 'milestone-200',
    steps: 200,
    reward: 'animation',
    rewardDetails: 'Special Animation',
    claimed: false
  },
  {
    id: 'milestone-250',
    steps: 250,
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
  
  return {
    id: generateUUID(),
    name: name || 'Egg',
    type: type || '',
    category: category || 'mythic',
    level: 1,
    xp: 0,
    xpToNextLevel: LEVEL_REQUIREMENTS[0],
    growthStage: 'Egg' as GrowthStage,
    stepsToHatch: 100,
    stepsSinceHatched: 0,
    totalSteps: currentSteps,
    startingStepCount: currentSteps,
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
      adventure: { lastStarted: null, lastCompleted: null, currentProgress: 0, isActive: false }
    },
    milestones: [...DEFAULT_MILESTONES],
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
      updatedPet.xp = 0;
      updatedPet.xpToNextLevel = LEVEL_REQUIREMENTS[0];
      updatedPet.stepsSinceHatched = updatedPet.totalSteps - updatedPet.stepsToHatch;
      leveledUp = false;
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

const getPetCategory = (type: PetType): string => {
  for (const [category, types] of Object.entries(PET_CATEGORIES)) {
    if (types.pets.includes(type)) {
      return category;
    }
  }
  return '';
}; 