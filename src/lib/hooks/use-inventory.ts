"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { InsertTables, UpdateTables } from "@/types/database";

// Drink-Supplier inventory (cost price and quantity)
export type DrinkSupplierWithDetails = {
  id: string;
  drink_id: string;
  supplier_id: string;
  cost_price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  drink: { id: string; name: string; image_url: string | null };
  supplier: { id: string; name: string };
};

export function useDrinkSuppliers() {
  return useQuery({
    queryKey: ["drink_suppliers"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("drink_suppliers")
        .select(`
          *,
          drink:drinks(id, name, image_url),
          supplier:suppliers(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DrinkSupplierWithDetails[];
    },
  });
}

export function useCreateDrinkSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertTables<"drink_suppliers">) => {
      const supabase = createClient();
      const { data: result, error } = await supabase
        .from("drink_suppliers")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drink_suppliers"] });
    },
  });
}

export function useUpdateDrinkSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<"drink_suppliers">;
    }) => {
      const supabase = createClient();
      const { data: result, error } = await supabase
        .from("drink_suppliers")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drink_suppliers"] });
    },
  });
}

export function useDeleteDrinkSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("drink_suppliers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drink_suppliers"] });
    },
  });
}

// Machine-Drink prices (selling prices)
export type MachineDrinkPriceWithDetails = {
  id: string;
  machine_id: string;
  drink_id: string;
  selling_price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  machine: { id: string; name: string };
  drink: { id: string; name: string };
};

export function useMachineDrinkPrices() {
  return useQuery({
    queryKey: ["machine_drink_prices"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("machine_drink_prices")
        .select(`
          *,
          machine:vending_machines(id, name),
          drink:drinks(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MachineDrinkPriceWithDetails[];
    },
  });
}

export function useCreateMachineDrinkPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertTables<"machine_drink_prices">) => {
      const supabase = createClient();
      const { data: result, error } = await supabase
        .from("machine_drink_prices")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine_drink_prices"] });
    },
  });
}

export function useUpdateMachineDrinkPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<"machine_drink_prices">;
    }) => {
      const supabase = createClient();
      const { data: result, error } = await supabase
        .from("machine_drink_prices")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine_drink_prices"] });
    },
  });
}

export function useDeleteMachineDrinkPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("machine_drink_prices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine_drink_prices"] });
    },
  });
}
