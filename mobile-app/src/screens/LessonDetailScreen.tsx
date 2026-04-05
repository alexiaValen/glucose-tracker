import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { markLessonViewed, markLessonCompleted } from "../services/lessonService";

import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";

// ✅ Define route type
type Props = {
  route: RouteProp<RootStackParamList, "LessonDetail">;
};

export default function LessonDetailScreen({ route }: Props) {
  const { lesson } = route.params;

  // 🔥 local state so UI updates instantly
  const [isCompleted, setIsCompleted] = useState(
    lesson.status === "completed"
  );

  useEffect(() => {
    if (lesson?.status === "assigned") {
      markLessonViewed(lesson.id);
    }
  }, []);

  const handleComplete = async () => {
    await markLessonCompleted(lesson.id);
    setIsCompleted(true); // 🔥 update UI immediately
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>
        {lesson.title}
      </Text>

      {lesson.description && (
        <Text style={{ marginTop: 10 }}>
          {lesson.description}
        </Text>
      )}

      {/* 🔥 THIS IS THE UI SWITCH */}
      {isCompleted ? (
        <Text style={{ marginTop: 20 }}>Completed ✅</Text>
      ) : (
        <Button
          title="Mark Complete"
          onPress={handleComplete}
        />
      )}
    </View>
  );
}