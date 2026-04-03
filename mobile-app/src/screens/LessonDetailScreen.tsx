import React, { useEffect } from "react";
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

  useEffect(() => {
    if (lesson?.status === "assigned") {
      markLessonViewed(lesson.id);
    }
  }, []);

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

      <Button
        title="Mark Complete"
        onPress={() => markLessonCompleted(lesson.id)}
      />
    </View>
  );
}