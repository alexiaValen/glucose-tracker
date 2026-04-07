// mobile-app/src/navigation/TabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import DashboardScreen from '../screens/DashboardScreen';
import RhythmScreen from '../screens/RhythmScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import MeScreen from '../screens/MeScreen';

export type TabParamList = {
  Home: undefined;
  Rhythm: undefined;
  Coach: undefined;
  Me: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator();

const ICON_SIZE = 22;
const STROKE = 1.6;

//
// ─────────────────────────────────────────────────────────────
// 🧠 HOME STACK (WRAPS DASHBOARD)
// ─────────────────────────────────────────────────────────────
//

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

//
// ─────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────
//

function HomeIcon({ focused }: { focused: boolean }) {
  const color = focused ? 'rgba(154,189,158,0.95)' : 'rgba(240,237,230,0.28)';
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        fill={focused ? 'rgba(154,189,158,0.12)' : 'none'}
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth={STROKE}
      />
    </Svg>
  );
}

function RhythmIcon({ focused }: { focused: boolean }) {
  const color = focused ? 'rgba(154,189,158,0.95)' : 'rgba(240,237,230,0.28)';
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12 C5 12 5 6 8 6 S11 18 14 18 S17 12 20 12"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CoachIcon({ focused }: { focused: boolean }) {
  const color = focused ? 'rgba(154,189,158,0.95)' : 'rgba(240,237,230,0.28)';
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
        stroke={color}
        strokeWidth={STROKE}
      />
    </Svg>
  );
}

function MeIcon({ focused }: { focused: boolean }) {
  const color = focused ? 'rgba(154,189,158,0.95)' : 'rgba(240,237,230,0.28)';
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={STROKE} />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={color}
        strokeWidth={STROKE}
      />
    </Svg>
  );
}

//
// ─────────────────────────────────────────────────────────────
// TAB ITEM
// ─────────────────────────────────────────────────────────────
//

function TabItem({
  icon,
  label,
  focused,
}: {
  icon: React.ReactNode;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={styles.tabItem}>
      {icon}
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

//
// ─────────────────────────────────────────────────────────────
// MAIN TAB NAVIGATOR
// ─────────────────────────────────────────────────────────────
//

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {/* 🔥 HOME — TAB BAR HIDDEN */}
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarStyle: { display: 'none' }, // 👈 KEY LINE
          tabBarIcon: ({ focused }) => (
            <TabItem icon={<HomeIcon focused={focused} />} label="Home" focused={focused} />
          ),
        }}
      />

      {/* NORMAL TABS */}
      <Tab.Screen
        name="Rhythm"
        component={RhythmScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon={<RhythmIcon focused={focused} />} label="Rhythm" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Coach"
        component={ConversationsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon={<CoachIcon focused={focused} />} label="Coach" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Me"
        component={MeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon={<MeIcon focused={focused} />} label="Me" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

//
// ─────────────────────────────────────────────────────────────
// STYLES (UNCHANGED)
// ─────────────────────────────────────────────────────────────
//

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(11,24,16,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    height: Platform.OS === 'ios' ? 82 : 62,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 60,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(240,237,230,0.28)',
    letterSpacing: 0.4,
  },
  tabLabelFocused: {
    color: 'rgba(154,189,158,0.90)',
    fontWeight: '700',
  },
});