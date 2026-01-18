import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "../../../api/supabase";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  board_id: string;
  position: number;
  description?: string;
  priority: TaskPriority;

  due_date?: string | null;

  assignee_id?: string | null;
  assignee?: {
    email: string;
    full_name?: string;
  };
};

export const useTasks = (boardId: string) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["tasks", boardId], [boardId]);

  // FETCH TASKS
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:profiles!fk_tasks_assignee ( email, full_name )
        `,
        )
        .eq("board_id", boardId)
        .order("position");

      if (error) throw error;
      return data as Task[];
    },
  });

  // REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`realtime:tasks:${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, queryClient, queryKey]);

  // CREATE TASK
  const createTask = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ ...newTask, board_id: boardId, position: 9999 }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // UPDATE TASK
  const updateTask = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Task>;
    }) => {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(queryKey, (old) => {
          if (!old) return [];
          return old.map((task) =>
            task.id === id ? { ...task, ...updates } : task,
          );
        });
      }

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // DELETE TASK
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    ...query,
    createTask: createTask.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
  };
};
