// mobile-app/src/screens/LogCycleScreen.tsx
// REFACTORED: Matches dashboard design system — cream/sage/forest palette.
// ALL logic, state, API calls preserved exactly.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { cycleService } from '../services/cycle.service';
import { useCycleStore } from '../stores/cycleStore';

type FlowIntensity = 'light' | 'medium' | 'heavy';

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:     '#F0EBE0',
  cardCream:  '#F8F4EC',
  cardSage:   '#E2E8DF',
  cardForest: '#2C4435',
  cardTan:    '#DDD3C0',
  cardOffWhite:'#EDE8DF',

  inkDark:    '#1C1E1A',
  inkMid:     '#484B44',
  inkMuted:   '#8A8E83',
  inkOnDark:  '#EDE9E1',

  forest:     '#2C4435',
  sage:       '#4D6B54',
  sageMid:    '#698870',
  sageLight:  'rgba(77,107,84,0.10)',
  sageBorder: 'rgba(77,107,84,0.22)',
  gold:       '#8C6E3C',

  border:     'rgba(28,30,26,0.09)',
  shadow:     '#18201A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
function FieldLabel({ text }: { text: string }) {
  return <Text style={fl.txt}>{text}</Text>;
}
const fl = StyleSheet.create({
  txt: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.inkMuted, marginBottom: 8,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export const LogCycleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentCycle, fetchCurrentCycle } = useCycleStore();

  const [startDate,       setStartDate]       = useState(new Date());
  const [endDate,         setEndDate]         = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker,   setShowEndPicker]   = useState(false);
  const [flow,            setFlow]            = useState<FlowIntensity>('medium');
  const [isLoading,       setIsLoading]       = useState(false);
  const [isLoadingCycle,  setIsLoadingCycle]  = useState(true);

  useEffect(() => { loadCurrentCycle(); }, []);

  const loadCurrentCycle = async () => {
    setIsLoadingCycle(true);
    try { await fetchCurrentCycle(); }
    catch (error) { console.error('Error loading current cycle:', error); }
    finally { setIsLoadingCycle(false); }
  };

  // Logic preserved exactly
  const handleStartCycle = async () => {
    setIsLoading(true);
    try {
      await cycleService.logCycleStart(startDate.toISOString());
      Alert.alert('Success! 🌸', 'Cycle start logged successfully', [{
        text: 'OK',
        onPress: () => { fetchCurrentCycle(); navigation.goBack(); },
      }]);
    } catch (error: any) {
      console.error('Error logging cycle:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to log cycle start');
    } finally { setIsLoading(false); }
  };

  const handleEndCycle = async () => {
    if (!currentCycle) return;
    const cycleStart = new Date(currentCycle.cycle_start_date);
    if (endDate <= cycleStart) {
      Alert.alert('Invalid Date', 'End date must be after the start date');
      return;
    }
    setIsLoading(true);
    try {
      await cycleService.updateCycle(currentCycle.id, {
        cycleEndDate: endDate.toISOString(),
        flow,
      });
      Alert.alert('Success! ✨', 'Cycle ended successfully', [{
        text: 'OK',
        onPress: () => { fetchCurrentCycle(); navigation.goBack(); },
      }]);
    } catch (error: any) {
      console.error('Error ending cycle:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to end cycle');
    } finally { setIsLoading(false); }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });

  const getCycleDuration = () => {
    if (!currentCycle) return 0;
    const start = new Date(currentCycle.cycle_start_date);
    const diffTime = Math.abs(new Date().getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoadingCycle) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={T.sage} />
      </View>
    );
  }

  const hasActiveCycle = !!currentCycle;

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerLabel}>
              {hasActiveCycle ? 'End Cycle' : 'Log Cycle Start'}
            </Text>
            <Text style={s.headerTitle}>
              {hasActiveCycle
                ? 'Track the last day of your cycle'
                : 'Track the first day of your cycle'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >

          {hasActiveCycle ? (
            /* ── END CYCLE VIEW ─────────────────────────────────── */
            <>
              {/* Current cycle summary card */}
              <View style={s.cycleCard}>
                <View style={s.cycleCardLeft}>
                  <Text style={{ fontSize: 28 }}>🌸</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cycleCardTitle}>Current Cycle</Text>
                    <Text style={s.cycleCardDate}>
                      Started {formatDate(new Date(currentCycle.cycle_start_date))}
                    </Text>
                  </View>
                </View>
                <View style={s.cycleDurationBlock}>
                  <Text style={s.cycleDurationNum}>{getCycleDuration()}</Text>
                  <Text style={s.cycleDurationLbl}>days</Text>
                </View>
              </View>

              {/* End date picker */}
              <View style={s.fieldGroup}>
                <FieldLabel text="End Date" />
                <TouchableOpacity
                  style={s.datePicker}
                  onPress={() => setShowEndPicker(true)}
                  disabled={isLoading}
                  activeOpacity={0.82}
                >
                  <View style={s.dateIconWrap}>
                    <Text style={{ fontSize: 18 }}>📅</Text>
                  </View>
                  <Text style={s.datePickerText}>{formatDate(endDate)}</Text>
                  <Text style={s.datePickerChevron}>↓</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setShowEndPicker(false);
                      if (selectedDate) setEndDate(selectedDate);
                    }}
                    minimumDate={new Date(currentCycle.cycle_start_date)}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Flow intensity */}
              <View style={s.fieldGroup}>
                <FieldLabel text="Flow Intensity (optional)" />
                <View style={s.flowRow}>
                  {([
                    { id: 'light',  label: 'Light',  emoji: '💧'       },
                    { id: 'medium', label: 'Medium', emoji: '💧💧'     },
                    { id: 'heavy',  label: 'Heavy',  emoji: '💧💧💧'   },
                  ] as { id: FlowIntensity; label: string; emoji: string }[]).map(opt => {
                    const active = flow === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[s.flowBtn, active && s.flowBtnActive]}
                        onPress={() => setFlow(opt.id)}
                        disabled={isLoading}
                        activeOpacity={0.78}
                      >
                        <Text style={[s.flowEmoji, !active && { opacity: 0.45 }]}>
                          {opt.emoji}
                        </Text>
                        <Text style={[s.flowLabel, active && s.flowLabelActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* End cycle button */}
              <TouchableOpacity
                style={[s.primaryBtn, isLoading && { opacity: 0.55 }]}
                onPress={handleEndCycle}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading
                  ? <ActivityIndicator color={T.inkOnDark} />
                  : <Text style={s.primaryBtnTxt}>End Cycle</Text>
                }
              </TouchableOpacity>
            </>

          ) : (
            /* ── START CYCLE VIEW ───────────────────────────────── */
            <>
              {/* Start date picker */}
              <View style={s.fieldGroup}>
                <FieldLabel text="Start Date" />
                <TouchableOpacity
                  style={s.datePicker}
                  onPress={() => setShowStartPicker(true)}
                  disabled={isLoading}
                  activeOpacity={0.82}
                >
                  <View style={s.dateIconWrap}>
                    <Text style={{ fontSize: 18 }}>🌱</Text>
                  </View>
                  <Text style={s.datePickerText}>{formatDate(startDate)}</Text>
                  <Text style={s.datePickerChevron}>↓</Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setShowStartPicker(false);
                      if (selectedDate) setStartDate(selectedDate);
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Info card */}
              <View style={s.infoCard}>
                <View style={s.infoHeader}>
                  <Text style={{ fontSize: 20 }}>🌿</Text>
                  <Text style={s.infoTitle}>Cycle Tracking</Text>
                </View>
                <Text style={s.infoText}>
                  Tracking your cycle helps you understand how hormonal changes may affect your glucose levels throughout the month. Notice patterns and adjust your care accordingly.
                </Text>
              </View>

              {/* Log start button */}
              <TouchableOpacity
                style={[s.primaryBtn, isLoading && { opacity: 0.55 }]}
                onPress={handleStartCycle}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading
                  ? <ActivityIndicator color={T.inkOnDark} />
                  : <Text style={s.primaryBtnTxt}>Log Cycle Start</Text>
                }
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 12, paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.pageBg, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 17, color: T.inkMid },
  headerLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.inkMuted, marginBottom: 3,
  },
  headerTitle: {
    fontSize: 16, fontWeight: '300',
    color: T.inkDark, letterSpacing: -0.2,
  },

  content: { paddingHorizontal: 20, paddingTop: 28 },
  fieldGroup: { marginBottom: 24 },

  // Active cycle summary card
  cycleCard: {
    backgroundColor: T.cardCream,
    borderRadius: 18, borderWidth: 1.5, borderColor: T.sageBorder,
    padding: 18, marginBottom: 28,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: T.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cycleCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cycleCardTitle: { fontSize: 14, fontWeight: '600', color: T.inkDark, marginBottom: 3 },
  cycleCardDate:  { fontSize: 12, color: T.inkMuted },
  cycleDurationBlock: {
    alignItems: 'center', paddingLeft: 16,
    borderLeftWidth: 1, borderLeftColor: T.border,
  },
  cycleDurationNum: { fontSize: 30, fontWeight: '200', color: T.sage, letterSpacing: -1 },
  cycleDurationLbl: { fontSize: 10, color: T.inkMuted, fontWeight: '600' },

  // Date picker button
  datePicker: {
    backgroundColor: T.cardCream,
    borderRadius: 14, borderWidth: 1, borderColor: T.border,
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: T.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  dateIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: T.cardSage,
    alignItems: 'center', justifyContent: 'center',
  },
  datePickerText:    { flex: 1, fontSize: 15, color: T.inkDark, fontWeight: '500' },
  datePickerChevron: { fontSize: 13, color: T.inkMuted },

  // Flow selector
  flowRow: { flexDirection: 'row', gap: 10 },
  flowBtn: {
    flex: 1, backgroundColor: T.cardCream,
    borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: T.border,
  },
  flowBtnActive: {
    borderColor: T.sageBorder,
    backgroundColor: T.sageLight,
  },
  flowEmoji: { fontSize: 20 },
  flowLabel: { fontSize: 12, fontWeight: '600', color: T.inkMuted },
  flowLabelActive: { color: T.sage },

  // Info card
  infoCard: {
    backgroundColor: T.sageLight,
    borderRadius: 14, borderWidth: 1, borderColor: T.sageBorder,
    borderLeftWidth: 3, borderLeftColor: T.sage,
    padding: 16, marginBottom: 24,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoTitle:  { fontSize: 14, fontWeight: '700', color: T.forest },
  infoText:   { fontSize: 13, color: T.inkMid, lineHeight: 20 },

  // Primary action button
  primaryBtn: {
    backgroundColor: T.cardForest,
    borderRadius: 14, paddingVertical: 17,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14, shadowRadius: 10, elevation: 4,
  },
  primaryBtnTxt: { fontSize: 16, fontWeight: '600', color: T.inkOnDark, letterSpacing: 0.2 },
});

export default LogCycleScreen;