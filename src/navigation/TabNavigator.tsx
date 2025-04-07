import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Home from '../screens/Home';
import Milestones from '../screens/Milestones';
import Friends from '../screens/Friends';
import Challenge from '../screens/Challenge';
import Store from '../screens/Store';
import { TabParamList } from '../types/navigationTypes';

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          ...styles.tabBar,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
        },
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: '#8C52FF',
        tabBarInactiveTintColor: '#909090',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'paw' : 'paw-outline';
          } else if (route.name === 'Milestones') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Challenge') {
            iconName = focused ? 'flag' : 'flag-outline';
          } else if (route.name === 'Store') {
            iconName = focused ? 'cart' : 'cart-outline';
          }

          return (
            <View style={styles.iconContainer}>
              <Ionicons name={iconName as any} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{
          tabBarLabel: 'Pet',
        }}
      />
      <Tab.Screen 
        name="Milestones" 
        component={Milestones} 
        options={{
          tabBarLabel: 'Milestones',
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={Friends} 
        options={{
          tabBarLabel: 'Friends',
        }}
      />
      <Tab.Screen 
        name="Challenge" 
        component={Challenge} 
        options={{
          tabBarLabel: 'Challenge',
        }}
      />
      <Tab.Screen 
        name="Store" 
        component={Store} 
        options={{
          tabBarLabel: 'Store',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    paddingTop: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
  },
  iconContainer: {
    marginTop: 2,
  },
});

export default TabNavigator; 