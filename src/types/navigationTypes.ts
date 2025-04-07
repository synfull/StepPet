import { NavigatorScreenParams } from '@react-navigation/native';
import { PetType, Milestone } from './petTypes';

export type RootStackParamList = {
  Main: undefined;
  Home: undefined;
  PetDetails: { petId: string; showSpecialAnimation?: boolean };
  PetHatching: { petType: PetType };
  PetNaming: { petType: PetType };
  PetSelection: undefined;
  PetLevelUp: { level: number; petType: PetType };
  MilestoneUnlocked: { milestone: Milestone };
  Milestones: undefined;
  Friends: undefined;
  AddFriend: undefined;
  Challenge: undefined;
  Share: undefined;
  QRCode: undefined;
  Settings: undefined;
  AboutApp: undefined;
  Onboarding: undefined;
  Store: undefined;
  StoreHats: undefined;
  StoreEyewear: undefined;
  StoreNeck: undefined;
};

export type TabParamList = {
  Home: undefined;
  Milestones: undefined;
  Friends: undefined;
  Challenge: undefined;
  Store: undefined;
}; 