import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../api/supabase";
import { DragDropProvider } from "../../../context/DragDropContext";
import { BoardColumn } from "../components/BoardColumn";
import { InviteMemberModal } from "../components/InviteMemberModal";
import { TaskDetailModal } from "../components/TaskDetailModal";
import { useBoardPresence } from "../hooks/useBoardPresence";
import { Task, TaskPriority, useTasks } from "../hooks/useTasks";

export const BoardDetailScreen = ({ boardId }: { boardId: string }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`board_life_check:${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "boards",
          filter: `id=eq.${boardId}`,
        },
        () => {
          Alert.alert(
            "Board Deleted",
            "This board has been deleted by the owner.",
            [
              {
                text: "OK",
                onPress: () => {
                  if (router.canGoBack()) {
                    router.dismissAll();
                  }
                  router.replace("/(main)");
                },
              },
            ],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, router]);

  const {
    data: tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks(boardId);

  const { activeUsers, setEditingTask } = useBoardPresence(boardId);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "ALL">(
    "ALL",
  );

  const [isTaskModalVisible, setTaskModalVisible] = useState(false);
  const [isInviteVisible, setInviteVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleMoveTask = async (taskId: string, newStatus: any) => {
    updateTask({ id: taskId, updates: { status: newStatus } });
  };

  const openCreateTaskModal = () => {
    setSelectedTask(null);
    setTaskModalVisible(true);
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setTaskModalVisible(true);
    setEditingTask(task.id);
  };

  const closeTaskModal = () => {
    setTaskModalVisible(false);
    setSelectedTask(null);
    setEditingTask(null);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (selectedTask) {
      updateTask({ id: selectedTask.id, updates: taskData });
    } else {
      createTask(taskData);
    }
  };

  if (isLoading) return <ActivityIndicator style={styles.center} />;

  const filteredTasks =
    tasks?.filter((t) => {
      const matchesSearch = t.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesPriority =
        filterPriority === "ALL" || t.priority === filterPriority;
      return matchesSearch && matchesPriority;
    }) || [];

  const todoTasks = filteredTasks.filter((t) => t.status === "TODO");
  const inProgressTasks = filteredTasks.filter(
    (t) => t.status === "IN_PROGRESS",
  );
  const doneTasks = filteredTasks.filter((t) => t.status === "DONE");

  return (
    <DragDropProvider>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: "Board" }} />

        <View style={styles.presenceBar}>
          <Text style={styles.presenceLabel}>Active:</Text>
          <View style={styles.avatarRow}>
            {activeUsers.map((u) => (
              <View key={u.userId} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {u.email?.substring(0, 2).toUpperCase()}
                </Text>
                <View style={styles.onlineDot} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.toolbar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View style={styles.rowBetween}>
            <View style={styles.filterRow}>
              {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setFilterPriority(p)}
                  style={[
                    styles.filterChip,
                    filterPriority === p && styles.activeFilter,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filterPriority === p && styles.activeFilterText,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.inviteIconBtn}
              onPress={() => setInviteVisible(true)}
            >
              <Text style={styles.inviteIconText}>👤+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={openCreateTaskModal}>
            <Text style={styles.addBtnText}>+ New Task</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.boardContainer}>
          <BoardColumn
            title="To Do"
            status="TODO"
            tasks={todoTasks}
            onAddTask={() => {}}
            onDropTask={handleMoveTask}
            onTaskPress={handleTaskPress}
            activeUsers={activeUsers}
          />
          <BoardColumn
            title="Progress"
            status="IN_PROGRESS"
            tasks={inProgressTasks}
            onAddTask={() => {}}
            onDropTask={handleMoveTask}
            onTaskPress={handleTaskPress}
            activeUsers={activeUsers}
          />
          <BoardColumn
            title="Done"
            status="DONE"
            tasks={doneTasks}
            onAddTask={() => {}}
            onDropTask={handleMoveTask}
            onTaskPress={handleTaskPress}
            activeUsers={activeUsers}
          />
        </View>

        <TaskDetailModal
          visible={isTaskModalVisible}
          onClose={closeTaskModal}
          task={selectedTask}
          onSave={handleSaveTask}
          onDelete={deleteTask}
          boardId={boardId}
        />

        <InviteMemberModal
          visible={isInviteVisible}
          onClose={() => setInviteVisible(false)}
          boardId={boardId}
        />
      </View>
    </DragDropProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  boardContainer: {
    flex: 1,
    flexDirection: "row",
    paddingTop: 10,
    overflow: "visible",
    zIndex: 1,
  },

  presenceBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  presenceLabel: { fontSize: 12, color: "#888", marginRight: 8 },
  avatarRow: { flexDirection: "row" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: -8, // Overlap effect
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarText: { fontSize: 10, fontWeight: "bold", color: "#555" },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  toolbar: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  searchInput: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: "#eee",
  },
  activeFilter: { backgroundColor: "#333" },
  filterText: { fontSize: 12, color: "#333" },
  activeFilterText: { color: "white" },
  inviteIconBtn: {
    backgroundColor: "#E3F2FD",
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  inviteIconText: { fontSize: 16, fontWeight: "bold", color: "#007AFF" },
  addBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addBtnText: { color: "white", fontWeight: "bold" },
});
