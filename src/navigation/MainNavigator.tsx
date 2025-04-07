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
import Store from '../screens/Store';
import StoreHats from '../screens/StoreHats';
import StoreNeck from '../screens/StoreNeck';
import StoreEyewear from '../screens/StoreEyewear';
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
        animation: 'fade',
        presentation: 'card',
        contentStyle: { backgroundColor: '#FFFFFF' }
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={TabNavigator}
        options={{
          animation: 'none'
        }}
      />
      <Stack.Screen 
        name="PetNaming" 
        component={PetNaming}
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="PetHatching" 
        component={PetHatching}
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="PetLevelUp" 
        component={PetLevelUp}
        options={{
          presentation: 'transparentModal',
          animation: 'fade'
        }}
      />
      <Stack.Screen 
        name="AddFriend" 
        component={AddFriend}
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="QRCode" 
        component={QRCode}
        options={{
          presentation: 'transparentModal',
          animation: 'fade'
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={Settings}
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="PetDetails" 
        component={PetDetails}
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="Share" 
        component={Share}
        options={{
          presentation: 'transparentModal',
          animation: 'fade'
        }}
      />
      <Stack.Screen 
        name="Store" 
        component={Store}
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="StoreHats" 
        component={StoreHats}
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="StoreNeck" 
        component={StoreNeck}
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="StoreEyewear" 
        component={StoreEyewear}
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="MilestoneUnlocked" 
        component={MilestoneUnlocked}
        options={{
          presentation: 'transparentModal',
          animation: 'fade'
        }}
      />
      <Stack.Screen 
        name="AboutApp" 
        component={AboutApp}
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator; 