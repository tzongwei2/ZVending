"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Starting cash balance as of Jan 2026, migrated from excel
const STARTING_CASH = 434.22 ;// plus feiyang 144.1 which is not recorded cuz did not collect feiyang sales data
 
export type MonthlySummary = {
  month: string;
  revenue: number;
  cost: number;
  gross_profit: number;
};

export type DashboardStats = {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  operationalCosts: number;
  totalDrinksSold: number;
};

export type MachineProfitData = {
  machine_id: string;
  machine_name: string;
  revenue: number;
  profit: number;
};

export function useMonthlySales(machineId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["monthly_sales", machineId, startDate, endDate],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("sales")
        .select("sale_date, total_revenue, total_cost, total_profit, machine_id");

      if (machineId) {
        query = query.eq("machine_id", machineId);
      }

      if (startDate) {
        query = query.gte("sale_date", startDate);
      }

      if (endDate) {
        query = query.lte("sale_date", endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by month
      const monthlyData: Record<string, MonthlySummary> = {};

      data?.forEach((sale) => {
        const monthKey = sale.sale_date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            revenue: 0,
            cost: 0,
            gross_profit: 0,
          };
        }
        monthlyData[monthKey].revenue += sale.total_revenue;
        monthlyData[monthKey].cost += sale.total_cost;
        monthlyData[monthKey].gross_profit += sale.total_profit;
      });

      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    },
  });
}

export function useDashboardStats(machineId?: string, month?: string) {
  return useQuery({
    queryKey: ["dashboard_stats", machineId, month],
    queryFn: async () => {
      const supabase = createClient();
      const isAllTime = month === "all";

      // Get month bounds - use provided month or current month (skip for "all")
      let startOfMonth: string | undefined;
      let endOfMonth: string | undefined;

      if (!isAllTime) {
        if (month) {
          // month is in YYYY-MM format
          const [year, monthNum] = month.split("-").map(Number);
          startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1)).toISOString();
          endOfMonth = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59)).toISOString();
        } else {
          const now = new Date();
          startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
          endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)).toISOString();
        }
      }

      // Get sales (filter by date only if not "all")
      let salesQuery = supabase
        .from("sales")
        .select("id, total_revenue, total_cost, total_profit");

      if (!isAllTime && startOfMonth && endOfMonth) {
        salesQuery = salesQuery.gte("sale_date", startOfMonth).lte("sale_date", endOfMonth);
      }

      if (machineId) {
        salesQuery = salesQuery.eq("machine_id", machineId);
      }

      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Get total drinks sold from sale_line_items for these sales
      const saleIds = salesData?.map((s) => s.id) || [];
      let totalDrinksSold = 0;

      if (saleIds.length > 0) {
        const { data: lineItems, error: lineError } = await supabase
          .from("sale_line_items")
          .select("quantity")
          .in("sale_id", saleIds);

        if (lineError) throw lineError;
        totalDrinksSold = lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      }

      // Get operational costs (filter by date only if not "all")
      let costsQuery = supabase
        .from("operational_costs")
        .select("amount");

      if (!isAllTime && startOfMonth && endOfMonth) {
        costsQuery = costsQuery.lte("period_start", endOfMonth).gte("period_end", startOfMonth);
      }

      if (machineId) {
        costsQuery = costsQuery.or(`machine_id.eq.${machineId},machine_id.is.null`);
      }

      const { data: costsData, error: costsError } = await costsQuery;
      if (costsError) throw costsError;

      // Calculate totals
      const totalRevenue = salesData?.reduce((sum, s) => sum + s.total_revenue, 0) || 0;
      const totalCost = salesData?.reduce((sum, s) => sum + s.total_cost, 0) || 0;
      const grossProfit = salesData?.reduce((sum, s) => sum + s.total_profit, 0) || 0;
      const operationalCosts = costsData?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const netProfit = grossProfit - operationalCosts;

      return {
        totalRevenue,
        totalCost,
        grossProfit,
        netProfit,
        operationalCosts,
        totalDrinksSold,
      } as DashboardStats;
    },
  });
}

export type TopDrink = {
  drink_id: string;
  drink_name: string;
  total_quantity: number;
  total_revenue: number;
};

export function useTopDrinks(machineId?: string, limit: number = 5, month?: string) {
  return useQuery({
    queryKey: ["top_drinks", machineId, limit, month],
    queryFn: async () => {
      const supabase = createClient();
      const isAllTime = month === "all";

      // Get month bounds (skip for "all")
      let startOfMonth: string | undefined;
      let endOfMonth: string | undefined;

      if (!isAllTime) {
        if (month) {
          const [year, monthNum] = month.split("-").map(Number);
          startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1)).toISOString();
          endOfMonth = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59)).toISOString();
        } else {
          const now = new Date();
          startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
          endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)).toISOString();
        }
      }

      // Get sales filtered by machine and/or month
      let salesQuery = supabase
        .from("sales")
        .select("id");

      if (!isAllTime && startOfMonth && endOfMonth) {
        salesQuery = salesQuery.gte("sale_date", startOfMonth).lte("sale_date", endOfMonth);
      }

      if (machineId) {
        salesQuery = salesQuery.eq("machine_id", machineId);
      }

      const { data: sales, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      const saleIds = sales?.map((s) => s.id) || [];
      if (saleIds.length === 0) return [];

      // Get sale line items
      const { data, error } = await supabase
        .from("sale_line_items")
        .select(`
          drink_id,
          quantity,
          line_revenue,
          drink:drinks(name)
        `)
        .in("sale_id", saleIds);

      if (error) throw error;

      // Aggregate by drink
      const drinkTotals: Record<string, TopDrink> = {};

      data?.forEach((item) => {
        const drinkId = item.drink_id;
        if (!drinkTotals[drinkId]) {
          drinkTotals[drinkId] = {
            drink_id: drinkId,
            drink_name: (item.drink as { name: string }).name,
            total_quantity: 0,
            total_revenue: 0,
          };
        }
        drinkTotals[drinkId].total_quantity += item.quantity;
        drinkTotals[drinkId].total_revenue += item.line_revenue;
      });

      return Object.values(drinkTotals)
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, limit);
    },
  });
}

