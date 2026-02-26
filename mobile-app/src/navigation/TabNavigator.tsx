// mobile-app/src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

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

const ICON_SIZE = 22;
const STROKE = 1.6;

// Home — simple house outline
function HomeIcon({ focused }: { focused: boolean }) {
  const color = focused ? colors.forestGreen : 'rgba(42,45,42,0.35)';
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        fill={focused ? 'rgba(107,127,110,0.12)' : 'none'}
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Rhythm — wave / sine curve suggesting natural cycles
function RhythmIcon({ focused }: { focused: boolean }) {
  const color = focused ? colors.forestGreen : 'rgba(42,45,42,0.35)';
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12 C5 12 5 6 8 6 S11 18 14 18 S17 12 20 12 S22 12 22 12"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Coach — speech bubble outline
function CoachIcon({ focused }: { focused: boolean }) {
  const color = focused ? colors.forestGreen : 'rgba(42,45,42,0.35)';
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        fill={focused ? 'rgba(107,127,110,0.12)' : 'none'}
      />
    </Svg>
  );
}

// Me — person silhouette outline
function MeIcon({ focused }: { focused: boolean }) {
  const color = focused ? colors.forestGreen : 'rgba(42,45,42,0.35)';
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="8"
        r="4"
        stroke={color}
        strokeWidth={STROKE}
        fill={focused ? 'rgba(107,127,110,0.12)' : 'none'}
      />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}

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
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon={<HomeIcon focused={focused} />} label="Home" focused={focused} />
          ),
        }}
      />
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,214,212,0.3)',
    height: Platform.OS === 'ios' ? 82 : 62,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
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
    color: 'rgba(42,45,42,0.35)',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: colors.forestGreen,
    fontWeight: '700',
  },
});