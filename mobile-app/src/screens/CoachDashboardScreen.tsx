// mobile-app/src/screens/CoachDashboardScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useCoachStore } from '../stores/coachStore';
import { colors } from '../theme/colors';

type CoachDashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CoachDashboard'
>;

interface Props {
  navigation: CoachDashboardScreenNavigationProp;
}

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.1:3000';

export default function CoachDashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const { clients, isLoading, fetchClients, selectClient } =
    useCoachStore();

  const [myGroup, setMyGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchClients();
    loadMyGroup();
  }, []);

  const loadMyGroup = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return;

      const res = await fetch(`${API_BASE}/groups/coach/my-groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      const groups = data.groups ?? [];

      if (groups.length > 0) {
        setMyGroup({
          id: groups[0].id,
          name: groups[0].name,
        });
      }
    } catch (err) {
      console.log('loadMyGroup error:', err);
    }
  };

  const handleClientPress = (client: any) => {
    selectClient(client);
    navigation.navigate('ClientDetail', { clientId: client.id });
  };

  const navigateToGroupChat = () => {
    if (!myGroup) return;

    navigation.navigate('GroupChat', {
      groupId: myGroup.id,
      groupName: myGroup.name,
    });
  };

  const safeClients = Array.isArray(clients) ? clients : [];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>TLC COACH</Text>
          <Text style={styles.greeting}>
            {user?.firstName ? `Hi, ${user.firstName}` : 'Dashboard'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Conversations', undefined)}
          >
            <Text>✉</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={logout}>
            <Text>Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* QUICK ACTIONS */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CreateLesson', {})
            }
          >
            <Text>✎ New Lesson</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CoachLessons', undefined)
            }
          >
            <Text>◧ All Lessons</Text>
          </TouchableOpacity>

          {myGroup && (
            <TouchableOpacity onPress={navigateToGroupChat}>
              <Text>💬 Group Chat</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CLIENT LIST */}
        {isLoading ? (
          <ActivityIndicator />
        ) : safeClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text>📭</Text>
            <Text>No clients assigned</Text>
          </View>
        ) : (
          safeClients.map((client: any) => (
            <TouchableOpacity
              key={client.id}
              onPress={() => handleClientPress(client)}
              style={styles.clientCard}
            >
              <Text>
                {client.firstName} {client.lastName}
              </Text>
              <Text>{client.email}</Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Messaging', {
                    userId: client.id,
                    userName: `${client.firstName} ${client.lastName}`,
                  })
                }
              >
                <Text>Message</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 20 },
  subtitle: { color: colors.textMuted },
  greeting: { fontSize: 20, color: colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 10 },

  content: { padding: 20 },
  quickActionsRow: { marginBottom: 20 },

  emptyState: { alignItems: 'center', marginTop: 40 },

  clientCard: {
    padding: 16,
    marginBottom: 10,
    backgroundColor: colors.glass,
  },
});