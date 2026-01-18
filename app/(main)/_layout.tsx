import { Stack } from "expo-router";
import { NotificationListener } from "../../src/components/NotificationListener";

export default function MainLayout() {
  return (
    <>
      <NotificationListener />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="board/[id]" />
      </Stack>
    </>
  );
}
