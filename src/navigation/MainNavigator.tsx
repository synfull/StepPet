import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from '@navigation/TabNavigator';
import PetNaming from '../screens/PetNaming';
import PetHatching from '../screens/PetHatching';
import PetLevelUp from '../screens/PetLevelUp';
import AddFriend from '../screens/AddFriend';
import QRCode from '../screens/QRCode';
import Settings from '../screens/Settings';
import PetDetails from '../screens/PetDetails';
import Share from '../screens/Share';
import MilestoneUnlocked from '../screens/MilestoneUnlocked';
import AboutApp from '../screens/AboutApp';
import { RootStackParamList } from '../types/navigationTypes';

const Stack = createNativeStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' }
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="PetNaming" component={PetNaming} />
      <Stack.Screen name="PetHatching" component={PetHatching} />
      <Stack.Screen name="PetLevelUp" component={PetLevelUp} />
      <Stack.Screen name="AddFriend" component={AddFriend} />
      <Stack.Screen name="QRCode" component={QRCode} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="PetDetails" component={PetDetails} />
      <Stack.Screen name="Share" component={Share} />
      <Stack.Screen name="MilestoneUnlocked" component={MilestoneUnlocked} />
      <Stack.Screen name="AboutApp" component={AboutApp} />
    </Stack.Navigator>
  );
};

export default MainNavigator; 