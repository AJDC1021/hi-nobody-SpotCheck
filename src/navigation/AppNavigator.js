import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Text, View, StyleSheet } from 'react-native';
import { useBudget } from '../context/BudgetContext';

import Dashboard from '../screens/Dashboard';
import MapScreen from '../screens/MapScreen';
import LandingScreen from '../screens/LandingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ label, focused }) {
  const { theme } = useBudget();
  const icons = { Dashboard: '📊', Map: '📍' };
  
  const activeColor = theme === 'light' ? '#4F46E5' : '#818CF8';
  const inactiveColor = theme === 'light' ? '#94A3B8' : '#64748B';

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, !focused && { opacity: 0.6 }]}>
        {icons[label] || '•'}
      </Text>
      <Text style={[
        styles.tabLabel, 
        { color: focused ? activeColor : inactiveColor }
      ]}>
        {label}
      </Text>
      {focused && <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />}
    </View>
  );
}

function MainTabs() {
  const { theme } = useBudget();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          { 
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#111112',
            borderTopColor: theme === 'light' ? 'transparent' : '#2A2A2B',
            borderTopWidth: theme === 'light' ? 0 : 1,
          }
        ],
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Map" component={MapScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    height: 64,
    paddingTop: 8,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabLabelInactive: {
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#4F46E5',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
  },
});
