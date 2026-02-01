// mobile-app/src/screens/SessionDetailScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Animated,
  Image,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { colors } from '../theme/colors';

// Botanical icon imports - using require for local assets
// const ICONS = {
//   lotus: require('../assets/icons/lotus.png'),
//   leaf: require('../assets/icons/leaf.png'),
//   flower: require('../assets/icons/flower.png'),
//   heart: require('../assets/icons/heart.png'),
//   scripture: require('../assets/icons/scripture.png'),
//   journal: require('../assets/icons/journal.png'),
// };

type SessionDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SessionDetail'
>;
type SessionDetailScreenRouteProp = RouteProp<RootStackParamList, 'SessionDetail'>;

interface Props {
  navigation: SessionDetailScreenNavigationProp;
  route: SessionDetailScreenRouteProp;
}

interface ReflectionNote {
  id: string;
  question: string;
  answer: string;
}

// Session 1 Data Structure
const SESSION_ONE_DATA = {
  number: 1,
  title: 'Holy',
  subtitle: 'Set Apart by Christ',
  featuredScripture: {
    text: '"Even though you were once distant from Him, living in the shadows of your evil thoughts and actions, He reconnected you back to Himself. He released His supernatural peace to you through the sacrifice of His own body as the sin-payment on your behalf so that you would dwell in His presence. And now there is nothing between you and Father God, for he sees you as holy, flawless, and restored."',
    reference: 'Colossians 1:21-22 TPT',
    insight: 'Holiness is not earned—it is received through Christ\'s sacrifice.',
  },
  keyScriptures: [
    'Colossians 1:21–22',
    '1 Peter 1:13–16',
    '1 Peter 2:1–3',
    'Hebrews 10:10',
    'Romans 12:1–2',
  ],
  reflectionQuestions: [
    'What might be getting in the way of believing you are holy? Write down any words that you\'ve used to describe or define yourself that, in your mind, would disqualify you.',
    'Which motives or thought patterns might the Holy Spirit be inviting you to surrender today?',
    'Invite the Holy Spirit to speak truth over this area of your life. What would God like you to know about this? What truth from scripture speaks directly to that place? Write down the first thing that comes to mind.',
  ],
  groupQuestions: [
    'What does being holy or set apart for God look like in your everyday life—home, work, relationships?',
    'Where do you find it hardest to believe that you are holy in God\'s sight?',
    'Where do you tend to rely most on your own strength instead of the Holy Spirit?',
    'How might living from holiness, rather than striving for it, change your sense of peace and purpose?',
  ],
  journalPrompts: [
    {
      title: 'You belong to Me now.',
      description: 'Write about what it means to be invited into God\'s sacred space—fully known, fully loved, fully His.',
    },
    {
      title: 'Set apart like a wedding dress.',
      description: 'Reflect on how God has uniquely designed and consecrated your life.',
    },
    {
      title: 'Prepare your mind for action.',
      description: 'Journal about one area where you sense God calling you into deeper maturity or obedience.',
    },
    {
      title: 'Search me, O God.',
      description: 'Ask the Holy Spirit to reveal any hidden motives, thoughts, or attitudes He wants to transform.',
    },
    {
      title: 'Holy because He is holy in me.',
      description: 'Write a prayer of gratitude for the holiness Christ has placed within you.',
    },
  ],
};

