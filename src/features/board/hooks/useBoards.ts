import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";

export type Board = {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
};

export const useBoards = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Get the current User ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
      setIsAuthLoading(false);
    });
  }, []);

  // Fetch Boards
  const query = useQuery({
    queryKey: ["boards", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Board[];
    },
    enabled: !!userId,
  });

  // Realtime Subscription (Already handles DELETE events via event: "*")
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("public:boards")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "boards" },
        (payload) => {
          // This will automatically refetch when a board is deleted
          queryClient.invalidateQueries({ queryKey: ["boards", userId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  return {
    ...query,
    isLoading: isAuthLoading || query.isLoading,
    userId, // <--- EXPORT THIS
  };
};
