"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsertTables, UpdateTables } from "@/types/database";
import {
  createFetchAllQuery,
  createInsertMutation,
  createUpdateMutation,
  createDeleteMutation,
} from "./crud-hooks-factory";

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

const drinkSupplierSelect = `
  *,
  drink:drinks(id, name, image_url),
  supplier:suppliers(id, name)
`;

export function useDrinkSuppliers() {
  return useQuery({
    queryKey: ["drink_suppliers"],
    queryFn: createFetchAllQuery<DrinkSupplierWithDetails>("drink_suppliers", {
      select: drinkSupplierSelect,
      orderBy: "created_at",
      ascending: false,
    }),
  });
}

export function useCreateDrinkSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInsertMutation<InsertTables<"drink_suppliers">>("drink_suppliers"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drink_suppliers"] });
    },
  });
}

export function useUpdateDrinkSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdateMutation<UpdateTables<"drink_suppliers">>("drink_suppliers"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drink_suppliers"] });
    },
  });
}

export function useDeleteDrinkSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeleteMutation("drink_suppliers"),
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
  drink: { id: string; name: string; image_url: string | null };
};

const machineDrinkPriceSelect = `
  *,
  machine:vending_machines(id, name),
  drink:drinks(id, name, image_url)
`;

export function useMachineDrinkPrices() {
  return useQuery({
    queryKey: ["machine_drink_prices"],
    queryFn: createFetchAllQuery<MachineDrinkPriceWithDetails>("machine_drink_prices", {
      select: machineDrinkPriceSelect,
      orderBy: "created_at",
      ascending: false,
    }),
  });
}

export function useCreateMachineDrinkPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInsertMutation<InsertTables<"machine_drink_prices">>("machine_drink_prices"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine_drink_prices"] });
    },
  });
}

export function useUpdateMachineDrinkPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdateMutation<UpdateTables<"machine_drink_prices">>("machine_drink_prices"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine_drink_prices"] });
    },
  });
}

export function useDeleteMachineDrinkPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeleteMutation("machine_drink_prices"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine_drink_prices"] });
    },
  });
}
