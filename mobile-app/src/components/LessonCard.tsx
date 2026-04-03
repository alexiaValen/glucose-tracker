import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Lesson } from "../types/lesson";

// ✅ Define props type
type Props = {
  lesson: Lesson;
  onOpen: () => void;
};

export default function LessonCard({ lesson, onOpen }: Props) {
  if (!lesson) return null;

  const isNew = lesson.status === "assigned";
  const isCompleted = lesson.status === "completed";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCompleted && styles.completedCard
      ]}
      onPress={onOpen}
      activeOpacity={0.85}
    >
      {/* Icon */}
      <View style={styles.icon}>
        <Text style={styles.iconText}>
          {isCompleted ? "✓" : "✨"}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.eyebrow}>
          {isCompleted
            ? "COMPLETED"
            : isNew
            ? "NEW LESSON"
            : "CONTINUE"}
        </Text>

        <Text style={styles.title}>
          {lesson.title}
        </Text>

        {lesson.description && (
          <Text style={styles.description}>
            {lesson.description}
          </Text>
        )}
      </View>

      {/* Arrow */}
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212,214,212,0.25)",
    marginBottom: 10,
    gap: 14,
  },
  completedCard: {
    opacity: 0.6,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(107,127,110,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: "rgba(107,127,110,0.7)",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2B2B2B",
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(42,45,42,0.6)",
  },
  arrow: {
    fontSize: 18,
    color: "#6B7F6E",
  },
});