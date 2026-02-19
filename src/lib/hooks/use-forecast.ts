"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const CARTON_SIZE = 24;
const SAFETY_BUFFER = 1.05;

export type ForecastItem = {
  drink_id: string;
  drink_name: string;
  image_url: string | null;
  avgMonthlySales: number;
  forecastedUnits: number;
  cartonsToOrder: number;
  historicalSales: { month: string; quantity: number }[];
};

export type ForecastSummary = {
  totalCartons: number;
  totalDrinks: number;
};

export type ForecastData = {
  items: ForecastItem[];
  summary: ForecastSummary;
};

/**
 * Custom rounding for cartons:
 * - Round down if remainder < 5
 * - Round up if remainder >= 5
 */
function roundCartons(units: number): number {
  const remainder = units % CARTON_SIZE;
  if (remainder >= 5) {
    return Math.ceil(units / CARTON_SIZE);
  }
  return Math.floor(units / CARTON_SIZE);
}

/**
 * Calculate weighted average from monthly sales.
 * With 3 months: (50%, 30%, 20%) weighting for most recent to oldest.
 * Falls back to simple average with less data.
 */
function calculateWeightedAverage(monthlyQuantities: number[]): number {
  if (monthlyQuantities.length === 0) return 0;

  // Sort by most recent first (assuming array is already sorted newest to oldest)
  const sorted = [...monthlyQuantities];

  if (sorted.length >= 3) {
    // Use last 3 months with weights: 50%, 30%, 20%
    return sorted[0] * 0.5 + sorted[1] * 0.3 + sorted[2] * 0.2;
  } else if (sorted.length === 2) {
    // 2 months: 60%, 40%
    return sorted[0] * 0.6 + sorted[1] * 0.4;
  } else {
    // 1 month: 100%
    return sorted[0];
  }
}

export function useForecast(forecastMonths: number = 1, includeCurrentMonth: boolean = false) {
  return useQuery({
    queryKey: ["forecast", forecastMonths, includeCurrentMonth],
    queryFn: async (): Promise<ForecastData> => {
      const supabase = createClient();

      // Calculate date range: last 3 months
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const startDate = threeMonthsAgo.toISOString();

      // Build query
      let query = supabase
        .from("sales")
        .select("id, sale_date")
        .gte("sale_date", startDate);

      // Exclude current month if toggle is off
      if (!includeCurrentMonth) {
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.lt("sale_date", startOfCurrentMonth.toISOString());
      }

      const { data: sales, error: salesError } = await query;

      if (salesError) throw salesError;

      if (!sales || sales.length === 0) {
        return { items: [], summary: { totalCartons: 0, totalDrinks: 0 } };
      }

      const saleIds = sales.map((s) => s.id);

      // Get sale line items for these sales
      const { data: lineItems, error: lineError } = await supabase
        .from("sale_line_items")
        .select(`
          drink_id,
          quantity,
          sale:sales!inner(sale_date)
        `)
        .in("sale_id", saleIds);

      if (lineError) throw lineError;

      // Get all drinks for names and images
      const { data: drinks, error: drinksError } = await supabase
        .from("drinks")
        .select("id, name, image_url");

      if (drinksError) throw drinksError;

      const drinkMap = new Map(
        drinks?.map((d) => [d.id, { name: d.name, image_url: d.image_url }]) || []
      );

      // Group sales by drink and month
      type MonthlySales = Map<string, Map<string, number>>; // drink_id -> month -> quantity
      const salesByDrinkAndMonth: MonthlySales = new Map();

      lineItems?.forEach((item) => {
        const drinkId = item.drink_id;
        const saleDate = (item.sale as { sale_date: string }).sale_date;
        const monthKey = saleDate.substring(0, 7); // YYYY-MM

        if (!salesByDrinkAndMonth.has(drinkId)) {
          salesByDrinkAndMonth.set(drinkId, new Map());
        }

        const drinkMonths = salesByDrinkAndMonth.get(drinkId)!;
        drinkMonths.set(monthKey, (drinkMonths.get(monthKey) || 0) + item.quantity);
      });

      // Calculate forecast for each drink
      const forecastItems: ForecastItem[] = [];

      salesByDrinkAndMonth.forEach((monthlyData, drinkId) => {
        const drinkInfo = drinkMap.get(drinkId);
        if (!drinkInfo) return;

        // Sort months newest to oldest
        const sortedMonths = Array.from(monthlyData.entries())
          .sort((a, b) => b[0].localeCompare(a[0]));

        const monthlyQuantities = sortedMonths.map(([, qty]) => qty);
        const historicalSales = sortedMonths.map(([month, quantity]) => ({
          month,
          quantity,
        }));

        const avgMonthlySales = calculateWeightedAverage(monthlyQuantities);
        const forecastedUnits = Math.round(avgMonthlySales * forecastMonths * SAFETY_BUFFER);
        const cartonsToOrder = roundCartons(forecastedUnits);

        forecastItems.push({
          drink_id: drinkId,
          drink_name: drinkInfo.name,
          image_url: drinkInfo.image_url,
          avgMonthlySales: Math.round(avgMonthlySales),
          forecastedUnits,
          cartonsToOrder,
          historicalSales,
        });
      });

      // Sort by cartons to order (descending)
      forecastItems.sort((a, b) => b.cartonsToOrder - a.cartonsToOrder);

      const totalCartons = forecastItems.reduce((sum, item) => sum + item.cartonsToOrder, 0);

      return {
        items: forecastItems,
        summary: {
          totalCartons,
          totalDrinks: forecastItems.length,
        },
      };
    },
  });
}
