import { NavigatorScreenParams } from '@react-navigation/native';
import { PetType, Milestone } from './petTypes';

export type RootStackParamList = {
  Main: undefined;
  Home: undefined;
  Store: { initialTab?: 'gems' | 'hats' | 'neck' | 'eyewear' };
  StoreHats: undefined;
  StoreNeck: undefined;
  StoreEyewear: undefined;
  PetNaming: { petType: PetType };
  PetHatching: { petType: PetType };
  PetLevelUp: { level: number; petType: PetType };
  AddFriend: undefined;
  QRCode: undefined;
  Settings: undefined;
  PetDetails: { petId: string; showSpecialAnimation?: boolean };
  Share: undefined;
  MilestoneUnlocked: { milestone: Milestone };
  AboutApp: undefined;
  PetSelection: undefined;
  Milestones: undefined;
  Friends: undefined;
  Challenge: undefined;
  Inventory: undefined;
};

export type TabParamList = {
  Home: undefined;
  Milestones: undefined;
  Friends: undefined;
  Challenge: undefined;
  Store: undefined;
  Inventory: undefined;
}; 