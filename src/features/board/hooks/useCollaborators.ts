import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Alert } from "react-native";
import { supabase } from "../../../api/supabase";

export const useCollaborators = (boardId: string) => {
  const queryClient = useQueryClient();

  // Fetch Members
  const {
    data: members,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["members", boardId],
    queryFn: async () => {
      console.log("Fetching members for board:", boardId);
      const { data, error } = await supabase
        .from("board_members")
        .select("*, profiles:user_id(email, full_name)")
        .eq("board_id", boardId)
        .eq("status", "accepted");

      if (error) throw error;

      const mapped = data.map((m: any) => ({
        userId: m.user_id,
        email: m.profiles?.email,
        name: m.profiles?.full_name || m.profiles?.email?.split("@")[0],
      }));
      console.log("Members found:", mapped.length);
      return mapped;
    },
    enabled: !!boardId,
    staleTime: 0,
  });

  // Real-Time Subscription
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`members_realtime:${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_members",
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          console.log("👥 Member list changed! Refetching...");
          queryClient.invalidateQueries({ queryKey: ["members", boardId] });
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, queryClient, refetch]);

  // Invite Logic (Keep as is, no changes needed here)
  const inviteUser = useMutation({
    mutationFn: async (email: string) => {
      const { data: users, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (userError || !users) throw new Error("User not found");
      const userIdToInvite = users.id;

      const { error: memberError } = await supabase
        .from("board_members")
        .insert({
          board_id: boardId,
          user_id: userIdToInvite,
          status: "pending",
        });

      if (memberError) {
        if (memberError.code === "23505")
          throw new Error("User already invited");
        throw memberError;
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      await supabase.from("notifications").insert({
        user_id: userIdToInvite,
        type: "INVITE",
        content: `You have been invited to collaborate on a board.`,
        meta_data: { boardId, inviter: currentUser?.email },
      });
    },
    onSuccess: () => Alert.alert("Success", "Invite sent!"),
    onError: (err) => Alert.alert("Error", err.message),
  });

  return { members, isLoading, inviteUser };
};
