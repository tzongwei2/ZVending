"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type SaleWithDetails = {
  id: string;
  machine_id: string;
  sale_date: string;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  created_at: string;
  machine: { id: string; name: string };
};

export type SaleLineItemWithDetails = {
  id: string;
  sale_id: string;
  drink_id: string;
  quantity: number;
  selling_price_snapshot: number;
  cost_price_snapshot: number;
  line_revenue: number;
  line_cost: number;
  line_profit: number;
  drink: { id: string; name: string };
};

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          machine:vending_machines(id, name)
        `)
        .order("sale_date", { ascending: false });

      if (error) throw error;
      return data as SaleWithDetails[];
    },
  });
}

export function useSaleDetails(saleId: string) {
  return useQuery({
    queryKey: ["sales", saleId, "details"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sale_line_items")
        .select(`
          *,
          drink:drinks(id, name)
        `)
        .eq("sale_id", saleId)
        .order("created_at");

      if (error) throw error;
      return data as SaleLineItemWithDetails[];
    },
    enabled: !!saleId,
  });
}

export type RecordSaleItem = {
  drink_id: string;
  quantity: number;
};

export function useRecordSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      machine_id,
      items,
    }: {
      machine_id: string;
      items: RecordSaleItem[];
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("record_sale", {
        p_machine_id: machine_id,
        p_items: items,
      });

      if (error) throw error;
      return data as string; // Returns sale_id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["drink_suppliers"] });
    },
  });
}

// Get available drinks for a machine (with stock)
export type AvailableDrink = {
  drink_id: string;
  drink_name: string;
  selling_price: number;
  total_stock: number;
};

export function useAvailableDrinks(machineId: string) {
  return useQuery({
    queryKey: ["available_drinks", machineId],
    queryFn: async () => {
      const supabase = createClient();
      // Get drinks available at this machine
      const { data: machineDrinks, error: priceError } = await supabase
        .from("machine_drink_prices")
        .select(`
          drink_id,
          selling_price,
          drink:drinks(name)
        `)
        .eq("machine_id", machineId)
        .eq("is_available", true);

      if (priceError) throw priceError;

      // Get stock for each drink
      const drinkIds = machineDrinks?.map((d) => d.drink_id) || [];
      if (drinkIds.length === 0) return [];

      const { data: stockData, error: stockError } = await supabase
        .from("drink_suppliers")
        .select("drink_id, quantity")
        .in("drink_id", drinkIds);

      if (stockError) throw stockError;

      // Aggregate stock by drink
      const stockByDrink: Record<string, number> = {};
      stockData?.forEach((s) => {
        stockByDrink[s.drink_id] = (stockByDrink[s.drink_id] || 0) + s.quantity;
      });

      return machineDrinks?.map((d) => ({
        drink_id: d.drink_id,
        drink_name: (d.drink as { name: string }).name,
        selling_price: d.selling_price,
        total_stock: stockByDrink[d.drink_id] || 0,
      })) as AvailableDrink[];
    },
    enabled: !!machineId,
  });
}
