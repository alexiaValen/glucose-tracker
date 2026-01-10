// import React, { useMemo, useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Pressable,
//   Modal,
//   FlatList,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useNavigation } from '@react-navigation/native';
// import { symptomService } from '../services/symptom.service';
// import { colors } from '../theme/colors';

// const SYMPTOM_TYPES = [
//   { id: 'headache', label: 'Headache' },
//   { id: 'fatigue', label: 'Fatigue' },
//   { id: 'dizziness', label: 'Dizziness' },
//   { id: 'hunger', label: 'Hunger' },
//   { id: 'irritability', label: 'Irritability' },
//   { id: 'nausea', label: 'Nausea' },
//   { id: 'shaking', label: 'Shaking' },
//   { id: 'sweating', label: 'Sweating' },
//   { id: 'brain_fog', label: 'Brain Fog' },
//   { id: 'anxiety', label: 'Anxiety' },
//   { id: 'cramps', label: 'Cramps' },
//   { id: 'bloating', label: 'Bloating' },
//   { id: 'mood_swings', label: 'Mood Swings' },
//   { id: 'other', label: 'Other' },
// ];

// export default function AddSymptomScreen() {
//   const navigation = useNavigation();

//   const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
//   const [severity, setSeverity] = useState(5);
//   const [notes, setNotes] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [pickerOpen, setPickerOpen] = useState(false);

//   const toggleSymptom = (id: string) => {
//     setSelectedTypes((prev) =>
//       prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//     );
//   };

//   const selectedSummary = useMemo(() => {
//     if (!selectedTypes.length) return 'Select symptoms…';

//     const labels = selectedTypes
//       .map((id) => SYMPTOM_TYPES.find((s) => s.id === id)?.label)
//       .filter(Boolean) as string[];

//     if (labels.length <= 2) return labels.join(', ');
//     return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`;
//   }, [selectedTypes]);

//   const handleSubmit = async () => {
//     if (!selectedTypes.length) {
//       Alert.alert('Error', 'Please select at least one symptom');
//       return;
//     }

//     try {
//       setIsLoading(true);

//       for (const type of selectedTypes) {
//         await symptomService.createSymptom({
//           symptomType: type,
//           severity,
//           notes: notes.trim() || undefined,
//         });
//       }

//       Alert.alert('Success', 'Symptom(s) logged', [
//         { text: 'OK', onPress: () => navigation.goBack() },
//       ]);
//     } catch (error: any) {
//       Alert.alert('Error', error?.response?.data?.error || 'Failed to log symptom');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1 }}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >
//       <ScrollView contentContainerStyle={styles.container}>
//         {/* Symptom selector */}
//         <View style={styles.section}>
//           <Text style={styles.label}>How are you feeling?</Text>

//           <Pressable
//             style={styles.multiSelectTrigger}
//             onPress={() => setPickerOpen(true)}
//           >
//             <Text
//               style={[
//                 styles.multiSelectText,
//                 selectedTypes.length === 0 && styles.placeholder,
//               ]}
//             >
//               {selectedSummary}
//             </Text>
//             <Text style={styles.chevron}>▾</Text>
//           </Pressable>
//         </View>

//         {/* Severity */}
//         <View style={styles.section}>
//           <Text style={styles.label}>Severity</Text>
//           <View style={styles.severityRow}>
//             {Array.from({ length: 10 }).map((_, i) => {
//               const value = i + 1;
//               const active = severity === value;
//               return (
//                 <TouchableOpacity
//                   key={value}
//                   style={[styles.severityDot, active && styles.severityActive]}
//                   onPress={() => setSeverity(value)}
//                 >
//                   <Text
//                     style={[
//                       styles.severityText,
//                       active && styles.severityTextActive,
//                     ]}
//                   >
//                     {value}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//           <Text style={styles.severityHint}>
//             {severity}/10
//           </Text>
//         </View>

//         {/* Notes */}
//         <View style={styles.section}>
//           <Text style={styles.label}>Notes (Optional)</Text>
//           <TextInput
//             style={styles.textInput}
//             placeholder="Any additional details about how you're feeling…"
//             placeholderTextColor={colors.textLight}
//             multiline
//             value={notes}
//             onChangeText={setNotes}
//           />
//         </View>

//         {/* Submit */}
//         <TouchableOpacity
//           style={[styles.submitButton, isLoading && { opacity: 0.6 }]}
//           onPress={handleSubmit}
//           disabled={isLoading}
//         >
//           <Text style={styles.submitText}>
//             {isLoading ? 'Saving…' : 'Log Symptom'}
//           </Text>
//         </TouchableOpacity>
//       </ScrollView>

//       {/* Multi-select modal */}
//       <Modal visible={pickerOpen} animationType="slide" transparent>
//         <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)} />

//         <SafeAreaView style={styles.sheet}>
//           <View style={styles.sheetHeader}>
//             <Text style={styles.sheetTitle}>Check all that apply</Text>
//             <Pressable onPress={() => setPickerOpen(false)}>
//               <Text style={styles.done}>Done</Text>
//             </Pressable>
//           </View>

