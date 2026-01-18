import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";

export function useSupabaseAuth() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsAuthenticated(!!data.session);
      setIsLoaded(true);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
      setIsLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isLoaded, isAuthenticated, session };
}
