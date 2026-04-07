// mobile-app/src/screens/CreateLessonScreen.tsx
// REFACTORED: Matches dashboard design system — cream/sage/forest palette.
// ALL logic / validation / store calls preserved exactly.
// "View as Client" removed per request.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { assignLesson, updateLesson } from '../services/lessonService';
import { useCoachStore } from '../stores/coachStore';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'CreateLesson'>;
type Route = RouteProp<RootStackParamList, 'CreateLesson'>;
interface Props { navigation: Nav; route: Route; }

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — exact match to DashboardScreen
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:       '#F0EBE0',
  cardCream:    '#F8F4EC',
  cardSage:     '#E2E8DF',
  cardForest:   '#2C4435',
  cardTan:      '#DDD3C0',
  cardOffWhite: '#EDE8DF',

  inkDark:      '#1C1E1A',
  inkMid:       '#484B44',
  inkMuted:     '#8A8E83',
  inkOnDark:    '#EDE9E1',

  forest:       '#2C4435',
  sage:         '#4D6B54',
  sageMid:      '#698870',
  sageLight:    'rgba(77,107,84,0.10)',
  sageBorder:   'rgba(77,107,84,0.22)',
  gold:         '#8C6E3C',
  goldLight:    'rgba(140,110,60,0.10)',

  border:       'rgba(28,30,26,0.09)',
  borderFocus:  'rgba(77,107,84,0.40)',
  shadow:       '#18201A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FIELD LABEL
