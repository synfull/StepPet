import { NavigatorScreenParams } from '@react-navigation/native';
import { PetType } from './petTypes';

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Onboarding: undefined;
  PetHatching: { petType: PetType };
  PetNaming: { petType: PetType };
  PetDetails: { showSpecialAnimation?: boolean } | undefined;
  PetLevelUp: { level: number; petType: PetType };
  AddFriend: undefined;
  QRCode: undefined;
  Settings: undefined;
  MilestoneUnlocked: { milestoneId: string };
  Share: { type: 'levelUp' | 'milestone'; data: any };
  AboutApp: undefined;
};

export type TabParamList = {
  Home: undefined;
  Milestones: undefined;
  Friends: undefined;
  Challenge: undefined;
}; 