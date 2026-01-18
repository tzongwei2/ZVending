"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Expenditure, InsertTables, UpdateTables } from "@/types/database";

export type ExpenditureWithRelations = Expenditure & {
  machine: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
};

export function useExpenditures() {
  return useQuery({
    queryKey: ["expenditures"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenditures")
        .select(`
          *,
          machine:vending_machines(id, name),
          supplier:suppliers(id, name)
        `)
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      return data as ExpenditureWithRelations[];
    },
  });
}

export function useExpenditure(id: string) {
  return useQuery({
    queryKey: ["expenditures", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenditures")
        .select(`
          *,
          machine:vending_machines(id, name),
          supplier:suppliers(id, name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as ExpenditureWithRelations;
    },
    enabled: !!id,
  });
}

export function useCreateExpenditure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenditure: InsertTables<"expenditures">) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenditures")
        .insert(expenditure)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
    },
  });
}

export function useUpdateExpenditure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<"expenditures">;
    }) => {
      const supabase = createClient();
      const { data: result, error } = await supabase
        .from("expenditures")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
    },
  });
}

export function useDeleteExpenditure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("expenditures")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
    },
  });
}
