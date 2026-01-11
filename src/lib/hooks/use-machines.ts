"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { VendingMachine, InsertTables, UpdateTables } from "@/types/database";

export function useMachines() {
  return useQuery({
    queryKey: ["machines"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vending_machines")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as VendingMachine[];
    },
  });
}

export function useMachine(id: string) {
  return useQuery({
    queryKey: ["machines", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vending_machines")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as VendingMachine;
    },
    enabled: !!id,
  });
}

export function useCreateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (machine: InsertTables<"vending_machines">) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vending_machines")
        .insert(machine)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });
}

export function useUpdateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<"vending_machines">;
    }) => {
      const supabase = createClient();
      const { data: result, error } = await supabase
        .from("vending_machines")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("vending_machines").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });
}
