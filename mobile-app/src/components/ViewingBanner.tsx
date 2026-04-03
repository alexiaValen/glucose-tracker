// mobile-app/src/components/ViewingBanner.tsx
// Shown at the top of every tab screen when coach is previewing a client
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCoachStore } from '../stores/coachStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

export function ViewingBanner() {
  const { viewingClientId, viewingClientName, clearViewingClient } = useCoachStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!viewingClientId) return null;

  const handleExit = () => {
    clearViewingClient();
    navigation.navigate('CoachDashboard');
  };

  return (
    <View style={styles.banner}>
      <View style={styles.left}>
        <View style={styles.dot} />
        <Text style={styles.text}>
          Viewing as{' '}
          <Text style={styles.name}>{viewingClientName}</Text>
        </Text>
      </View>
      <TouchableOpacity onPress={handleExit} style={styles.exitButton} activeOpacity={0.75}>
        <Text style={styles.exitText}>Exit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3D5540',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  text: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },
  name: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  exitButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  exitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});