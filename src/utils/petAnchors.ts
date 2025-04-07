import { PET_TYPES } from './petUtils';

export type PetType = 'terrabun' | 'aetherfin' | 'drimkin';
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
        x: 50,  // centered
        y: 2,   // moved up from 5% to 2%
        scale: 1.2, // slightly larger for baby's proportions
      },
      eyes: {
        x: 50,  // centered
        y: 27,  // moved down from 25% to 27%
        scale: 0.9, // adjusted from 1.0 to 0.9 for better size
      },
      neck: {
        x: 50,  // centered
        y: 45,  // moved down from 35% to 45%
        scale: 0.9, // slightly smaller for baby
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
  // Add other pet types with their stages...
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
    Hats: {
      x: 7,    // increased right offset from 5 to 7
      y: -10,  // increased upward offset from -8 to -10
      scale: 0.9, // slightly smaller scale
    },
    Eyewear: {
      x: 5,    // added right offset to match hat and bowtie
      y: -1,   // reduced upward offset from -2 to -1
      scale: 1.1, // reduced from 1.2 to 1.1 for better size
    },
    Neck: {
      x: 5,    // added right offset
      y: 0,    // removed the -5 offset to keep bowtie lower
      scale: 1,
    },
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
}; 