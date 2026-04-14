// mobile-app/src/screens/LogCycleScreen.tsx
// REDESIGN: Event-based daily check-in replaces rigid start/end cycle form.
// Users log "bleeding today" — the system infers starts, ends, and phases.
// All existing API calls (startCycle, endCycle) preserved; triggered by inference actions.

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCycleStore, inferCycleStatus } from '../stores/cycleStore';
import { BleedingStatus, SYMPTOM_OPTIONS, CycleEvent } from '../types/cycle';

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — matches LoginScreen / SettingsScreen palette
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:      '#F7F5F2',
  cardBg:      '#FFFFFF',
  cardBorder:  '#E5E2DB',
  divider:     '#EDEAE5',

  inkDark:     '#1A1814',
  inkMid:      '#4A4640',
  inkMuted:    '#9B9690',

  forest:      '#2B4535',
  gold:        '#A8916A',

  bleedNone:   { bg: '#F3F0EB', border: '#E5E2DB', text: '#9B9690' },
  bleedSpot:   { bg: '#FDF5F0', border: '#E8C9BE', text: '#8B5E52' },
  bleedLight:  { bg: '#FDF0EE', border: '#E8B8B2', text: '#8B4A44' },
  bleedMed:    { bg: '#F9E8E6', border: '#D9928C', text: '#7A3530' },
  bleedHeavy:  { bg: '#F5DEDD', border: '#C97870', text: '#6B2A26' },

  inferForest:       'rgba(43,69,53,0.07)',
  inferForestBorder: 'rgba(43,69,53,0.18)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function toDateKey(d: Date) { return d.toISOString().slice(0, 10); }

function formatDisplayDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthYear(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return toDateKey(a) === toDateKey(b);
}