//           <FlatList
//             data={SYMPTOM_TYPES}
//             keyExtractor={(item) => item.id}
//             ItemSeparatorComponent={() => <View style={styles.separator} />}
//             renderItem={({ item }) => {
//               const checked = selectedTypes.includes(item.id);
//               return (
//                 <Pressable
//                   style={styles.row}
//                   onPress={() => toggleSymptom(item.id)}
//                 >
//                   <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
//                     {checked && <Text style={styles.check}>✓</Text>}
//                   </View>
//                   <Text style={styles.rowText}>{item.label}</Text>
//                 </Pressable>
//               );
//             }}
//           />
//         </SafeAreaView>
//       </Modal>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//     paddingBottom: 40,
//   },
//   section: {
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 10,
//     color: colors.textDark,
//   },

//   /* Dropdown */
//   multiSelectTrigger: {
//     backgroundColor: colors.white,
//     borderWidth: 2,
//     borderColor: colors.border,
//     borderRadius: 14,
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   multiSelectText: {
//     fontSize: 15,
//     color: colors.textDark,
//     flex: 1,
//     paddingRight: 10,
//   },
//   placeholder: {
//     color: colors.textLight,
//   },
//   chevron: {
//     fontSize: 18,
//     color: colors.textLight,
//   },

//   /* Severity */
//   severityRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   severityDot: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     borderWidth: 2,
//     borderColor: colors.border,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   severityActive: {
//     backgroundColor: colors.sage,
//     borderColor: colors.sage,
//   },
//   severityText: {
//     color: colors.textDark,
//     fontWeight: '600',
//   },
//   severityTextActive: {
//     color: colors.white,
//   },
//   severityHint: {
//     marginTop: 8,
//     color: colors.textLight,
//   },

//   /* Notes */
//   textInput: {
//     borderWidth: 2,
//     borderColor: colors.border,
//     borderRadius: 14,
//     padding: 14,
//     minHeight: 100,
//     textAlignVertical: 'top',
//     color: colors.textDark,
//   },

//   /* Submit */
//   submitButton: {
//     backgroundColor: colors.sage,
//     paddingVertical: 16,
//     borderRadius: 16,
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   submitText: {
//     color: colors.white,
//     fontSize: 16,
//     fontWeight: '700',
//   },

//   /* Modal */
//   backdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.25)',
//   },
//   sheet: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     maxHeight: '70%',
//     backgroundColor: colors.white,
//     borderTopLeftRadius: 18,
//     borderTopRightRadius: 18,
//   },
//   sheetHeader: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   sheetTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   done: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: colors.sage,
//   },
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//   },
//   rowText: {
//     fontSize: 16,
//     color: colors.textDark,
//   },
//   checkbox: {
//     width: 22,
//     height: 22,
//     borderRadius: 6,
//     borderWidth: 2,
//     borderColor: colors.border,
//     marginRight: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   checkboxChecked: {
//     borderColor: colors.sage,
//     backgroundColor: colors.cream,
//   },
//   check: {
//     fontSize: 16,
//     fontWeight: '800',
//     color: colors.sage,
//   },
//   separator: {
//     height: 1,
//     backgroundColor: colors.border,
//     marginLeft: 50,
//   },
//   primaryButton: {
//   height: 56,
//   borderRadius: 20,
//   alignItems: 'center',
//   justifyContent: 'center',
//   backgroundColor: colors.sage,
//   shadowColor: '#000',
//   shadowOffset: { width: 0, height: 6 },
//   shadowOpacity: 0.08,
//   shadowRadius: 14,
//   elevation: 2,
// },
// primaryButtonText: {
//   color: colors.white,
//   fontSize: 16,
//   fontWeight: '700',
//   letterSpacing: 0.2,
// },
// secondaryButton: {
//   height: 56,
//   borderRadius: 20,
//   alignItems: 'center',
//   justifyContent: 'center',
//   backgroundColor: colors.white,
//   borderWidth: 1,
//   borderColor: colors.border,
// },
// secondaryButtonText: {
//   color: colors.sage,
//   fontSize: 16,
//   fontWeight: '700',
// },
// });



// mobile-app/src/screens/AddSymptomScreen.tsx
import React, { useMemo, useState } from 'react';
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
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { symptomService } from '../services/symptom.service';
import { colors } from '../theme/colors';

const SYMPTOM_TYPES = [
  { id: 'headache', label: 'Headache', icon: '🌫️' },
  { id: 'fatigue', label: 'Fatigue', icon: '🍂' },
  { id: 'dizziness', label: 'Dizziness', icon: '🌀' },
  { id: 'hunger', label: 'Hunger', icon: '🌾' },
  { id: 'irritability', label: 'Irritability', icon: '⚡' },
  { id: 'nausea', label: 'Nausea', icon: '🌊' },
  { id: 'shaking', label: 'Shaking', icon: '🍃' },
  { id: 'sweating', label: 'Sweating', icon: '💧' },
  { id: 'brain_fog', label: 'Brain Fog', icon: '☁️' },
  { id: 'anxiety', label: 'Anxiety', icon: '🌪️' },
  { id: 'cramps', label: 'Cramps', icon: '🌿' },
  { id: 'bloating', label: 'Bloating', icon: '🎈' },
  { id: 'mood_swings', label: 'Mood Swings', icon: '🎭' },
  { id: 'other', label: 'Other', icon: '✨' },
];

export default function AddSymptomScreen() {
  const navigation = useNavigation();

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toggleSymptom = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedSummary = useMemo(() => {
    if (!selectedTypes.length) return 'Select symptoms…';

    const labels = selectedTypes
      .map((id) => SYMPTOM_TYPES.find((s) => s.id === id)?.label)
      .filter(Boolean) as string[];

    if (labels.length <= 2) return labels.join(', ');
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`;
  }, [selectedTypes]);

  const handleSubmit = async () => {
    if (!selectedTypes.length) {
      Alert.alert('Error', 'Please select at least one symptom');
      return;
    }

    try {
      setIsLoading(true);

      for (const type of selectedTypes) {
        await symptomService.createSymptom({
          symptomType: type,
          severity,
          notes: notes.trim() || undefined,
        });
      }

      Alert.alert('Success', 'Symptom(s) logged', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to log symptom');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (value: number) => {
    if (value <= 3) return colors.sage;
    if (value <= 6) return colors.goldLeaf;
    return colors.warmBrown;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Symptoms</Text>
        <Text style={styles.subtitle}>Track how you're feeling today</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Symptom selector */}
          <View style={styles.section}>
            <Text style={styles.label}>How are you feeling?</Text>

            <Pressable
              style={styles.multiSelectTrigger}
              onPress={() => setPickerOpen(true)}
            >
              <Text
                style={[
                  styles.multiSelectText,
                  selectedTypes.length === 0 && styles.placeholder,
                ]}
              >
                {selectedSummary}
              </Text>
              <Text style={styles.chevron}>▾</Text>
            </Pressable>
          </View>

          {/* Severity */}
          <View style={styles.section}>
            <Text style={styles.label}>Severity</Text>
            <View style={styles.severityRow}>
              {Array.from({ length: 10 }).map((_, i) => {
                const value = i + 1;
                const active = severity === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.severityDot,
                      active && { 
                        backgroundColor: getSeverityColor(value),
                        borderColor: getSeverityColor(value)
                      }
                    ]}
                    onPress={() => setSeverity(value)}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        active && styles.severityTextActive,
                      ]}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.severityLegend}>
              <Text style={styles.severityHint}>
                {severity}/10
              </Text>
              <Text style={styles.severityLabel}>
                {severity <= 3 ? 'Mild' : severity <= 6 ? 'Moderate' : 'Severe'}
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Any additional details about how you're feeling…"
              placeholderTextColor={colors.textLight}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {!isLoading && (
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonIcon}>✓</Text>
              </View>
            )}
            <Text style={styles.submitText}>
              {isLoading ? 'Saving…' : 'Log Symptoms'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Multi-select modal */}
        <Modal visible={pickerOpen} animationType="slide" transparent>
          <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)} />

          <SafeAreaView style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select symptoms</Text>
              <Pressable onPress={() => setPickerOpen(false)}>
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>

            <FlatList
              data={SYMPTOM_TYPES}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const checked = selectedTypes.includes(item.id);
                return (
                  <Pressable
                    style={styles.row}
                    onPress={() => toggleSymptom(item.id)}
                  >
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowIcon}>{item.icon}</Text>
                      <Text style={styles.rowText}>{item.label}</Text>
                    </View>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Text style={styles.check}>✓</Text>}
                    </View>
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    backgroundColor: colors.white,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.sage,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.textDark,
    letterSpacing: 0.2,
  },

  /* Dropdown */
  multiSelectTrigger: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  multiSelectText: {
    fontSize: 15,
    color: colors.textDark,
    flex: 1,
    paddingRight: 10,
  },
  placeholder: {
    color: colors.textLight,
  },
  chevron: {
    fontSize: 18,
    color: colors.textLight,
  },

  /* Severity */
  severityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  severityDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  severityText: {
    color: colors.textDark,
    fontWeight: '600',
    fontSize: 15,
  },
  severityTextActive: {
    color: colors.white,
  },
  severityLegend: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityHint: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.sage,
  },
  severityLabel: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },

  /* Notes */
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: colors.textDark,
    fontSize: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  /* Submit */
  submitButton: {
    backgroundColor: colors.sage,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  buttonIcon: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  submitText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* Modal */
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
  },
  done: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.sage,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  rowText: {
    fontSize: 16,
    color: colors.textDark,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    borderColor: colors.sage,
    backgroundColor: colors.sage,
  },
  check: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 60,
  },
});