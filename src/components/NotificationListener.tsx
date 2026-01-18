import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Alert } from "react-native";
import { supabase } from "../api/supabase";

export const NotificationListener = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let channel: any;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log("🔔 Listener active for:", user.id);

      const { data: missed } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (missed && missed.length > 0) {
        missed.forEach((n) => processNotification(n, user.id));
      }

      channel = supabase
        .channel(`global_notifications`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
          },
          (payload) => {
            const newNotif = payload.new as any;
            if (newNotif.user_id === user.id) {
              console.log("🚀 Notification received:", newNotif);
              processNotification(newNotif, user.id);
            }
          },
        )
        .subscribe();
    };

    const processNotification = (notif: any, userId: string) => {
      if (notif.type !== "INVITE") return;

      Alert.alert(
        "Collaboration Request",
        `${notif.meta_data.inviter || "Someone"} invited you to a board!`,
        [
          {
            text: "Reject",
            style: "destructive",
            onPress: async () => {
              console.log("Rejecting invite...");

              await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notif.id);

              const { error } = await supabase
                .from("board_members")
                .delete()
                .eq("board_id", notif.meta_data.boardId)
                .eq("user_id", userId);

              if (error) {
                console.error("❌ Failed to delete member row:", error);
                Alert.alert("Error", "Could not reject invite completely.");
              } else {
                console.log("✅ Invite rejected and cleared.");
              }
            },
          },
          {
            text: "Accept",
            onPress: async () => {
              console.log("Accepting invite...");

              const { error: joinError } = await supabase
                .from("board_members")
                .update({ status: "accepted" })
                .eq("board_id", notif.meta_data.boardId)
                .eq("user_id", userId);

              await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notif.id);

              if (!joinError) {
                Alert.alert("Success", "You joined the board!");
                queryClient.invalidateQueries({ queryKey: ["boards"] });
              } else {
                console.error("Join Error:", joinError);
                Alert.alert("Error", "Could not join.");
              }
            },
          },
        ],
      );
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
};
