import { PET_TYPES } from './petUtils';

export type PetType = 'terrabun' | 'aetherfin' | 'drimkin' | 'wispurr' | 'noctuff' | 'twiggle' | 'lunacorn' | 'embermane' | 'crystallisk' | 'flareep' | 'aquabub' | 'gustling' | 'mossling' | 'thistuff' | 'glimmowl' | 'batbun';
export type GrowthStage = 'baby' | 'juvenile' | 'adult';

export type AnchorPoint = {
  x: number;  // percentage from left of pet image (0-100)
  y: number;  // percentage from top of pet image (0-100)
  scale?: number; // optional scale factor for items at this anchor
};

export type PetAnchors = {
  head: AnchorPoint;
  eyes: AnchorPoint;
  neck: AnchorPoint;
};

export type StageAnchors = {
  [stage in GrowthStage]: PetAnchors;
};

export type PetAnchorPoints = {
  [key in PetType]?: StageAnchors;
};

// Define anchor points for each pet type and growth stage
export const PET_ANCHOR_POINTS: PetAnchorPoints = {
  aetherfin: {
    baby: {
      head: {
        x: 60,
        y: 2,
        scale: 1.2,
      },
      eyes: {
        x: 60,
        y: 27,
        scale: 0.9,
      },
      neck: {
        x: 60,
        y: 45,
        scale: 0.9,
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 18,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 35,
        scale: 0.85,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 0.95,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 20,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.9,
      },
      neck: {
        x: 50,
        y: 65,
        scale: 1,
      },
    },
  },
  wispurr: {
    baby: {
      head: {
        x: 70,  // increased from 50 to 70
        y: 10,
        scale: 1.1,
      },
      eyes: {
        x: 70,  // increased from 50 to 70
        y: 30,
        scale: 0.9,
      },
      neck: {
        x: 70,  // increased from 50 to 70
        y: 45,
        scale: 0.9,
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 15,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 35,
        scale: 0.85,
      },
      neck: {
        x: 50,
        y: 50,
        scale: 0.95,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 20,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.9,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  noctuff: {
    baby: {
      head: {
        x: 70,  // increased from 50 to 70
        y: 15,
        scale: 1.2, // increased from 1.1 to 1.2
      },
      eyes: {
        x: 70,  // increased from 50 to 70
        y: 35,
        scale: 0.9,
      },
      neck: {
        x: 70,  // increased from 50 to 70
        y: 50,
        scale: 0.9,
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  twiggle: {
    baby: {
      head: {
        x: 70,  // increased from 50 to 70
        y: 15,
        scale: 1.1,
      },
      eyes: {
        x: 70,  // increased from 50 to 70
        y: 35,
        scale: 0.9,
      },
      neck: {
        x: 70,  // increased from 50 to 70
        y: 50,
        scale: 0.9,
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  lunacorn: {
    baby: {
      head: {
        x: 50,  // centered
        y: 10,  // starting point for baby Lunacorn's head
        scale: 1.1, // slightly larger for baby's proportions
      },
      eyes: {
        x: 50,  // centered
        y: 30,  // position for baby Lunacorn's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 50,  // centered
        y: 45,  // position for baby Lunacorn's neck
        scale: 0.9, // slightly smaller for baby
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 15,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 35,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 50,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 20,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
  },
  embermane: {
    baby: {
      head: {
        x: 50,  // centered
        y: 15,  // starting point for baby Embermane's head
        scale: 1.1, // slightly larger for baby's proportions
      },
      eyes: {
        x: 50,  // centered
        y: 35,  // position for baby Embermane's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 50,  // centered
        y: 50,  // position for baby Embermane's neck
        scale: 0.9, // slightly smaller for baby
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  crystallisk: {
    baby: {
      head: {
        x: 50,  // centered
        y: 15,  // starting point for baby Crystallisk's head
        scale: 1.1, // slightly larger for baby's proportions
      },
      eyes: {
        x: 50,  // centered
        y: 35,  // position for baby Crystallisk's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 50,  // centered
        y: 50,  // position for baby Crystallisk's neck
        scale: 0.9, // slightly smaller for baby
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  flareep: {
    baby: {
      head: {
        x: 55,
        y: 15,
        scale: 1.1,
      },
      eyes: {
        x: 71,
        y: 58,
        scale: 0.9,
      },
      neck: {
        x: 75,
        y: 80,
        scale: 0.9,
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.85,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 0.95,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 0.9,
      },
      neck: {
        x: 50,
        y: 65,
        scale: 1,
      },
    },
  },
  aquabub: {
    baby: {
      head: {
        x: 68,
        y: 17,
        scale: 1.1,
      },
      eyes: {
        x: 68,
        y: 53,
        scale: 0.9,
      },
      neck: {
        x: 68,
        y: 78,
        scale: 0.9,
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  terrabun: {
    baby: {
      head: {
        x: 75,
        y: 15,
        scale: 1.2,
      },
      eyes: {
        x: 75,
        y: 35,
        scale: 0.9,
      },
      neck: {
        x: 82,
        y: 85,
        scale: 0.85,
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  gustling: {
    baby: {
      head: {
        x: 50,  // centered
        y: 15,  // initial position for baby Gustling's head
        scale: 1.2, // larger for baby's proportions
      },
      eyes: {
        x: 50,  // centered
        y: 35,  // position for baby Gustling's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 50,  // centered
        y: 50,  // position for baby Gustling's neck
        scale: 0.9, // slightly smaller for baby
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  mossling: {
    baby: {
      head: {
        x: 70,  // slightly to the right
        y: 15,  // higher up for baby's proportions
        scale: 1.2, // larger for baby's head
      },
      eyes: {
        x: 70,  // aligned with head
        y: 35,  // positioned for baby's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 70,  // aligned with head
        y: 50,  // middle position for neck
        scale: 0.9, // slightly smaller for baby
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  thistuff: {
    baby: {
      head: {
        x: 70,  // slightly to the right
        y: 15,  // higher up for baby's proportions
        scale: 1.2, // larger for baby's head
      },
      eyes: {
        x: 70,  // aligned with head
        y: 35,  // positioned for baby's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 70,  // aligned with head
        y: 50,  // middle position for neck
        scale: 0.9, // slightly smaller for baby
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  glimmowl: {
    baby: {
      head: {
        x: 70,  // slightly to the right
        y: 15,  // higher up for baby's proportions
        scale: 1.2, // larger for baby's head
      },
      eyes: {
        x: 70,  // aligned with head
        y: 35,  // positioned for baby's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 70,  // aligned with head
        y: 50,  // middle position for neck
        scale: 0.9, // slightly smaller for baby
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  batbun: {
    baby: {
      head: {
        x: 70,  // slightly to the right
        y: 15,  // higher up for baby's proportions
        scale: 1.2, // larger for baby's head
      },
      eyes: {
        x: 70,  // aligned with head
        y: 35,  // positioned for baby's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 70,  // aligned with head
        y: 50,  // middle position for neck
        scale: 0.9, // slightly smaller for baby
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
  drimkin: {
    baby: {
      head: {
        x: 70,  // slightly to the right
        y: 15,  // higher up for baby's proportions
        scale: 1.2, // larger for baby's head
      },
      eyes: {
        x: 70,  // aligned with head
        y: 35,  // positioned for baby's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 70,  // aligned with head
        y: 50,  // middle position for neck
        scale: 0.9, // slightly smaller for baby
      },
    },
    juvenile: {
      head: {
        x: 50,
        y: 20,
        scale: 1.05,
      },
      eyes: {
        x: 50,
        y: 40,
        scale: 0.95,
      },
      neck: {
        x: 50,
        y: 55,
        scale: 1,
      },
    },
    adult: {
      head: {
        x: 50,
        y: 25,
        scale: 1,
      },
      eyes: {
        x: 50,
        y: 45,
        scale: 1,
      },
      neck: {
        x: 50,
        y: 60,
        scale: 1,
      },
    },
  },
};

// Additional offsets for specific items if needed
export type ItemOffset = {
  x: number;
  y: number;
  scale?: number;
};

export type CategoryOffsets = {
  [category: string]: ItemOffset;
};

export type StageOffsets = {
  [stage in GrowthStage]: CategoryOffsets;
};

// Fine-tune offsets for each pet type and growth stage
export const PET_OFFSETS: Record<PetType, StageOffsets> = {
  aetherfin: {
    baby: {
      Hats: { x: 29, y: 8, scale: 0.6 },
      Eyewear: { x: 28, y: 22, scale: 0.7 },
      Neck: { x: 28, y: 32, scale: 0.6 },
    },
    juvenile: {
      Hats: { x: 26, y: 10, scale: 0.6 },
      Eyewear: { x: 24, y: 21, scale: 0.6 },
      Neck: { x: 25.5, y: 30, scale: 0.6 },
    },
    adult: {
      Hats: { x: 23, y: 5.9, scale: 0.4 },
      Eyewear: { x: 21, y: 15, scale: 0.4 },
      Neck: { x: 24, y: 22, scale: 0.4 },
    },
  },
  wispurr: {
    baby: {
      Hats: { x: 27, y: 2, scale: 1 },
      Eyewear: { x: 25, y: 21, scale: 1.2 },
      Neck: { x: 25, y: 35, scale: 1 },
    },
    juvenile: {
      Hats: { x: 17, y: 3, scale: 0.9 },
      Eyewear: { x: 16, y: 19, scale: 0.9 },
      Neck: { x: 20, y: 31, scale: 0.9 },
    },
    adult: {
      Hats: { x: 15, y: 3, scale: 0.75 },
      Eyewear: { x: 16, y: 16, scale: 0.75 },
      Neck: { x: 15, y: 27, scale: 0.75 },
    },
  },
  terrabun: {
    baby: {
      Hats: { x: 30, y: 6, scale: 0.9 },
      Eyewear: { x: 32, y: 23, scale: 1 },
      Neck: { x: 32, y: 35, scale: 1 },
    },
    juvenile: {
      Hats: { x: 33, y: 14, scale: 0.65 },
      Eyewear: { x: 36, y: 25, scale: 0.7 },
      Neck: { x: 36, y: 35, scale: 0.6 },
    },
    adult: {
      Hats: { x: 25, y: 16, scale: 0.6 },
      Eyewear: { x: 22.7, y: 25.5, scale: 0.6 },
      Neck: { x: 23, y: 37, scale: 0.6 },
    },
  },
  drimkin: {
    baby: {
      Hats: { x: 27, y: 9, scale: 0.8 },
      Eyewear: { x: 29, y: 25, scale: 0.9 },
      Neck: { x: 29, y: 35.5, scale: 0.8 },
    },
    juvenile: {
      Hats: { x: 16, y: 15, scale: 0.7 },
      Eyewear: { x: 13, y: 26, scale: 0.7 },
      Neck: { x: 17, y: 36, scale: 0.7 },
    },
    adult: {
      Hats: { x: 19, y: 6, scale: 0.6 },
      Eyewear: { x: 15, y: 15, scale: 0.6 },
      Neck: { x: 17, y: 25, scale: 0.6 },
    },
  },
  noctuff: {
    baby: {
      Hats: { x: 28, y: 10, scale: 0.8 },
      Eyewear: { x: 27, y: 29, scale: 1 },
      Neck: { x: 27.5, y: 40, scale: 0.9 },
    },
    juvenile: {
      Hats: { x: 29, y: 8, scale: 0.7 },
      Eyewear: { x: 27, y: 19, scale: 0.75 },
      Neck: { x: 27, y: 29, scale: 0.7 },
    },
    adult: {
      Hats: { x: 28, y: 5, scale: 0.8 },
      Eyewear: { x: 27, y: 18, scale: 0.8 },
      Neck: { x: 27, y: 28, scale: 0.8 },
    },
  },
  twiggle: {
    baby: {
      Hats: { x: 23, y: 7, scale: 1 },
      Eyewear: { x: 22, y: 25, scale: 1.2 },
      Neck: { x: 24, y: 38, scale: 1 },
    },
    juvenile: {
      Hats: { x: 21, y: 7, scale: 0.7 },
      Eyewear: { x: 17, y: 18, scale: 0.75 },
      Neck: { x: 19, y: 30, scale: 0.7 },
    },
    adult: {
      Hats: { x: 17, y: 6, scale: 0.7 },
      Eyewear: { x: 14, y: 16, scale: 0.6 },
      Neck: { x: 16.5, y: 27, scale: 0.7 },
    },
  },
  lunacorn: {
    baby: {
      Hats: { x: 25, y: 4.7, scale: 0.9 },
      Eyewear: { x: 22, y: 23, scale: 1.1 },
      Neck: { x: 23, y: 37, scale: 1 },
    },
    juvenile: {
      Hats: { x: 15, y: 0, scale: 0.7 },
      Eyewear: { x: 14, y: 17, scale: 0.7 },
      Neck: { x: 18, y: 27, scale: 0.7 },
    },
    adult: {
      Hats: { x: 20, y: 5, scale: 0.6 },
      Eyewear: { x: 20, y: 15, scale: 0.6 },
      Neck: { x: 20, y: 27, scale: 0.6 },
    },
  },
  embermane: {
    baby: {
      Hats: { x: 25, y: 5, scale: 1.2 },
      Eyewear: { x: 25, y: 25, scale: 1.1 },
      Neck: { x: 25, y: 35, scale: 1 },
    },
    juvenile: {
      Hats: { x: 25, y: 7, scale: 0.8 },
      Eyewear: { x: 22.5, y: 23, scale: 0.8 },
      Neck: { x: 23.5, y: 35, scale: 0.8 },
    },
    adult: {
      Hats: { x: 19, y: 5, scale: 0.8 },
      Eyewear: { x: 16, y: 18, scale: 0.8 },
      Neck: { x: 18, y: 37, scale: 0.8 },
    },
  },
  crystallisk: {
    baby: {
      Hats: { x: 25, y: 5, scale: 0.9 },
      Eyewear: { x: 24, y: 22, scale: 1.3 },
      Neck: { x: 25, y: 35, scale: 1 },
    },
    juvenile: {
      Hats: { x: 22, y: 8, scale: 0.8 },
      Eyewear: { x: 20, y: 21, scale: 1.2 },
      Neck: { x: 23, y: 35, scale: 0.8 },
    },
    adult: {
      Hats: { x: 20, y: 5, scale: 0.6 },
      Eyewear: { x: 17, y: 14, scale: 0.6 },
      Neck: { x: 18, y: 27, scale: 0.6 },
    },
  },
  flareep: {
    baby: {
      Hats: { x: 25, y: 0, scale: 1 },
      Eyewear: { x: 21, y: 22, scale: 1 },
      Neck: { x: 25, y: 35, scale: 1 },
    },
    juvenile: {
      Hats: { x: 23.5, y: 3, scale: 0.8 },
      Eyewear: { x: 19.5, y: 21, scale: 0.9 },
      Neck: { x: 20, y: 34, scale: 0.8 },
    },
    adult: {
      Hats: { x: 23, y: 2, scale: 0.8 },
      Eyewear: { x: 20, y: 20, scale: 0.8 },
      Neck: { x: 22, y: 33, scale: 0.8 },
    },
  },
  aquabub: {
    baby: {
      Hats: { x: 28, y: 2, scale: 1 },
      Eyewear: { x: 28, y: 18, scale: 1 },
      Neck: { x: 28, y: 33, scale: 1 },
    },
    juvenile: {
      Hats: { x: 27, y: 5, scale: 0.7 },
      Eyewear: { x: 25, y: 15, scale: 0.8 },
      Neck: { x: 25, y: 27, scale: 0.7 },
    },
    adult: {
      Hats: { x: 26, y: 3, scale: 0.6 },
      Eyewear: { x: 29, y: 11, scale: 0.5 },
      Neck: { x: 28, y: 23, scale: 0.6 },
    },
  },
  gustling: {
    baby: {
      Hats: { x: 24, y: 4, scale: 0.9 },
      Eyewear: { x: 22, y: 21, scale: 1 },
      Neck: { x: 22, y: 34, scale: 1 },
    },
    juvenile: {
      Hats: { x: 18, y: 13, scale: 0.7 },
      Eyewear: { x: 13, y: 24, scale: 0.6 },
      Neck: { x: 17, y: 34, scale: 0.6 },
    },
    adult: {
      Hats: { x: 15, y: 8, scale: 0.7 },
      Eyewear: { x: 11, y: 18, scale: 0.5 },
      Neck: { x: 14, y: 30, scale: 0.7 },
    },
  },
  mossling: {
    baby: {
      Hats: { x: 25, y: 8, scale: 1 },
      Eyewear: { x: 25, y: 27, scale: 1 },
      Neck: { x: 25, y: 38, scale: 1 },
    },
    juvenile: {
      Hats: { x: 28, y: 2, scale: 1 },
      Eyewear: { x: 25, y: 20, scale: 1 },
      Neck: { x: 26.4, y: 35.5, scale: 0.8 },
    },
    adult: {
      Hats: { x: 26, y: 7, scale: 0.6 },
      Eyewear: { x: 25, y: 17, scale: 0.6 },
      Neck: { x: 25.6, y: 28, scale: 0.6 },
    },
  },
  thistuff: {
    baby: {
      Hats: { x: 27, y: 3, scale: 1 },
      Eyewear: { x: 25, y: 28, scale: 1.3 },
      Neck: { x: 25, y: 45, scale: 1 },
    },
    juvenile: {
      Hats: { x: 22, y: 12, scale: 0.8 },
      Eyewear: { x: 17, y: 30.5, scale: 0.9 },
      Neck: { x: 18, y: 45, scale: 0.8 },
    },
    adult: {
      Hats: { x: 17, y: 13, scale: 0.7 },
      Eyewear: { x: 13, y: 23, scale: 0.7 },
      Neck: { x: 15, y: 37, scale: 0.7 },
    },
  },
  glimmowl: {
    baby: {
      Hats: { x: 29, y: 0, scale: 1 },
      Eyewear: { x: 25, y: 21, scale: 1.3 },
      Neck: { x: 25, y: 35, scale: 1 },
    },
    juvenile: {
      Hats: { x: 28, y: 5, scale: 0.9 },
      Eyewear: { x: 27.8, y: 18.5, scale: 0.85 },
      Neck: { x: 27, y: 29, scale: 0.8 },
    },
    adult: {
      Hats: { x: 29, y: 6, scale: 0.8 },
      Eyewear: { x: 29, y: 20, scale: 0.8 },
      Neck: { x: 29, y: 31, scale: 0.8 },
    },
  },
  batbun: {
    baby: {
      Hats: { x: 28.25, y: 11, scale: 0.75 },
      Eyewear: { x: 29.5, y: 25, scale: 0.9 },
      Neck: { x: 30, y: 35, scale: 0.8 },
    },
    juvenile: {
      Hats: { x: 27, y: 13, scale: 0.7 },
      Eyewear: { x: 30, y: 24.5, scale: 0.7 },
      Neck: { x: 30, y: 34, scale: 0.7 },
    },
    adult: {
      Hats: { x: 27, y: 15, scale: 0.6 },
      Eyewear: { x: 30, y: 24, scale: 0.6 },
      Neck: { x: 30, y: 32, scale: 0.6 },
    },
  },
}; 