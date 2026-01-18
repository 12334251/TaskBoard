import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { DraxProvider } from "react-native-drax";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

import "../global.css";
import "../ReactotronConfig";
import { clientPersister, queryClient } from "../src/api/queryClient";
import { useSupabaseAuth } from "../src/hooks/useSupabaseAuth";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { isLoaded, isAuthenticated } = useSupabaseAuth();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inMainGroup = segments[0] === "(main)";

    if (isAuthenticated) {
      if (!inMainGroup) {
        router.replace("/(main)");
      } else {
        setIsReady(true);
      }
    } else {
      if (inMainGroup) {
        router.replace("/(auth)");
      } else if (inAuthGroup) {
        setIsReady(true);
      } else {
        router.replace("/(auth)");
      }
    }
  }, [isAuthenticated, isLoaded, router, segments]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: "#ffffff" }} />;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: clientPersister }}
      onSuccess={() => console.log("Offline cache restored!")}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <DraxProvider>
            <Slot />
            <StatusBar style="auto" />
          </DraxProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}
