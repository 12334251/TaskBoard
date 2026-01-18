import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../api/supabase";
import { BoardSkeleton } from "../components/Skeleton/BoardSkeleton";
import { useBoards } from "../hooks/useBoards";

export const BoardListScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: boards, isLoading, isFetching, error, refetch } = useBoards();

  const queryClient = useQueryClient();
  const isNavigatingRef = useRef(false);

  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isInputValid = newBoardTitle.trim().length >= 3;
  const isButtonDisabled = !isInputValid || isCreating;

  const createBoardMutation = useMutation({
    mutationFn: async (title: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("boards")
        .insert([{ title, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setNewBoardTitle("");
      setIsCreating(false);
    },
    onError: (err) => {
      Alert.alert("Error", err.message);
      setIsCreating(false);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    try {
      queryClient.clear();
      await supabase.auth.signOut();
      router.replace("/(auth)");
    } catch (err) {
      console.log("Sign out error", err);
      router.replace("/(auth)");
    }
  };

  const handleCreateBoard = () => {
    if (!isInputValid) return;
    setIsCreating(true);
    createBoardMutation.mutate(newBoardTitle);
  };

  const handleBoardPress = (boardId: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    router.push(`/board/${boardId}`);

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  };

  const showSkeleton =
    (isLoading || (isFetching && !boards?.length)) && !refreshing;

  if (showSkeleton) {
    return <BoardSkeleton />;
  }

  if (error)
    return (
      <View style={styles.center}>
        <Text>Error loading boards</Text>
      </View>
    );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Boards</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New Board Name (min 3 chars)..."
          value={newBoardTitle}
          onChangeText={setNewBoardTitle}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: isButtonDisabled ? "#ccc" : "#007AFF" },
          ]}
          onPress={handleCreateBoard}
          disabled={isButtonDisabled}
        >
          {isCreating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>+ Add</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={boards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleBoardPress(item.id)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading && !isFetching ? (
            <Text style={styles.emptyText}>No boards yet. Create one!</Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#333" },
  signOutBtn: { padding: 10 },
  signOutText: { color: "red", fontWeight: "600" },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
    paddingHorizontal: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  addButton: {
    padding: 15,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  addButtonText: { color: "white", fontWeight: "bold" },
  list: { paddingHorizontal: 20 },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  cardDate: { color: "#888", fontSize: 12 },
  emptyText: { textAlign: "center", marginTop: 50, color: "#888" },
});
