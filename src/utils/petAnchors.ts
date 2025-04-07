import { PET_TYPES } from './petUtils';

export type PetType = 'terrabun' | 'aetherfin' | 'drimkin' | 'wispurr' | 'noctuff' | 'twiggle' | 'lunacorn' | 'embermane' | 'crystallisk' | 'flareep' | 'aquabub';
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
        x: 50,
        y: 10,
        scale: 1.1,
      },
      eyes: {
        x: 50,
        y: 30,
        scale: 0.9,
      },
      neck: {
        x: 50,
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
        x: 50,  // centered
        y: 15,  // initial position for baby Noctuff's head
        scale: 1.1, // slightly larger for baby's proportions
      },
      eyes: {
        x: 50,  // centered
        y: 35,  // initial position for baby Noctuff's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 50,  // centered
        y: 50,  // initial position for baby Noctuff's neck
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
  twiggle: {
    baby: {
      head: {
        x: 50,  // centered
        y: 15,  // initial position for baby Twiggle's head
        scale: 1.1, // slightly larger for baby's proportions
      },
      eyes: {
        x: 50,  // centered
        y: 35,  // initial position for baby Twiggle's face
        scale: 0.9, // slightly smaller for baby's face
      },
      neck: {
        x: 50,  // centered
        y: 50,  // initial position for baby Twiggle's neck
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

// Fine-tune offsets for each pet type
export const PET_OFFSETS: Record<PetType, CategoryOffsets> = {
  aetherfin: {
    Hats: { x: 0, y: 0, scale: 1 },
    Eyewear: { x: 0, y: 0, scale: 1 },
    Neck: { x: 0, y: 0, scale: 1 },
  },
  wispurr: {
    Hats: { x: 0, y: 0, scale: 1 },
    Eyewear: { x: 0, y: 0, scale: 1 },
    Neck: { x: 0, y: 0, scale: 1 },
  },
  terrabun: {
    Hats: {
      x: 0,
      y: -10,
      scale: 1,
    },
    Eyewear: {
      x: 5,
      y: 0,
      scale: 1,
    },
    Neck: {
      x: 0,
      y: 5,
      scale: 1,
    },
  },
  drimkin: {
    Hats: { x: 0, y: 0, scale: 1 },
    Eyewear: { x: 0, y: 0, scale: 1 },
    Neck: { x: 0, y: 0, scale: 1 },
  },
  noctuff: {
    Hats: {
      x: 5,     // Added right offset
      y: -15,   // Increased upward offset from -5 to -15
      scale: 1,
    },
    Eyewear: {
      x: 3,     // Keeping current horizontal position
      y: 3,     // Decreased downward offset from 5 to 3
      scale: 1.4, // Keeping current scale
    },
    Neck: {
      x: 3,    // Keeping current right offset
      y: 15,   // Keeping current downward offset
      scale: 1,
    },
  },
  twiggle: {
    Hats: {
      x: 0,
      y: -25,  // Keeping current upward offset
      scale: 1,
    },
    Eyewear: {
      x: -5,    // Keeping current left offset
      y: -8,    // Increased upward offset from -5 to -8
      scale: 1.6, // Keeping current scale
    },
    Neck: {
      x: 0,
      y: 15,   // Keeping current downward offset
      scale: 1,
    },
  },
  lunacorn: {
    Hats: {
      x: 25,    // keeping same position
      y: 5,     // keeping same position
      scale: 1.2,
    },
    Eyewear: {
      x: 22,    // keeping same position
      y: 23,    // decreased downward offset from 25 to 23
      scale: 1.1,
    },
    Neck: {
      x: 23,    // keeping same position
      y: 37,    // keeping same position
      scale: 1,
    },
  },
  embermane: {
    Hats: {
      x: 25,    // keeping same position
      y: 5,     // keeping same position
      scale: 1.2,
    },
    Eyewear: {
      x: 25,    // increased right offset from 22 to 25
      y: 25,    // keeping same position
      scale: 1.1,
    },
    Neck: {
      x: 25,    // keeping same position
      y: 35,    // keeping same position
      scale: 1,
    },
  },
  crystallisk: {
    Hats: {
      x: 25,    // keeping same position
      y: 5,     // keeping same position
      scale: 0.9,
    },
    Eyewear: {
      x: 24,    // increased from 23 to 24
      y: 22,    // keeping same position
      scale: 1.3,
    },
    Neck: {
      x: 25,    // keeping same position
      y: 35,    // keeping same position
      scale: 1,
    },
  },
  flareep: {
    Hats: {
      x: 25,
      y: 0,
      scale: 1,
    },
    Eyewear: {
      x: 21,
      y: 22,
      scale: 1,
    },
    Neck: {
      x: 25,
      y: 35,
      scale: 1,
    },
  },
  aquabub: {
    Hats: {
      x: 28,
      y: 2,
      scale: 1,
    },
    Eyewear: {
      x: 28,
      y: 18,
      scale: 1,
    },
    Neck: {
      x: 28,
      y: 33,
      scale: 1,
    },
  },
}; 