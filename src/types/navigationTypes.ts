import { NavigatorScreenParams } from '@react-navigation/native';
import { PetType } from './petTypes';

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  PetNaming: { petType: PetType };
  PetHatching: undefined;
  PetLevelUp: { level: number; petType: PetType };
  AddFriend: undefined;
  QRCode: undefined;
  Settings: undefined;
  PetDetails: undefined;
  Share: { type: 'levelUp' | 'milestone'; data: any };
  MilestoneUnlocked: { milestoneId: string };
  AboutApp: undefined;
};

export type TabParamList = {
  Home: undefined;
  Milestones: undefined;
  Friends: undefined;
}; 