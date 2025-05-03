import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import Login from '../screens/Login';
import Registration from '../screens/Registration';
import TabNavigator from '@navigation/TabNavigator';
import PetDetails from '../screens/PetDetails';
import PetNaming from '../screens/PetNaming';
import PetHatching from '../screens/PetHatching';
import PetLevelUp from '../screens/PetLevelUp';
import PaywallScreen from '../screens/PaywallScreen';
import Share from '../screens/Share';
import AboutApp from '../screens/AboutApp';
import Settings from '../screens/Settings';
import AddFriend from '../screens/AddFriend';
import QRCode from '../screens/QRCode';
import Store from '../screens/Store';
import StoreHats from '../screens/StoreHats';
import StoreNeck from '../screens/StoreNeck';
import StoreEyewear from '../screens/StoreEyewear';
import MilestoneUnlocked from '../screens/MilestoneUnlocked';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';

export type RootStackParamList = {
  Login: undefined;
  Registration: undefined;
  Main: undefined;
  Home: undefined;
  PetDetails: { petId: string; showSpecialAnimation?: boolean };
  PetNaming: undefined;
  PetHatching: { petType: string };
  PetLevelUp: { level: number; petType: string };
  Paywall: undefined;
  Share: { type: 'levelUp' | 'milestone'; data: any };
  AboutApp: undefined;
  Settings: undefined;
  AddFriend: undefined;
  QRCode: undefined;
  Store: undefined;
  StoreHats: undefined;
  StoreNeck: undefined;
  StoreEyewear: undefined;
  MilestoneUnlocked: undefined;
  Subscription: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const MainNavigator: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { registrationStatus, isLoading: userLoading } = useUser();
  
  // Log state values on each render
  console.log(`[MainNavigator] Rendering. Auth Loading: ${authLoading}, User Loading: ${userLoading}, User: ${!!user}, Reg Status: ${registrationStatus?.isRegistered}`);

  if (authLoading || userLoading) {
    console.log('[MainNavigator] Rendering Loading State (null)');
    return null; // Or a loading screen
  }

  // Determine which stack to show
  const showMainStack = user && registrationStatus.isRegistered;
  console.log(`[MainNavigator] Determined showMainStack: ${showMainStack}`);

  // Log which stack is about to be rendered
  if (showMainStack) {
    console.log('[MainNavigator] Rendering Main Stack');
  } else {
    console.log('[MainNavigator] Rendering Auth Stack');
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {showMainStack ? (
        // Protected screens
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="PetDetails" component={PetDetails} />
          <Stack.Screen name="PetNaming" component={PetNaming} />
          <Stack.Screen name="PetHatching" component={PetHatching} />
          <Stack.Screen 
            name="PetLevelUp" 
            component={PetLevelUp} 
            options={{ contentStyle: { backgroundColor: 'transparent' } }} 
          />
          <Stack.Screen name="Paywall" component={PaywallScreen} />
          <Stack.Screen name="Share" component={Share} />
          <Stack.Screen name="AboutApp" component={AboutApp} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="AddFriend" component={AddFriend} />
          <Stack.Screen name="QRCode" component={QRCode} />
          <Stack.Screen name="Store" component={Store} />
          <Stack.Screen name="StoreHats" component={StoreHats} />
          <Stack.Screen name="StoreNeck" component={StoreNeck} />
          <Stack.Screen name="StoreEyewear" component={StoreEyewear} />
          <Stack.Screen name="MilestoneUnlocked" component={MilestoneUnlocked} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        </>
      ) : (
        // Auth screens
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Registration" component={Registration} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator; 