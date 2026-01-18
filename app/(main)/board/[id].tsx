import { useLocalSearchParams } from "expo-router";
import { BoardDetailScreen } from "../../../src/features/board/screens/BoardDetailScreen";

export default function BoardRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <BoardDetailScreen boardId={id!} />;
}
