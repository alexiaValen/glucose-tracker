export interface Symptom {
  id: string;
  userId: string;
  symptomType: string;
  severity: number; // 1-10
  loggedAt: string;
  glucoseReadingId?: string;
  fastingSessionId?: string;
  notes?: string;
}

export interface CreateSymptomRequest {
  symptomType: string;
  severity: number;
  notes?: string;
  glucoseReadingId?: string;
}

export const SYMPTOM_TYPES = [
  { id: 'headache', label: '🤕 Headache', emoji: '🤕' },
  { id: 'fatigue', label: '😴 Fatigue', emoji: '😴' },
  { id: 'dizziness', label: '😵 Dizziness', emoji: '😵' },
  { id: 'hunger', label: '🍽️ Hunger', emoji: '🍽️' },
  { id: 'irritability', label: '😠 Irritability', emoji: '😠' },
  { id: 'nausea', label: '🤢 Nausea', emoji: '🤢' },
  { id: 'shaking', label: '🤝 Shaking', emoji: '🤝' },
  { id: 'sweating', label: '💦 Sweating', emoji: '💦' },
  { id: 'brain_fog', label: '🌫️ Brain Fog', emoji: '🌫️' },
  { id: 'anxiety', label: '😰 Anxiety', emoji: '😰' },
  { id: 'cramps', label: '🩸 Cramps', emoji: '🩸' },
  { id: 'bloating', label: '🎈 Bloating', emoji: '🎈' },
  { id: 'mood_swings', label: '🎭 Mood Swings', emoji: '🎭' },
  { id: 'other', label: '📝 Other', emoji: '📝' },
];