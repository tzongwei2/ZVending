"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Drink, InsertTables, UpdateTables } from "@/types/database";

export function useDrinks() {
  return useQuery({
    queryKey: ["drinks"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("drinks")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Drink[];
    },
  });
}

export function useDrink(id: string) {
  return useQuery({
    queryKey: ["drinks", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("drinks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Drink;
    },
    enabled: !!id,
  });
}

export function useCreateDrink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (drink: InsertTables<"drinks">) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("drinks")
        .insert(drink)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
    },
  });
}

export function useUpdateDrink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<"drinks">;
    }) => {
      const supabase = createClient();
      const { data: result, error } = await supabase
        .from("drinks")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
    },
  });
}

export function useDeleteDrink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("drinks").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
    },
  });
}