export function useMachineProfitComparison(month?: string) {
  return useQuery({
    queryKey: ["machine_profit_comparison", month],
    queryFn: async () => {
      const supabase = createClient();
      const isAllTime = month === "all";

      // Get month bounds (skip for "all")
      let startOfMonth: string | undefined;
      let endOfMonth: string | undefined;

      if (!isAllTime) {
        if (month) {
          const [year, monthNum] = month.split("-").map(Number);
          startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1)).toISOString();
          endOfMonth = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59)).toISOString();
        } else {
          const now = new Date();
          startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
          endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)).toISOString();
        }
      }

      // Get all machines
      const { data: machines, error: machinesError } = await supabase
        .from("vending_machines")
        .select("id, name");

      if (machinesError) throw machinesError;

      // Get sales (filter by date only if not "all")
      let salesQuery = supabase
        .from("sales")
        .select("machine_id, total_revenue, total_profit");

      if (!isAllTime && startOfMonth && endOfMonth) {
        salesQuery = salesQuery.gte("sale_date", startOfMonth).lte("sale_date", endOfMonth);
      }

      const { data: sales, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Aggregate by machine
      const machineData: Record<string, MachineProfitData> = {};

      // Initialize all machines with 0
      machines?.forEach((machine) => {
        machineData[machine.id] = {
          machine_id: machine.id,
          machine_name: machine.name,
          revenue: 0,
          profit: 0,
        };
      });

      // Add sales data
      sales?.forEach((sale) => {
        if (machineData[sale.machine_id]) {
          machineData[sale.machine_id].revenue += sale.total_revenue;
          machineData[sale.machine_id].profit += sale.total_profit;
        }
      });

      return Object.values(machineData).sort((a, b) => b.profit - a.profit);
    },
  });
}

export type CashflowData = {
  month: string;
  income: number;
  expenses: number;  // Stored as negative for chart display
  monthlyNet: number;
  cumulativeCash: number;
};

export function useCashflow() {
  return useQuery({
    queryKey: ["cashflow"],
    queryFn: async () => {
      const supabase = createClient();

      // Get all sales (revenue = income)
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("sale_date, total_revenue");

      if (salesError) throw salesError;

      // Get all expenditures (handle if table doesn't exist)
      let expenditures: { purchase_date: string; amount: number }[] = [];
      try {
        const { data: expData, error: expError } = await supabase
          .from("expenditures")
          .select("purchase_date, amount");
        if (!expError && expData) {
          expenditures = expData;
        }
      } catch {
        // Expenditures table might not exist yet
      }

      // Get all operational costs
      const { data: operationalCosts, error: opsError } = await supabase
        .from("operational_costs")
        .select("period_start, amount");

      if (opsError) throw opsError;

      // Group by month
      const monthlyData: Record<string, { income: number; expenses: number }> = {};

      // Add income (revenue)
      sales?.forEach((sale) => {
        const monthKey = sale.sale_date.substring(0, 7);
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        monthlyData[monthKey].income += sale.total_revenue;
      });

      // Add expenditures
      expenditures?.forEach((exp) => {
        const monthKey = exp.purchase_date.substring(0, 7);
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        monthlyData[monthKey].expenses += exp.amount;
      });

      // Add operational costs
      operationalCosts?.forEach((cost) => {
        const monthKey = cost.period_start.substring(0, 7);
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        monthlyData[monthKey].expenses += cost.amount;
      });

      // Sort months and calculate cumulative
      const sortedMonths = Object.keys(monthlyData).sort();
      let cumulativeCash = STARTING_CASH;

      const result: CashflowData[] = sortedMonths.map((month) => {
        const data = monthlyData[month];
        const monthlyNet = data.income - data.expenses;
        cumulativeCash += monthlyNet;

        return {
          month,
          income: data.income,
          expenses: -data.expenses,  // Negative for below-zero display
          monthlyNet,
          cumulativeCash,
        };
      });

      return result;
    },
  });
}

export type CashBalanceData = {
  startingCash: number;
  totalRevenue: number;
  totalExpenditures: number;
  currentBalance: number;
};

export function useCashBalance() {
  return useQuery({
    queryKey: ["cash_balance"],
    queryFn: async () => {
      const supabase = createClient();

      // Get total revenue from all sales
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("total_revenue");

      if (salesError) throw salesError;

      const totalRevenue = sales?.reduce((sum, s) => sum + s.total_revenue, 0) || 0;

      // Get total expenditures (handle if table doesn't exist)
      let totalExpenditures = 0;
      try {
        const { data: expenditures, error: expError } = await supabase
          .from("expenditures")
          .select("amount");
        if (!expError && expenditures) {
          totalExpenditures = expenditures.reduce((sum, e) => sum + e.amount, 0);
        }
      } catch {
        // Expenditures table might not exist yet
      }

      // Get total operational costs
      const { data: operationalCosts, error: opsError } = await supabase
        .from("operational_costs")
        .select("amount");

      if (!opsError && operationalCosts) {
        totalExpenditures += operationalCosts.reduce((sum, c) => sum + c.amount, 0);
      }

      // Calculate current balance
      const currentBalance = STARTING_CASH + totalRevenue - totalExpenditures;

      return {
        startingCash: STARTING_CASH,
        totalRevenue,
        totalExpenditures,
        currentBalance,
      } as CashBalanceData;
    },
  });
}
