import { ItemCategory } from '../context/InventoryContext';

// Temporary placeholder image until we have the actual item assets
const placeholderImage = require('../../assets/images/egg.png');

// Item image mapping
export const ITEM_IMAGES: Record<ItemCategory, Record<string, any>> = {
  Hats: {
    'crown': require('../../assets/items/hats/crown.png'),
    'wizard_hat': require('../../assets/items/hats/wizard_hat.png'),
    'top_hat': require('../../assets/items/hats/top_hat.png'),
    'halo': require('../../assets/items/hats/halo.png'),
  },
  Eyewear: {
    'sunglasses': require('../../assets/items/eyewear/sunglasses.png'),
    'monocle': require('../../assets/items/eyewear/monocle.png'),
    'heart_glasses': require('../../assets/items/eyewear/heart_glasses.png'),
    'eye_patch': require('../../assets/items/eyewear/eye_patch.png'),
  },
  Neck: {
    'bow_tie': require('../../assets/items/neck/bow_tie.png'),
    'gold_chain': require('../../assets/items/neck/gold_chain.png'),
    'magic_amulet': require('../../assets/items/neck/magic_amulet.png'),
    'bandana': require('../../assets/items/neck/bandana.png'),
  },
}; 