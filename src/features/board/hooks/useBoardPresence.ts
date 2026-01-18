import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../api/supabase";

export type BoardUser = {
  userId: string;
  email: string;
  onlineAt: string;
  editingTaskId?: string | null;
};

export const useBoardPresence = (boardId: string) => {
  const [activeUsers, setActiveUsers] = useState<BoardUser[]>([]);
  const channelRef = useRef<any>(null);
  const userRef = useRef<any>(null);

  useEffect(() => {
    if (!boardId) return;

    const setupPresence = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      userRef.current = user;

      // Create channel
      const channel = supabase.channel(`presence:board:${boardId}`, {
        config: { presence: { key: user.id } },
      });
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const newState = channel.presenceState();
          const users: BoardUser[] = [];

          for (const key in newState) {
            const presenceEntries = newState[key] as any[];
            if (presenceEntries.length > 0) {
              users.push(presenceEntries[0]);
            }
          }
          setActiveUsers(users);
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              userId: user.id,
              email: user.email,
              onlineAt: new Date().toISOString(),
              editingTaskId: null,
            });
          }
        });
    };

    setupPresence();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [boardId]);

  const setEditingTask = async (taskId: string | null) => {
    if (channelRef.current && userRef.current) {
      await channelRef.current.track({
        userId: userRef.current.id,
        email: userRef.current.email,
        onlineAt: new Date().toISOString(),
        editingTaskId: taskId,
      });
    }
  };

  return { activeUsers, setEditingTask };
};
