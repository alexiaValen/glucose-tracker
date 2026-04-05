import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { assignLesson, updateLesson } from '../services/lessonService';
import { useCoachStore } from '../stores/coachStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateLesson'>;
type Route = RouteProp<RootStackParamList, 'CreateLesson'>;

interface Props {
  navigation: Nav;
  route: Route;
}

export default function CreateLessonScreen({ navigation, route }: Props) {
  const { clientId: prefillClientId, clientName: prefillClientName, lessonId } = route.params ?? {};
  const { clients, fetchClients } = useCoachStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(prefillClientId ?? '');
  const [selectedClientName, setSelectedClientName] = useState(prefillClientName ?? '');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEditing = !!lessonId;

  useEffect(() => {
    fetchClients();
  }, []);

  const safeClients = Array.isArray(clients) ? clients : [];

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
    } catch (err) {
      Alert.alert('Error', 'Failed to save lesson. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>{isEditing ? 'EDIT LESSON' : 'NEW LESSON'}</Text>
            <Text style={styles.headerTitle}>{isEditing ? 'Update content' : 'Assign to client'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.bg} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Client selector (only when creating) */}
          {!isEditing && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CLIENT</Text>
              <TouchableOpacity
                style={styles.selectorCard}
                onPress={() => setShowClientPicker((v) => !v)}
                activeOpacity={0.8}
              >
                <Text style={selectedClientId ? styles.selectorValue : styles.selectorPlaceholder}>
                  {selectedClientId ? selectedClientName || 'Selected client' : 'Choose a client...'}
                </Text>
                <Text style={styles.selectorChevron}>{showClientPicker ? '↑' : '↓'}</Text>
              </TouchableOpacity>

              {showClientPicker && (
                <View style={styles.clientList}>
                  {safeClients.length === 0 ? (
                    <Text style={styles.noClients}>No clients yet</Text>
                  ) : (
                    safeClients.map((c: any) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.clientRow,
                          c.id === selectedClientId && styles.clientRowSelected,
                        ]}
                        onPress={() => {
                          setSelectedClientId(c.id);
                          setSelectedClientName(`${c.firstName ?? ''} ${c.lastName ?? ''}`.trim());
                          setShowClientPicker(false);
                        }}
                      >
                        <View style={styles.clientRowAvatar}>
                          <Text style={styles.clientRowInitial}>
                            {(c.firstName ?? '?').charAt(0)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.clientRowName}>
                            {c.firstName} {c.lastName}
                          </Text>
                          <Text style={styles.clientRowEmail}>{c.email}</Text>
                        </View>
                        {c.id === selectedClientId && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          )}

          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>LESSON TITLE</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Blood Sugar & Meal Timing"
              placeholderTextColor={colors.textMuted}
              maxLength={120}
            />
          </View>

          {/* Description / Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>SESSION NOTES / CONTENT</Text>
            <TextInput
              style={styles.notesInput}
              value={description}
              onChangeText={setDescription}
              placeholder={
                'Write your notes from today\'s session here.\n\nThis will be visible to your client on their dashboard.'
              }
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              maxLength={3000}
            />
            <Text style={styles.charCount}>{description.length} / 3000</Text>
          </View>

          {/* Hint */}
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>How this works</Text>
            <Text style={styles.hintBody}>
              Once saved, your client will see this lesson on their home screen. They can mark it viewed and completed — you'll see the status update here.
            </Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: colors.textPrimary },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  saveBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: 0.3,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 28 },

  fieldGroup: { marginBottom: 24 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 10,
  },

  selectorCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorValue: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  selectorPlaceholder: { fontSize: 15, color: colors.textMuted },
  selectorChevron: { fontSize: 14, color: colors.textMuted },

  clientList: {
    marginTop: 8,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 14,
    overflow: 'hidden',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    gap: 12,
  },
  clientRowSelected: { backgroundColor: colors.glassSage },
  clientRowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glassSage,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientRowInitial: { fontSize: 14, fontWeight: '700', color: colors.sage },
  clientRowName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  clientRowEmail: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  checkmark: { fontSize: 16, color: colors.gold, fontWeight: '700' },
  noClients: {
    paddingVertical: 20,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
  },

  titleInput: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  notesInput: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 200,
    lineHeight: 22,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },

  hintCard: {
    backgroundColor: colors.glassSage,
    borderWidth: 1,
    borderColor: 'rgba(110,143,122,0.25)',
    borderRadius: 14,
    padding: 16,
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.sage,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  hintBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
