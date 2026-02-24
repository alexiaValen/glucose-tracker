// mobile-app/src/data/rhythmData.ts
// Four Spiritual & Physiological Rhythms
// Content by Michelle Rediger — Transforming Lives Coaching, LLC

export interface RhythmPhase {
  id: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  name: string;
  subtitle: string;
  days: string;
  emoji: string;
  color: string;
  backgroundColor: string;
  physiology: string;
  spiritualRhythm: string;
  scripture: {
    reference: string;
    text: string;
  };
  practice: string;
}

export const RHYTHM_PHASES: RhythmPhase[] = [
  {
    id: 'menstrual',
    name: 'Reawaken',
    subtitle: 'Menstrual Phase',
    days: 'Days 1–5',
    emoji: '🌱',
    color: '#6B7F6E',
    backgroundColor: '#E8EDE9',
    physiology: 'Hormones are at their lowest; the body is releasing and resetting.',
    spiritualRhythm: 'A time of release, rest, and quiet clarity — a spiritual exhale.',
    scripture: {
      reference: 'Isaiah 43:19',
      text: '"I am about to do a new thing; now it springs forth, do you not perceive it?"',
    },
    practice:
      "Lean into surrender. Let go of what no longer serves you. Trust God's timing and make space for the new He is preparing.",
  },
  {
    id: 'follicular',
    name: 'Renew',
    subtitle: 'Follicular Phase',
    days: 'Days 6–13',
    emoji: '🍃',
    color: '#5C7A5C',
    backgroundColor: '#EDF2ED',
    physiology: 'Estrogen rises, energy lifts, creativity returns, the brain becomes more open to new ideas.',
    spiritualRhythm: 'A time of rising energy, vision, and intention — a spiritual inhale.',
    scripture: {
      reference: 'Proverbs 16:3',
      text: '"Commit your work to the Lord, and your plans will be established."',
    },
    practice:
      "Ask the Lord for direction. Set intentions. Revisit your vision. Partner with Him in fresh beginnings.",
  },
  {
    id: 'ovulation',
    name: 'Radiant',
    subtitle: 'Ovulatory Phase',
    days: 'Days 14–16',
    emoji: '🌞',
    color: '#B8860B',
    backgroundColor: '#FBF5E0',
    physiology: 'Hormones peak; communication, confidence, and connection are naturally heightened.',
    spiritualRhythm: 'A time of visibility, overflow, and expression.',
    scripture: {
      reference: 'Psalm 34:5',
      text: '"Those who look to Him for help will be radiant with joy."',
    },
    practice:
      "Shine. Encourage others. Ask God who He's inviting you to bless from a place of abundance.",
  },
  {
    id: 'luteal',
    name: 'Rooted',
    subtitle: 'Luteal Phase',
    days: 'Days 17–bleed',
    emoji: '🌾',
    color: '#3D5540',
    backgroundColor: '#E6EDE8',
    physiology: 'Progesterone rises; the body prepares, focuses, and seeks stability and grounding.',
    spiritualRhythm: 'A time of discernment, evaluation, and deepening.',
    scripture: {
      reference: 'Psalm 46:10',
      text: '"Be still and know that I am God."',
    },
    practice:
      "Simplify. Create boundaries. Celebrate progress. Prioritize stillness and God's presence over productivity.",
  },
];

export function getRhythmForPhase(phase: string): RhythmPhase | null {
  const normalized = phase?.toLowerCase();
  return RHYTHM_PHASES.find((r) => r.id === normalized) ?? null;
}