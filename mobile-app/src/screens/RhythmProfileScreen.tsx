// mobile-app/src/screens/RhythmProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { colors } from '../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RhythmProfile'>;
};

export type CycleProfile = 'regular' | 'irregular' | 'perimenopause' | 'menopause' | 'unknown';

export const CYCLE_PROFILE_KEY = 'cycleProfile';

const PROFILES: {
  id: CycleProfile;
  emoji: string;
  label: string;
  description: string;
  detail: string;
}[] = [
  {
    id: 'regular',
    emoji: '🌿',
    label: 'Regular Cycle',
    description: 'My cycle is fairly predictable',
    detail: "Your dashboard will show rhythm content based on your tracked cycle phase — Body, Scripture, and Practice aligned to where you are in the month.",
  },
  {
    id: 'irregular',
    emoji: '🌱',
    label: 'Irregular / PCOS',
    description: 'My cycle is unpredictable or absent',
    detail: "Instead of calendar-based phases, you'll choose how you're feeling each day. The same rich rhythm content will meet you wherever you are.",
  },
  {
    id: 'perimenopause',
    emoji: '🍂',
    label: 'Perimenopause',
    description: 'My cycle is changing or becoming irregular',
    detail: "Your body is in a season of transition. You'll use a feeling-based selector to find your rhythm each day — honoring where you are, not where a calendar says you should be.",
  },
  {
    id: 'menopause',
    emoji: '🌾',
    label: 'Menopause',
    description: 'I no longer have a menstrual cycle',
    detail: "The four rhythms become seasonal anchors — available to you anytime through a simple daily check-in. Your season, your pace.",
  },
  {
    id: 'unknown',
    emoji: '🌸',
    label: 'Not Sure',
    description: "I'd rather not say or I'm figuring it out",
    detail: "No problem. You'll see a gentle feeling-based selector each day. You can update this anytime.",
  },
];

export default function RhythmProfileScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<CycleProfile>('regular');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CYCLE_PROFILE_KEY).then((val) => {
      if (val) setSelected(val as CycleProfile);
    });
  }, []);

  const handleSelect = async (id: CycleProfile) => {
    setSelected(id);
    await AsyncStorage.setItem(CYCLE_PROFILE_KEY, id);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Rhythm Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>
            This helps us show you the most relevant content for where you are in life. You can change this anytime.
          </Text>

          {PROFILES.map((profile, index) => {
            const isSelected = selected === profile.id;
            return (
              <TouchableOpacity
                key={profile.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelect(profile.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardEmoji}>{profile.emoji}</Text>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardLabel, isSelected && { color: colors.forestGreen }]}>
                      {profile.label}
                    </Text>
                    <Text style={styles.cardDescription}>{profile.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && { borderColor: colors.forestGreen }]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.cardDetail}>
                    <View style={styles.cardDetailDivider} />
                    <Text style={styles.cardDetailText}>{profile.detail}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {saved && (
            <View style={styles.savedBadge}>
              <Text style={styles.savedText}>✓ Profile saved</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  backButton: { paddingVertical: 8 },
  backText: {  fontSize: 15, fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#2B2B2B', letterSpacing: -0.2 },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  intro: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.6)',
    lineHeight: 21,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(183, 180, 183, 0.95)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 88, 15, 0.3)',
    shadowColor: '#14af4831',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderColor: colors.forestGreen,
    backgroundColor: '#105b3449',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardEmoji: { fontSize: 26, width: 36 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '600', color: '#2B2B2B', marginBottom: 2 },
  cardDescription: { fontSize: 13, color: 'rgba(42,45,42,0.5)', lineHeight: 18 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(212,214,212,0.8)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: {
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: colors.forestGreen,
  },
  cardDetail: { marginTop: 14 },
  cardDetailDivider: {
    height: 1,
    backgroundColor: 'rgba(107,127,110,0.15)',
    marginBottom: 12,
  },
  cardDetailText: {
    fontSize: 13,
    color: 'rgba(42, 45, 42, 0.95)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  savedBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(107,127,110,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  savedText: { fontSize: 13, fontWeight: '600', color: colors.forestGreen },
});