// ─────────────────────────────────────────────────────────────────────────────
// BLEEDING OPTION CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const BLEEDING_OPTIONS: {
  id: BleedingStatus;
  label: string;
  glyph: string;
  colors: { bg: string; border: string; text: string };
}[] = [
  { id: 'none',     label: 'None',     glyph: '○', colors: T.bleedNone  },
  { id: 'spotting', label: 'Spotting', glyph: '·', colors: T.bleedSpot  },
  { id: 'light',    label: 'Light',    glyph: '◔', colors: T.bleedLight },
  { id: 'medium',   label: 'Medium',   glyph: '◑', colors: T.bleedMed  },
  { id: 'heavy',    label: 'Heavy',    glyph: '●', colors: T.bleedHeavy },
];

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <Text style={sl.txt}>{text}</Text>;
}
const sl = StyleSheet.create({
  txt: {
    fontSize: 10, fontWeight: '600', letterSpacing: 1.1,
    textTransform: 'uppercase', color: T.inkMuted, marginBottom: 12,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MINI CALENDAR
// ─────────────────────────────────────────────────────────────────────────────
function MiniCalendar({
  month, today, selectedDate, events, cycleStartDate, cycleEndDate,
  onDayPress, onPrevMonth, onNextMonth,
}: {
  month: Date;
  today: Date;
  selectedDate: Date;
  events: Record<string, any>;
  cycleStartDate?: string;
  cycleEndDate?: string;
  onDayPress: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const year  = month.getFullYear();
  const mon   = month.getMonth();
  const todayKey = toDateKey(today);
  const isCurrentMonth =
    mon === today.getMonth() && year === today.getFullYear();

  // Build flat cell array
  const cells: (Date | null)[] = [];
  const firstDow    = getFirstDayOfWeek(year, mon);
  const daysInMonth = getDaysInMonth(year, mon);
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, mon, d));
  while (cells.length % 7 !== 0) cells.push(null);

  // Split into rows of 7
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View style={cal.wrap}>
      {/* Month header */}
      <View style={cal.header}>
        <TouchableOpacity onPress={onPrevMonth} style={cal.navBtn} activeOpacity={0.7}>
          <Text style={cal.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={cal.monthTxt}>{formatMonthYear(month)}</Text>
        <TouchableOpacity
          onPress={onNextMonth}
          style={cal.navBtn}
          activeOpacity={isCurrentMonth ? 1 : 0.7}
          disabled={isCurrentMonth}
        >
          <Text style={[cal.navArrow, isCurrentMonth && cal.navDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week names */}
      <View style={cal.dayNamesRow}>
        {DAY_NAMES.map((d, i) => (
          <Text key={i} style={cal.dayName}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={cal.row}>
          {row.map((date, cellIdx) => {
            if (!date) return <View key={cellIdx} style={cal.cell} />;

            const key       = toDateKey(date);
            const isToday   = key === todayKey;
            const isSelected = isSameDay(date, selectedDate);
            const hasLog    = !!events[key];
            const isFuture  = date > today;
            const inCycle   = !!(
              cycleStartDate &&
              key >= cycleStartDate &&
              (!cycleEndDate || key <= cycleEndDate)
            );

            return (
              <TouchableOpacity
                key={cellIdx}
                style={[
                  cal.cell,
                  inCycle && !isFuture && cal.inCycleCell,
                  isToday && !isSelected && cal.todayCell,
                  isSelected && cal.selectedCell,
                ]}
                onPress={() => { if (!isFuture) onDayPress(date); }}
                activeOpacity={isFuture ? 1 : 0.7}
              >
                <Text style={[
                  cal.dayNum,
                  isFuture && cal.futureTxt,
                  inCycle && !isFuture && cal.inCycleTxt,
                  isToday && !isSelected && cal.todayNum,
                  isSelected && cal.selectedNum,
                ]}>
                  {date.getDate()}
                </Text>
                {hasLog && <View style={[cal.dot, isSelected && cal.dotOnSelected]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const cal = StyleSheet.create({
  wrap: {
    backgroundColor: T.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 14,
    marginBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  navBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: T.pageBg,
    alignItems: 'center', justifyContent: 'center',
  },
  navArrow:   { fontSize: 22, color: T.inkMid, lineHeight: 26 },
  navDisabled: { opacity: 0.25 },
  monthTxt:   { fontSize: 14, fontWeight: '600', color: T.inkDark, letterSpacing: -0.1 },

  dayNamesRow: { flexDirection: 'row', marginBottom: 2 },
  dayName: {
    flex: 1, textAlign: 'center',
    fontSize: 10, fontWeight: '600',
    color: T.inkMuted, letterSpacing: 0.4,
    paddingBottom: 6,
  },

  row:  { flexDirection: 'row' },
  cell: {
    flex: 1, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  inCycleCell:  { backgroundColor: 'rgba(43,69,53,0.07)' },
  todayCell:    { borderWidth: 1.5, borderColor: T.forest },
  selectedCell: { backgroundColor: T.forest },

  dayNum:      { fontSize: 13, color: T.inkMid, fontWeight: '400' },
  futureTxt:   { color: T.inkMuted, opacity: 0.35 },
  inCycleTxt:  { color: T.forest, fontWeight: '500' },
  todayNum:    { color: T.forest, fontWeight: '700' },
  selectedNum: { color: '#F0EDE8', fontWeight: '600' },

  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: T.forest,
    marginTop: 1,
  },
  dotOnSelected: { backgroundColor: 'rgba(240,237,232,0.7)' },
});

// ─────────────────────────────────────────────────────────────────────────────
// INFERENCE CARD
// ─────────────────────────────────────────────────────────────────────────────
function InferenceCard({
  headline, body, confirmLabel, dismissLabel,
  onConfirm, onDismiss, isLoading,
}: {
  headline: string;
  body: string;
  confirmLabel?: string;
  dismissLabel?: string;
  onConfirm?: () => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}) {
  if (!confirmLabel && !dismissLabel) return null;
  return (
    <View style={ic.card}>
      <View style={ic.dot} />
      <View style={ic.body}>
        <Text style={ic.headline}>{headline}</Text>
        <Text style={ic.bodyTxt}>{body}</Text>
        <View style={ic.actions}>
          {confirmLabel && onConfirm && (
            <TouchableOpacity
              style={ic.confirmBtn}
              onPress={onConfirm}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color={T.cardBg} size="small" />
                : <Text style={ic.confirmTxt}>{confirmLabel}</Text>
              }
            </TouchableOpacity>
          )}
          {dismissLabel && onDismiss && (
            <TouchableOpacity style={ic.dismissBtn} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={ic.dismissTxt}>{dismissLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
const ic = StyleSheet.create({
  card: {
    backgroundColor: T.inferForest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.inferForestBorder,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: T.forest,
    marginTop: 5, flexShrink: 0,
  },
  body:       { flex: 1, gap: 6 },
  headline:   { fontSize: 14, fontWeight: '600', color: T.forest, letterSpacing: -0.1 },
  bodyTxt:    { fontSize: 13, color: T.inkMid, lineHeight: 20 },
  actions:    { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  confirmBtn: {
    backgroundColor: T.forest,
    borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 9,
    minWidth: 80, alignItems: 'center',
  },
  confirmTxt:  { fontSize: 13, fontWeight: '500', color: '#F0EDE8' },
  dismissBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.inferForestBorder,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  dismissTxt: { fontSize: 13, fontWeight: '400', color: T.inkMid },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export const LogCycleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    currentCycle, events,
    fetchCurrentCycle, loadEvents,
    startCycle, endCycle, saveEvent,
  } = useCycleStore();

  const today = new Date();

  // ── Calendar & date selection ───────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calMonth,     setCalMonth]     = useState<Date>(today);

  const dateKey    = toDateKey(selectedDate);
  const isToday    = isSameDay(selectedDate, today);
  const existingLog = events[dateKey];

  // ── Form state ─────────────────────────────────────────────────────────────
  const [bleeding,       setBleeding]      = useState<BleedingStatus>(existingLog?.bleeding ?? 'none');
  const [symptoms,       setSymptoms]      = useState<string[]>(existingLog?.symptoms ?? []);
  const [notes,          setNotes]         = useState(existingLog?.notes ?? '');
  const [symptomsOpen,   setSymptomsOpen]  = useState(false);
  const [showNotes,      setShowNotes]     = useState(false);
  const [isLoading,      setIsLoading]     = useState(false);
  const [isFetching,     setIsFetching]    = useState(true);
  const [showDatePicker, setShowDatePicker]= useState(false);
  const [overrideDate,   setOverrideDate]  = useState<Date>(today);
  const [saved,          setSaved]         = useState(false);

  useEffect(() => {
    Promise.all([fetchCurrentCycle(), loadEvents()])
      .finally(() => setIsFetching(false));
  }, []);

  // Sync form when selected date changes
  useEffect(() => {
    const log = events[dateKey];
    if (log) {
      setBleeding(log.bleeding);
      setSymptoms(log.symptoms ?? []);
      setNotes(log.notes ?? '');
    } else {
      setBleeding('none');
      setSymptoms([]);
      setNotes('');
    }
    setSaved(false);
    setSymptomsOpen(false);
    setShowNotes(false);
  }, [dateKey]);

  // ── Inference (always relative to today) ──────────────────────────────────
  const inference = useMemo(
    () => inferCycleStatus(currentCycle, events, bleeding, today),
    [currentCycle, events, bleeding],
  );

  // ── Symptom toggle ─────────────────────────────────────────────────────────
  const toggleSymptom = (sym: string) =>
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym],
    );

  // ── Calendar navigation ────────────────────────────────────────────────────
  const goToPrevMonth = () =>
    setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setCalMonth((m) => {
      const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      // Don't navigate past current month
      if (next > today) return m;
      return next;
    });

  // ── Save log ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const event: CycleEvent = {
      date: dateKey,
      bleeding,
      symptoms,
      notes: notes.trim() || undefined,
      cycleId: currentCycle?.id,
    };
    setIsLoading(true);
    try {
      await saveEvent(event);
      setSaved(true);
      setTimeout(() => { setSaved(false); navigation.goBack(); }, 900);
    } catch {
      Alert.alert('Error', 'Could not save your log. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Inference actions ──────────────────────────────────────────────────────
  const handleConfirmNewCycle = async () => {
    setIsLoading(true);
    try {
      await startCycle(overrideDate.toISOString());
      await saveEvent({
        date: dateKey, bleeding, symptoms,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not start cycle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEndCycle = async () => {
    if (!currentCycle) return;
    setIsLoading(true);
    try {
      await endCycle(currentCycle.id, today.toISOString());
      await saveEvent({
        date: dateKey, bleeding, symptoms,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not end cycle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInferenceConfirm = () => {
    if (inference.status === 'new_cycle')    return handleConfirmNewCycle();
    if (inference.status === 'likely_ended') return handleConfirmEndCycle();
    if (inference.status === 'possible_end') return handleConfirmEndCycle();
  };

  const handleInferenceDismiss = () => { handleSave(); };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={T.forest} />
      </View>
    );
  }

  const showInferenceCard =
    isToday &&
    (inference.status === 'new_cycle'    ||
     inference.status === 'likely_ended' ||
     inference.status === 'possible_end' ||
     inference.status === 'gap') &&
    (inference.confirmLabel || inference.dismissLabel);

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.65}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={s.headerTitle}>
              {isToday ? 'Log Today' : formatDisplayDate(selectedDate)}
            </Text>
            {isToday && (
              <Text style={s.headerDate}>{formatDisplayDate(today)}</Text>
            )}
          </View>
          {existingLog && (
            <View style={s.loggedBadge}>
              <Text style={s.loggedBadgeTxt}>Logged</Text>
            </View>
          )}
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── CALENDAR ────────────────────────────────────────────── */}
          <MiniCalendar
            month={calMonth}
            today={today}
            selectedDate={selectedDate}
            events={events}
            cycleStartDate={currentCycle?.cycle_start_date}
            cycleEndDate={currentCycle?.cycle_end_date}
            onDayPress={setSelectedDate}
            onPrevMonth={goToPrevMonth}
            onNextMonth={goToNextMonth}
          />

          {/* ── CURRENT CYCLE STATUS ────────────────────────────────── */}
          {currentCycle && (
            <View style={s.statusCard}>
              <View style={s.statusLeft}>
                <Text style={s.statusDay}>Day {inference.dayNumber ?? currentCycle.current_day}</Text>
                <Text style={s.statusPhase}>
                  {currentCycle.phase
                    ? currentCycle.phase.charAt(0).toUpperCase() + currentCycle.phase.slice(1) + ' phase'
                    : 'Cycle ongoing'}
                </Text>
              </View>
              <View style={s.statusRight}>
                <Text style={s.statusSince}>since</Text>
                <Text style={s.statusDate}>{formatShort(currentCycle.cycle_start_date)}</Text>
              </View>
            </View>
          )}

          {/* ── BLEEDING ────────────────────────────────────────────── */}
          <View style={s.section}>
            <SectionLabel text="How's your flow?" />
            <View style={s.bleedGrid}>
              {BLEEDING_OPTIONS.map((opt) => {
                const active = bleeding === opt.id;
                const c = opt.colors;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      s.bleedBtn,
                      { backgroundColor: active ? c.bg : T.cardBg, borderColor: active ? c.border : T.cardBorder },
                    ]}
                    onPress={() => setBleeding(opt.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.bleedGlyph, { color: active ? c.text : T.inkMuted }]}>
                      {opt.glyph}
                    </Text>
                    <Text style={[s.bleedLabel, { color: active ? c.text : T.inkMuted }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── SYMPTOMS ────────────────────────────────────────────── */}
          <View style={s.section}>
            <SectionLabel text="Symptoms" />

            {/* Selected symptoms — one horizontal line */}
            {symptoms.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.symptomsLine}
                contentContainerStyle={s.symptomsLineContent}
              >
                {symptoms.map((sym) => (
                  <TouchableOpacity
                    key={sym}
                    style={s.symptomPill}
                    onPress={() => toggleSymptom(sym)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.symptomPillTxt}>{sym}</Text>
                    <Text style={s.symptomPillX}> ×</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Dropdown toggle */}
            <TouchableOpacity
              style={s.dropdownToggle}
              onPress={() => setSymptomsOpen((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={s.dropdownToggleTxt}>
                {symptoms.length === 0 ? 'Select symptoms (optional)' : 'Edit selection'}
              </Text>
              <Text style={s.dropdownArrow}>{symptomsOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Dropdown options list */}
            {symptomsOpen && (
              <View style={s.dropdownList}>
                {SYMPTOM_OPTIONS.map((sym) => {
                  const active = symptoms.includes(sym);
                  return (
                    <TouchableOpacity
                      key={sym}
                      style={[s.dropdownItem, active && s.dropdownItemActive]}
                      onPress={() => toggleSymptom(sym)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.dropdownItemTxt, active && s.dropdownItemTxtActive]}>
                        {sym}
                      </Text>
                      {active && <Text style={s.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── NOTES (expandable) ──────────────────────────────────── */}
          <View style={s.section}>
            <TouchableOpacity
              style={s.notesToggle}
              onPress={() => setShowNotes((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={s.notesToggleTxt}>
                {showNotes ? '− Hide notes' : '+ Add a note'}
              </Text>
            </TouchableOpacity>
            {showNotes && (
              <TextInput
                style={s.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Anything worth remembering…"
                placeholderTextColor={T.inkMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoCorrect={false}
              />
            )}
          </View>

          {/* ── INFERENCE CARD ──────────────────────────────────────── */}
          {showInferenceCard && (
            <View style={s.section}>
              <InferenceCard
                headline={inference.headline}
                body={inference.body}
                confirmLabel={inference.confirmLabel}
                dismissLabel={inference.dismissLabel}
                onConfirm={handleInferenceConfirm}
                onDismiss={handleInferenceDismiss}
                isLoading={isLoading}
              />

              {inference.status === 'new_cycle' && (
                <>
                  <TouchableOpacity
                    style={s.datePickerRow}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={s.datePickerLabel}>Cycle started on</Text>
                    <Text style={s.datePickerValue}>{formatDisplayDate(overrideDate)}</Text>
                    <Text style={s.datePickerEdit}>Change</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={overrideDate}
                      mode="date"
                      display="default"
                      maximumDate={today}
                      onChange={(_, d) => {
                        setShowDatePicker(false);
                        if (d) setOverrideDate(d);
                      }}
                    />
                  )}
                </>
              )}
            </View>
          )}

          {/* ── SAVE BUTTON ─────────────────────────────────────────── */}
          {!showInferenceCard && (
            <TouchableOpacity
              style={[s.saveBtn, (isLoading || saved) && s.saveBtnDim]}
              onPress={handleSave}
              disabled={isLoading || saved}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#F0EDE8" />
                : <Text style={s.saveBtnTxt}>{saved ? 'Saved ✓' : "Save log"}</Text>
              }
            </TouchableOpacity>
          )}

          {showInferenceCard && inference.status === 'gap' && (
            <TouchableOpacity
              style={[s.saveBtn, isLoading && s.saveBtnDim]}
              onPress={handleSave}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#F0EDE8" />
                : <Text style={s.saveBtnTxt}>Save log</Text>
              }
            </TouchableOpacity>
          )}

          <View style={{ height: 52 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: T.pageBg },
  safe:   { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: T.cardBg,
    borderWidth: 1, borderColor: T.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow:   { fontSize: 17, color: T.inkMid },
  headerText:  { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: T.inkDark, letterSpacing: -0.2 },
  headerDate:  { fontSize: 12, color: T.inkMuted, marginTop: 1 },
  loggedBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(43,69,53,0.08)',
    borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(43,69,53,0.15)',
  },
  loggedBadgeTxt: { fontSize: 11, fontWeight: '500', color: T.forest, letterSpacing: 0.3 },

  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22 },
  section: { marginBottom: 26 },

  // Current cycle status card
  statusCard: {
    backgroundColor: T.cardBg,
    borderRadius: 14,
    borderWidth: 1, borderColor: T.cardBorder,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statusLeft:  {},
  statusDay:   { fontSize: 22, fontWeight: '300', color: T.inkDark, letterSpacing: -0.5 },
  statusPhase: { fontSize: 13, color: T.inkMuted, marginTop: 2 },
  statusRight: { alignItems: 'flex-end' },
  statusSince: { fontSize: 10, color: T.inkMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  statusDate:  { fontSize: 14, fontWeight: '500', color: T.inkMid, marginTop: 2 },

  // Bleeding grid
  bleedGrid: { flexDirection: 'row', gap: 7 },
  bleedBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 12, alignItems: 'center', gap: 5,
  },
  bleedGlyph: { fontSize: 18 },
  bleedLabel: { fontSize: 10, fontWeight: '500', letterSpacing: 0.2 },

  // Symptoms — selected pills (one horizontal line)
  symptomsLine:        { marginBottom: 10 },
  symptomsLineContent: { flexDirection: 'row', gap: 7, paddingBottom: 2 },
  symptomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(43,69,53,0.08)',
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(43,69,53,0.22)',
    paddingHorizontal: 12, paddingVertical: 7,
  },
  symptomPillTxt: { fontSize: 13, color: T.forest, fontWeight: '500' },
  symptomPillX:   { fontSize: 13, color: T.forest, fontWeight: '400' },

  // Dropdown toggle button
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: 11,
    borderWidth: 1, borderColor: T.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  dropdownToggleTxt: { flex: 1, fontSize: 13, color: T.inkMid },
  dropdownArrow:     { fontSize: 10, color: T.inkMuted },

  // Dropdown list
  dropdownList: {
    marginTop: 6,
    backgroundColor: T.cardBg,
    borderRadius: 11,
    borderWidth: 1, borderColor: T.cardBorder,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: T.divider,
  },
  dropdownItemActive: { backgroundColor: 'rgba(43,69,53,0.05)' },
  dropdownItemTxt:       { flex: 1, fontSize: 14, color: T.inkMid },
  dropdownItemTxtActive: { color: T.forest, fontWeight: '500' },
  checkmark: { fontSize: 14, color: T.forest, fontWeight: '600' },

  // Notes
  notesToggle:    { paddingVertical: 4 },
  notesToggleTxt: { fontSize: 13, color: T.inkMuted, fontWeight: '400' },
  notesInput: {
    marginTop: 10,
    backgroundColor: T.cardBg,
    borderRadius: 12,
    borderWidth: 1, borderColor: T.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14, color: T.inkDark,
    minHeight: 80,
  },

  // Date picker row (new cycle date override)
  datePickerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 10,
    backgroundColor: T.cardBg,
    borderRadius: 11,
    borderWidth: 1, borderColor: T.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12, gap: 6,
  },
  datePickerLabel: { fontSize: 13, color: T.inkMuted },
  datePickerValue: { flex: 1, fontSize: 13, fontWeight: '500', color: T.inkDark },
  datePickerEdit:  { fontSize: 13, color: T.gold, fontWeight: '500' },

  // Save button
  saveBtn: {
    backgroundColor: T.forest,
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: T.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 4,
  },
  saveBtnDim: { opacity: 0.55 },
  saveBtnTxt: { fontSize: 15, fontWeight: '500', color: '#F0EDE8', letterSpacing: 0.2 },
});

export default LogCycleScreen;
