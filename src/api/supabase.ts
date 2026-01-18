import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://gtuxojhnrtlxepvurnaq.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dXhvamhucnRseGVwdnVybmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjg4MzMsImV4cCI6MjA4MzkwNDgzM30.dFjw7m_T2NFBzAXfKrkKWLTeD00lirrPG-fWSzvxud8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
