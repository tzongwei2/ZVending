"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingUp, Package, ShoppingCart } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMachines } from "@/lib/hooks/use-machines";
import {
  useDashboardStats,
  useMonthlySales,
  useTopDrinks,
} from "@/lib/hooks/use-dashboard";

const COLORS = ["#9B7BB8", "#7BC8E8", "#B8A0D0", "#5BA8C8", "#D0B8E0"];

export default function DashboardPage() {
  const [selectedMachine, setSelectedMachine] = useState<string>("all");

  const machineFilter = selectedMachine === "all" ? undefined : selectedMachine;
  const { data: machines } = useMachines();
  const { data: stats, isLoading: statsLoading } = useDashboardStats(machineFilter);
  const { data: monthlySales, isLoading: salesLoading } = useMonthlySales(machineFilter);
  const { data: topDrinks, isLoading: drinksLoading } = useTopDrinks(machineFilter, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const chartData = monthlySales?.map((m) => ({
    month: new Date(m.month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    Revenue: m.revenue,
    Profit: m.gross_profit,
  }));

  const pieData = topDrinks?.map((d) => ({
    name: d.drink_name,
    value: d.total_quantity,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your vending machine business"
      >
        <Select value={selectedMachine} onValueChange={setSelectedMachine}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by machine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Machines</SelectItem>
            {machines?.map((machine) => (
              <SelectItem key={machine.id} value={machine.id}>
                {machine.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.netProfit || 0) < 0 ? "text-red-600" : "text-green-600"}`}>
              {statsLoading ? "..." : formatCurrency(stats?.netProfit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              After operational costs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drinks Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.totalDrinksSold || 0}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.lowStockCount || 0) > 0 ? "text-yellow-600" : ""}`}>
              {statsLoading ? "..." : stats?.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Items below 10 units</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue & Profit</CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#054b17be" />
                  <Bar dataKey="Profit" fill="#29be35bd" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No sales data yet. Record some sales to see the chart.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Drinks</CardTitle>
          </CardHeader>
          <CardContent>
            {drinksLoading ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : pieData && pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData?.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No sales data yet. Record some sales to see the chart.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? "..." : formatCurrency(stats?.grossProfit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue minus product cost
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? "..." : formatCurrency(stats?.operationalCosts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly operational costs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading
                ? "..."
                : stats?.totalRevenue
                ? `${(((stats.grossProfit || 0) / stats.totalRevenue) * 100).toFixed(1)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              Gross profit / Revenue
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
