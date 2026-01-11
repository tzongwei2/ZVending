"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { OperationalCost, InsertTables, UpdateTables } from "@/types/database";

export type OperationalCostWithMachine = OperationalCost & {
  machine: { id: string; name: string } | null;
};

export function useOperationalCosts() {
  return useQuery({
    queryKey: ["operational_costs"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("operational_costs")
        .select(`
          *,
          machine:vending_machines(id, name)
        `)
        .order("period_start", { ascending: false });

      if (error) throw error;
      return data as OperationalCostWithMachine[];
    },
  });
}

export function useCreateOperationalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cost: InsertTables<"operational_costs">) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("operational_costs")
        .insert(cost)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_costs"] });
    },
  });
}

export function useUpdateOperationalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<"operational_costs">;
    }) => {
      const supabase = createClient();
      const { data: result, error } = await supabase
        .from("operational_costs")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_costs"] });
    },
  });
}

export function useDeleteOperationalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("operational_costs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_costs"] });
    },
  });
}
