import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../api/supabase";
import { useTaskAssign } from "../hooks/useTaskAssign";
import { Task, TaskPriority, TaskStatus } from "../hooks/useTasks";

type Props = {
  visible: boolean;
  onClose: () => void;
  task?: Task | null;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  boardId: string;
};

export const TaskDetailModal = ({
  visible,
  onClose,
  task,
  onSave,
  onDelete,
  boardId,
}: Props) => {
  const insets = useSafeAreaInsets();
  const { members } = useTaskAssign(boardId);

  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("TODO");

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || "");
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(task.due_date ? new Date(task.due_date) : null);
        setAssigneeId(task.assignee_id || null);
        fetchComments(task.id);
      } else {
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setStatus("TODO");
        setDueDate(null);
        setAssigneeId(null);
        setComments([]);
      }
      setDropdownOpen(false);
      setShowDatePicker(false);
    }
  }, [visible, task]);

  const fetchComments = async (taskId: string) => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (data) setComments(data);
  };

  const handleSendComment = async () => {
    if (!task || !newComment.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("comments").insert({
      task_id: task.id,
      user_id: user.id,
      content: newComment,
    });
    if (!error) {
      setNewComment("");
      fetchComments(task.id);
    } else {
      Alert.alert("Error", "Failed to send comment");
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Title is required");
      return;
    }

    const payload: Partial<Task> = {
      title,
      description,
      priority,
      status,
      due_date: dueDate ? dueDate.toISOString() : null,
      assignee_id: assigneeId || null,
    };

    onSave(payload);
    onClose();
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleDateButtonPress = () => {
    if (!dueDate) {
      setDueDate(new Date());
    }
    setShowDatePicker(true);
  };

  const getSelectedAssigneeName = () => {
    if (!assigneeId) return "Unassigned";
    const member = members?.find((m) => m.userId === assigneeId);
    return member ? member.name : "Unknown User";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={[
          styles.container,
          { paddingTop: Platform.OS === "android" ? insets.top : 20 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {task ? "Edit Task" : "New Task"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 20) + 30 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Assign To</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setDropdownOpen(!isDropdownOpen)}
            >
              <Text
                style={[styles.dropdownText, !assigneeId && { color: "#999" }]}
              >
                {getSelectedAssigneeName()}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setAssigneeId(null);
                    setDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>Unassigned</Text>
                  {!assigneeId && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>

                {members?.map((member) => (
                  <TouchableOpacity
                    key={member.userId}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setAssigneeId(member.userId);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{member.name}</Text>
                    {assigneeId === member.userId && (
                      <Text style={styles.checkIcon}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Redesign Homepage"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details..."
            multiline
          />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.row}>
            {(["LOW", "MEDIUM", "HIGH"] as TaskPriority[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, priority === p && styles.activeChip]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.chipText,
                    priority === p && styles.activeChipText,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* --- DATE PICKER SECTION START --- */}
          <Text style={styles.label}>Due Date</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={handleDateButtonPress}
          >
            <Text style={[styles.dateText, !dueDate && { color: "#999" }]}>
              {dueDate ? dueDate.toDateString() : "Select Due Date"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <>
              <DateTimePicker
                testID="dateTimePicker"
                value={dueDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={onChangeDate}
                style={Platform.OS === "ios" ? styles.iosDatePicker : undefined}
                minimumDate={new Date()}
              />

              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.datePickerDoneBtn}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>
              {task ? "Update Task" : "Create Task"}
            </Text>
          </TouchableOpacity>

          {task && onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                Alert.alert("Delete", "Are you sure?", [
                  { text: "Cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      onDelete(task.id);
                      onClose();
                    },
                  },
                ]);
              }}
            >
              <Text style={styles.deleteBtnText}>Delete Task</Text>
            </TouchableOpacity>
          )}

          {task && (
            <View style={styles.commentsSection}>
              <Text style={styles.label}>Comments</Text>
              {comments.map((c) => (
                <View key={c.id} style={styles.commentBubble}>
                  <Text style={styles.commentText}>{c.content}</Text>
                  <Text style={styles.commentDate}>
                    {new Date(c.created_at).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Write a comment..."
                />
                <TouchableOpacity onPress={handleSendComment}>
                  <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  closeText: { color: "#007AFF", fontSize: 16 },
  content: { padding: 20 },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    marginTop: 15,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: "top" },

  dropdownContainer: {
    zIndex: 10,
  },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  dropdownText: { fontSize: 16, color: "#333" },
  dropdownArrow: { fontSize: 12, color: "#666" },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 2000,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    marginTop: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: { fontSize: 16, color: "#333" },
  checkIcon: { color: "#007AFF", fontWeight: "bold" },

  dateButton: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  dateText: { fontSize: 16, color: "#333" },
  iosDatePicker: {
    marginTop: 10,
    backgroundColor: "white",
    borderRadius: 8,
  },
  datePickerDoneBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  datePickerDoneText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginBottom: 5,
  },
  activeChip: { backgroundColor: "#007AFF" },
  chipText: { color: "#333", fontSize: 14, fontWeight: "500" },
  activeChipText: { color: "white" },
  saveBtn: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    marginTop: 30,
    alignItems: "center",
  },
  saveBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  deleteBtn: { marginTop: 15, alignItems: "center", padding: 10 },
  deleteBtnText: { color: "red", fontSize: 16 },
  commentsSection: {
    marginTop: 40,
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 20,
  },
  commentBubble: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentText: { color: "#333", fontSize: 14 },
  commentDate: {
    fontSize: 10,
    color: "#aaa",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sendText: { color: "#007AFF", fontWeight: "bold", padding: 5 },
});
