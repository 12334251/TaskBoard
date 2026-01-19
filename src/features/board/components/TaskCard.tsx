import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS } from "react-native-reanimated"; // Use runOnJS

import { useDragDrop } from "../../../context/DragDropContext";
import { BoardUser } from "../hooks/useBoardPresence";
import { Task } from "../hooks/useTasks";

type TaskCardProps = {
  task: Task;
  onPress: () => void;
  activeUsers: BoardUser[];
  isOverlay?: boolean;
};

export const TaskCard = ({
  task,
  onPress,
  activeUsers,
  isOverlay = false,
}: TaskCardProps) => {
  const { startDrag, endDrag, activeDragItem, dragX, dragY } = useDragDrop();

  const editors = activeUsers.filter((u) => u.editingTaskId === task.id);
  const isBeingEdited = editors.length > 0;

  const isHidden = activeDragItem?.id === task.id && !isOverlay;

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(250)
    .onStart((event) => {
      dragX.value = event.absoluteX;
      dragY.value = event.absoluteY;

      runOnJS(startDrag)(task);
    })
    .onUpdate((event) => {
      dragX.value = event.absoluteX;
      dragY.value = event.absoluteY;
    })
    .onEnd((event) => {
      runOnJS(endDrag)(event.absoluteX, event.absoluteY);
    });

  const CardContent = (
    <View
      style={[styles.cardContent, isBeingEdited && styles.beingEditedBorder]}
    >
      {isBeingEdited && (
        <View style={styles.editorIndicator}>
          <Text style={styles.editorText}>
            ✎ {editors[0].email.split("@")[0]} is editing...
          </Text>
        </View>
      )}

      <Text style={styles.text} numberOfLines={2} ellipsizeMode="tail">
        {task.title}
      </Text>

      <View style={styles.footer}>
        {task.priority && (
          <View style={[styles.badge, styles[task.priority]]}>
            <Text style={styles.badgeText}>{task.priority}</Text>
          </View>
        )}
        {task.assignee && (
          <View style={styles.assigneeBadge}>
            <Text style={styles.assigneeText}>
              {task.assignee.email.split("@")[0]}
            </Text>
          </View>
        )}
        {task.due_date && (
          <Text style={styles.dateText}>
            📅 {new Date(task.due_date).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );

  if (isOverlay) {
    return <View style={styles.cardContainer}>{CardContent}</View>;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.cardContainer, { opacity: isHidden ? 0 : 1 }]}
      >
        <TouchableOpacity onPress={onPress} activeOpacity={1}>
          {CardContent}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 4,
    marginBottom: 10,
    borderRadius: 8,
  },
  cardContent: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  beingEditedBorder: {
    borderColor: "#FF9800",
    backgroundColor: "#FFF8E1",
  },
  editorIndicator: {
    marginBottom: 5,
    backgroundColor: "#FF9800",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editorText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  text: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
    alignSelf: "center",
  },
  footer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  HIGH: { backgroundColor: "#FF3B30" },
  MEDIUM: { backgroundColor: "#FF9500" },
  LOW: { backgroundColor: "#34C759" },
  assigneeBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  assigneeText: {
    fontSize: 10,
    color: "#007AFF",
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#888",
  },
});