export default function SessionDetailScreen({ navigation, route }: Props) {
  const { sessionId } = route.params;
  const [reflections, setReflections] = useState<ReflectionNote[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('scripture');

  const session = SESSION_ONE_DATA;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const updateReflection = (questionIndex: number, text: string) => {
    const newReflections = [...reflections];
    const existingIndex = newReflections.findIndex(r => r.id === `q-${questionIndex}`);
    
    if (existingIndex >= 0) {
      newReflections[existingIndex].answer = text;
    } else {
      newReflections.push({
        id: `q-${questionIndex}`,
        question: session.reflectionQuestions[questionIndex],
        answer: text,
      });
    }
    
    setReflections(newReflections);
  };

  const getReflectionAnswer = (questionIndex: number): string => {
    const reflection = reflections.find(r => r.id === `q-${questionIndex}`);
    return reflection?.answer || '';
  };

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.sessionNumber}>SESSION {session.number}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{session.title}</Text>
            <Text style={styles.subtitle}>{session.subtitle}</Text>
          </View>

          {/* Decorative Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
          </View>

          {/* Featured Scripture Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => toggleSection('scripture')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                {/* <Image source={ICONS.lotus} style={styles.iconImage} resizeMode="contain" /> */}
              </View>
              <Text style={styles.cardTitle}>Featured Scripture</Text>
              <Text style={styles.expandIcon}>
                {expandedSection === 'scripture' ? '−' : '+'}
              </Text>
            </View>
            
            {expandedSection === 'scripture' && (
              <View style={styles.scriptureContent}>
                <View style={styles.scriptureCard}>
                  <Text style={styles.scriptureVerse}>{session.featuredScripture.text}</Text>
                  <Text style={styles.scriptureReference}>
                    {session.featuredScripture.reference}
                  </Text>
                  <View style={styles.insightDivider} />
                  <Text style={styles.scriptureInsight}>{session.featuredScripture.insight}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Key Scriptures Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => toggleSection('key-scriptures')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                {/* <Image source={ICONS.leaf} style={styles.iconImage} resizeMode="contain" /> */}
              </View>
              <Text style={styles.cardTitle}>Key Scriptures</Text>
              <Text style={styles.expandIcon}>
                {expandedSection === 'key-scriptures' ? '−' : '+'}
              </Text>
            </View>
            
            {expandedSection === 'key-scriptures' && (
              <View style={styles.cardContent}>
                {session.keyScriptures.map((scripture, index) => (
                  <View key={index} style={styles.scriptureItem}>
                    <Text style={styles.scriptureBullet}>✦</Text>
                    <Text style={styles.scriptureText}>{scripture}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>

          {/* Individual Reflection Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => toggleSection('reflection')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                {/* <Image source={ICONS.heart} style={styles.iconImage} resizeMode="contain" /> */}
              </View>
              <Text style={styles.cardTitle}>Individual Reflection</Text>
              <Text style={styles.expandIcon}>
                {expandedSection === 'reflection' ? '−' : '+'}
              </Text>
            </View>
            
            {expandedSection === 'reflection' && (
              <View style={styles.cardContent}>
                {session.reflectionQuestions.map((question, index) => (
                  <View key={index} style={styles.questionContainer}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionNumber}>{index + 1}</Text>
                      <Text style={styles.questionText}>{question}</Text>
                    </View>
                    <TextInput
                      style={styles.reflectionInput}
                      placeholder="Write your reflection here..."
                      placeholderTextColor="rgba(107, 127, 110, 0.4)"
                      multiline
                      numberOfLines={4}
                      value={getReflectionAnswer(index)}
                      onChangeText={(text) => updateReflection(index, text)}
                      textAlignVertical="top"
                    />
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>

          {/* Group Discussion Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => toggleSection('group')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                {/* <Image source={ICONS.flower} style={styles.iconImage} resizeMode="contain" /> */}
              </View>
              <Text style={styles.cardTitle}>Group Discussion</Text>
              <Text style={styles.expandIcon}>
                {expandedSection === 'group' ? '−' : '+'}
              </Text>
            </View>
            
            {expandedSection === 'group' && (
              <View style={styles.cardContent}>
                {session.groupQuestions.map((question, index) => (
                  <View key={index} style={styles.questionContainer}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionNumber}>{index + 1}</Text>
                      <Text style={styles.questionText}>{question}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>

          {/* Journal Prompts Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => toggleSection('journal')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                {/* <Image source={ICONS.journal} style={styles.iconImage} resizeMode="contain" /> */}
              </View>
              <Text style={styles.cardTitle}>Journal Prompts</Text>
              <Text style={styles.expandIcon}>
                {expandedSection === 'journal' ? '−' : '+'}
              </Text>
            </View>
            
            {expandedSection === 'journal' && (
              <View style={styles.cardContent}>
                <Text style={styles.promptIntro}>
                  Choose the one that speaks to your heart most in this moment.
                </Text>
                {session.journalPrompts.map((prompt, index) => (
                  <View key={index} style={styles.journalPrompt}>
                    <Text style={styles.promptTitle}>"{prompt.title}"</Text>
                    <Text style={styles.promptDescription}>{prompt.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 127, 110, 0.15)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 127, 110, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.sage[700],
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  sessionNumber: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.sage[500],
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: '300',
    color: colors.sage[900],
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.sage[600],
    fontWeight: '300',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    width: 30,
    height: 1,
    backgroundColor: colors.sage[400],
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.sage[400],
    marginHorizontal: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(107, 127, 110, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.sage[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconImage: {
    width: 20,
    height: 20,
    tintColor: colors.sage[700],
  },
  cardIconText: {
    fontSize: 16,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.sage[900],
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.sage[500],
  },
  scriptureContent: {
    marginTop: 16,
  },
  scriptureCard: {
    backgroundColor: colors.sage[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.sage[500],
    borderRadius: 12,
    padding: 20,
  },
  scriptureVerse: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.sage[800],
    fontStyle: 'italic',
    marginBottom: 12,
  },
  scriptureReference: {
    fontSize: 13,
    color: colors.sage[600],
    textAlign: 'right',
    fontWeight: '500',
  },
  insightDivider: {
    height: 1,
    backgroundColor: colors.sage[300],
    marginVertical: 16,
  },
  scriptureInsight: {
    fontSize: 14,
    color: colors.sage[700],
    textAlign: 'center',
    fontWeight: '500',
  },
  cardContent: {
    marginTop: 16,
  },
  scriptureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.sage[50],
    borderRadius: 8,
    marginBottom: 8,
  },
  scriptureBullet: {
    fontSize: 12,
    color: colors.sage[500],
    marginRight: 12,
  },
  scriptureText: {
    flex: 1,
    fontSize: 14,
    color: colors.sage[700],
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.sage[400],
    marginRight: 12,
    width: 30,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.sage[800],
  },
  reflectionInput: {
    backgroundColor: '#FDFCF9',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.sage[300],
    padding: 16,
    fontSize: 14,
    color: colors.sage[800],
    minHeight: 100,
  },
  promptIntro: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.sage[600],
    marginBottom: 16,
    textAlign: 'center',
  },
  journalPrompt: {
    backgroundColor: '#FDFCF9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.sage[200],
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.sage[900],
    marginBottom: 8,
  },
  promptDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.sage[700],
  },
});