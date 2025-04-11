export type SubscriptionTier = 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  autoRenew: boolean;
}

export interface UserData {
  id: string;
  username: string;
  createdAt: string;
  lastActive: string;
  subscription: SubscriptionStatus;
  isRegistered: boolean;
}

export interface RegistrationStatus {
  isRegistered: boolean;
  lastCheck: string;
} 