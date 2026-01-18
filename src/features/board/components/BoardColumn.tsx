import { FlashList } from "@shopify/flash-list";
import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useDragDrop } from "../../../context/DragDropContext";
import { BoardUser } from "../hooks/useBoardPresence";
import { Task, TaskStatus } from "../hooks/useTasks";
import { TaskCard } from "./TaskCard";

type Props = {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (title: string, status: TaskStatus) => void;
  onDropTask: (taskId: string, newStatus: TaskStatus) => void;
  onTaskPress: (task: Task) => void;
  activeUsers: BoardUser[];
};

export const BoardColumn = ({
  title,
  status,
  tasks,
  onDropTask,
  onTaskPress,
  activeUsers,
}: Props) => {
  const { registerDropZone } = useDragDrop();
  const viewRef = useRef<View>(null);

  const handleLayout = () => {
    setTimeout(() => {
      viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
        registerDropZone(
          status,
          { x: pageX, y: pageY, width, height },
          (droppedTask: Task) => {
            if (droppedTask.status !== status) {
              onDropTask(droppedTask.id, status);
            }
          },
        );
      });
    }, 100);
  };

  return (
    <View
      ref={viewRef}
      onLayout={handleLayout}
      collapsable={false}
      style={styles.columnWrapper}
    >
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.count}>{tasks.length}</Text>
        </View>

        <View style={styles.listContainer}>
          <FlashList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onPress={() => onTaskPress(item)}
                activeUsers={activeUsers}
              />
            )}
            contentContainerStyle={{
              paddingBottom: 20,
            }}
            extraData={activeUsers}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  columnWrapper: {
    flex: 1,
    marginHorizontal: 5,
    height: "100%",
  },
  innerContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: { fontWeight: "bold", fontSize: 16 },
  count: { backgroundColor: "#ddd", paddingHorizontal: 6, borderRadius: 8 },
  listContainer: {
    flex: 1,
    minHeight: 2,
  },
});
