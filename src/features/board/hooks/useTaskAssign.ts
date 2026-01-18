import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../../../api/supabase";

export type Assignee = {
  userId: string;
  name: string;
  email: string;
  initials: string;
};

export const useTaskAssign = (boardId: string) => {
  const queryClient = useQueryClient();

  const {
    data: members,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["task_assignees", boardId],
    queryFn: async () => {
      // Get Board Owner
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select(`owner_id, profiles:owner_id(email, full_name)`)
        .eq("id", boardId)
        .single();

      if (boardError) throw boardError;

      // Get Accepted Members
      const { data: memberData, error: memberError } = await supabase
        .from("board_members")
        .select(`user_id, profiles:user_id(email, full_name)`)
        .eq("board_id", boardId)
        .eq("status", "accepted");

      if (memberError) throw memberError;

      // Helper to format user data
      const formatUser = (id: string, profile: any) => {
        const email = profile?.email || "No Email";
        const name = profile?.full_name || email;
        return {
          userId: id,
          email: email,
          name: name,
          initials: name ? name.substring(0, 2).toUpperCase() : "??",
        };
      };

      // Combine Owner + Members
      const owner = formatUser(boardData.owner_id, boardData.profiles);
      const others = memberData.map((m: any) =>
        formatUser(m.user_id, m.profiles),
      );

      // Remove duplicates
      const all = [owner, ...others].filter(
        (v, i, a) => a.findIndex((v2) => v2.userId === v.userId) === i,
      );

      return all;
    },
    enabled: !!boardId,
  });

  // Realtime Listener
  useEffect(() => {
    if (!boardId) return;

    console.log("🔌 Subscribing to Assignee updates for board:", boardId);

    const channel = supabase
      .channel(`assignees_list:${boardId}`) // Unique channel name
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for INSERT (Accept), UPDATE, DELETE
          schema: "public",
          table: "board_members",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log("👥 Member Status Changed:", payload.eventType);
          // Refetch immediately when someone joins/leaves
          queryClient.invalidateQueries({
            queryKey: ["task_assignees", boardId],
          });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Ready to receive new members.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, queryClient]);

  return { members, isLoading, refetch };
};