// ─────────────────────────────────────────────────────────────────────────────
function FieldLabel({ text }: { text: string }) {
  return <Text style={fl.txt}>{text}</Text>;
}
const fl = StyleSheet.create({
  txt: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    color: T.inkMuted, marginBottom: 8,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CREAM INPUT — consistent with form language
// ─────────────────────────────────────────────────────────────────────────────
function CreamInput(props: React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      style={[ci.base, focused && ci.focused, props.style]}
      placeholderTextColor={T.inkMuted}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}
const ci = StyleSheet.create({
  base: {
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: T.inkDark,
    fontWeight: '400',
  },
  focused: { borderColor: T.borderFocus },
});

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR (mini, for client list)
// ─────────────────────────────────────────────────────────────────────────────
function MiniAvatar({ name }: { name: string }) {
  const hue = ((name.charCodeAt(0) ?? 65) * 41) % 360;
  return (
    <View style={{
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: `hsla(${hue},20%,82%,1)`,
      borderWidth: 1, borderColor: `hsla(${hue},20%,68%,0.5)`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: `hsl(${hue},28%,28%)` }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function CreateLessonScreen({ navigation, route }: Props) {
  const { clientId: prefillClientId, clientName: prefillClientName, lessonId } = route.params ?? {};
  const { clients, fetchClients } = useCoachStore();

  const [title,              setTitle]              = useState('');
  const [description,        setDescription]        = useState('');
  const [selectedClientId,   setSelectedClientId]   = useState(prefillClientId ?? '');
  const [selectedClientName, setSelectedClientName] = useState(prefillClientName ?? '');
  const [showClientPicker,   setShowClientPicker]   = useState(false);
  const [saving,             setSaving]             = useState(false);
  const isEditing = !!lessonId;

  useEffect(() => { fetchClients(); }, []);

  const safeClients = Array.isArray(clients) ? clients : [];

  // ── Logic preserved exactly ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please add a lesson title.');
      return;
    }
    if (!selectedClientId && !isEditing) {
      Alert.alert('Required', 'Please select a client.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await updateLesson(lessonId!, { title: title.trim(), description: description.trim() });
      } else {
        await assignLesson({
          title: title.trim(),
          description: description.trim(),
          client_id: selectedClientId,
        });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save lesson. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >

          {/* ── HEADER ──────────────────────────────────────────────── */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Text style={s.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerLabel}>{isEditing ? 'Edit Lesson' : 'New Lesson'}</Text>
              <Text style={s.headerTitle}>{isEditing ? 'Update content' : 'Assign to client'}</Text>
            </View>
            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator size="small" color={T.inkOnDark} />
                : <Text style={s.saveBtnTxt}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── CLIENT SELECTOR ─────────────────────────────────── */}
            {!isEditing && (
              <View style={s.fieldGroup}>
                <FieldLabel text="Client" />
                <TouchableOpacity
                  style={[s.selector, showClientPicker && s.selectorOpen]}
                  onPress={() => setShowClientPicker(v => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={selectedClientId ? s.selectorValue : s.selectorPlaceholder}>
                    {selectedClientId ? selectedClientName || 'Selected client' : 'Choose a client…'}
                  </Text>
                  <Text style={s.selectorChevron}>{showClientPicker ? '↑' : '↓'}</Text>
                </TouchableOpacity>

                {showClientPicker && (
                  <View style={s.clientList}>
                    {safeClients.length === 0 ? (
                      <Text style={s.noClients}>No clients yet</Text>
                    ) : (
                      safeClients.map((c: any, i: number) => {
                        const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
                        const active = c.id === selectedClientId;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[
                              s.clientRow,
                              active && s.clientRowActive,
                              i === safeClients.length - 1 && { borderBottomWidth: 0 },
                            ]}
                            onPress={() => {
                              setSelectedClientId(c.id);
                              setSelectedClientName(name);
                              setShowClientPicker(false);
                            }}
                            activeOpacity={0.78}
                          >
                            <MiniAvatar name={name || '?'} />
                            <View style={{ flex: 1 }}>
                              <Text style={s.clientName}>{name}</Text>
                              <Text style={s.clientEmail}>{c.email}</Text>
                            </View>
                            {active && <Text style={s.checkmark}>✓</Text>}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ── LESSON TITLE ────────────────────────────────────── */}
            <View style={s.fieldGroup}>
              <FieldLabel text="Lesson Title" />
              <CreamInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Blood Sugar & Meal Timing"
                maxLength={120}
                style={{ fontSize: 17, fontWeight: '500' }}
              />
            </View>

            {/* ── SESSION NOTES ───────────────────────────────────── */}
            <View style={s.fieldGroup}>
              <FieldLabel text="Session Notes / Content" />
              <CreamInput
                value={description}
                onChangeText={setDescription}
                placeholder={"Write your notes from today's session here.\n\nThis will be visible to your client on their dashboard."}
                multiline
                textAlignVertical="top"
                maxLength={3000}
                style={{ minHeight: 180, lineHeight: 22 }}
              />
              <Text style={s.charCount}>{description.length} / 3000</Text>
            </View>

            {/* ── HINT CARD ───────────────────────────────────────── */}
            <View style={s.hintCard}>
              <Text style={s.hintTitle}>How this works</Text>
              <Text style={s.hintBody}>
                Once saved, your client will see this lesson on their home screen. They can mark it viewed and completed — you'll see the status update here.
              </Text>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 12, paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: T.border,
    gap: 12,
    backgroundColor: T.pageBg,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow:   { fontSize: 17, color: T.inkMid },
  headerLabel: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    color: T.inkMuted, marginBottom: 3,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: T.inkDark, letterSpacing: -0.2 },
  saveBtn: {
    backgroundColor: T.cardForest,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 11,
  },
  saveBtnTxt: { fontSize: 14, fontWeight: '600', color: T.inkOnDark, letterSpacing: 0.2 },

  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 28 },

  fieldGroup: { marginBottom: 24 },

  // Client selector
  selector: {
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  selectorOpen:        { borderColor: T.borderFocus },
  selectorValue:       { fontSize: 15, fontWeight: '500', color: T.inkDark },
  selectorPlaceholder: { fontSize: 15, color: T.inkMuted },
  selectorChevron:     { fontSize: 13, color: T.inkMuted },

  clientList: {
    marginTop: 6,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 14, overflow: 'hidden',
  },
  clientRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: T.border,
    gap: 12,
  },
  clientRowActive: { backgroundColor: T.cardSage },
  clientName:  { fontSize: 14, fontWeight: '600', color: T.inkDark },
  clientEmail: { fontSize: 12, color: T.inkMuted, marginTop: 1 },
  checkmark:   { fontSize: 15, color: T.sage, fontWeight: '700' },
  noClients: {
    paddingVertical: 20, textAlign: 'center',
    color: T.inkMuted, fontSize: 13,
  },

  charCount: {
    textAlign: 'right', fontSize: 11,
    color: T.inkMuted, marginTop: 6,
  },

  // Hint card
  hintCard: {
    backgroundColor: T.sageLight,
    borderWidth: 1, borderColor: T.sageBorder,
    borderRadius: 14, padding: 16,
  },
  hintTitle: {
    fontSize: 12, fontWeight: '700',
    color: T.sage, marginBottom: 6, letterSpacing: 0.2,
  },
  hintBody: {
    fontSize: 13, color: T.inkMid, lineHeight: 20,
  },
});