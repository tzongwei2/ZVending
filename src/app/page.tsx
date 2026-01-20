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
import { DollarSign, TrendingUp, ShoppingCart, Package, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  ComposedChart,
  Line,
  ReferenceLine,
} from "recharts";
import { useMachines } from "@/lib/hooks/use-machines";
import { useDrinkSuppliers } from "@/lib/hooks/use-inventory";
import {
  useDashboardStats,
  useMonthlySales,
  useTopDrinks,
  useMachineProfitComparison,
  useCashflow,
} from "@/lib/hooks/use-dashboard";

const COLORS = ["#9B7BB8", "#7BC8E8", "#B8A0D0", "#5BA8C8", "#D0B8E0", "#6B9B8B"];

// Generate month options for the last 12 months
function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

export default function DashboardPage() {
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showValues, setShowValues] = useState(false);
  const [showRevealDialog, setShowRevealDialog] = useState(false);

  const handleToggleVisibility = () => {
    if (showValues) {
      setShowValues(false);
    } else {
      setShowRevealDialog(true);
    }
  };

  const handleConfirmReveal = () => {
    setShowValues(true);
    setShowRevealDialog(false);
  };
  
  const machineFilter = selectedMachine === "all" ? undefined : selectedMachine;
  const monthOptions = getMonthOptions();
  const { data: machines } = useMachines();
  // Calculate date range for monthly sales (12 months ending at selected month)
  const getMonthlyDateRange = () => {
    const [year, monthNum] = selectedMonth.split("-").map(Number);
    const endDate = new Date(year, monthNum, 0); // Last day of selected month
    const startDate = new Date(year, monthNum - 12, 1); // 12 months before
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };
  const { startDate, endDate } = getMonthlyDateRange();

  const { data: stats, isLoading: statsLoading } = useDashboardStats(machineFilter, selectedMonth);
  const { data: monthlySales, isLoading: salesLoading } = useMonthlySales(machineFilter, startDate, endDate);
  const { data: topDrinks, isLoading: drinksLoading } = useTopDrinks(machineFilter, 6, selectedMonth);
  const { data: machineProfits, isLoading: profitsLoading } = useMachineProfitComparison(selectedMonth);
  const { data: drinkSuppliers, isLoading: inventoryLoading } = useDrinkSuppliers();
  const { data: cashflow, isLoading: cashflowLoading } = useCashflow();

  // Calculate total inventory value (sum of quantity × cost_price)
  const inventoryValue = drinkSuppliers?.reduce(
    (total, ds) => total + ds.quantity * ds.cost_price,
    0
  ) || 0;

  const MASKED_VALUE = "••••••";

  const formatCurrency = (value: number) => {
    if (!showValues) {
      return MASKED_VALUE;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SGD",
    }).format(value);
  };

  const formatAxisTick = (value: number) => (showValues ? `$${value}` : MASKED_VALUE);
  const formatPercent = (value: string) => (showValues ? value : MASKED_VALUE);

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

  const cashflowChartData = cashflow?.map((cf) => ({
    month: new Date(cf.month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    Income: cf.income,
    Expenses: cf.expenses,
    "Net Cashflow": cf.monthlyNet,
    "Total Cash": cf.cumulativeCash,
  }));

  
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your vending machine business"
      >
        <div className="flex gap-2">
          <Button
            variant={showValues ? "outline" : "secondary"}
            size="icon"
            onClick={handleToggleVisibility}
            title={showValues ? "Hide values" : "Show values"}
            className={!showValues ? "ring-2 ring-offset-2 ring-primary" : ""}
          >
            {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMachine} onValueChange={setSelectedMachine}>
            <SelectTrigger className="w-[180px]">
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
        </div>
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
            <p className="text-xs text-muted-foreground">
              {monthOptions.find((m) => m.value === selectedMonth)?.label}
            </p>
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
            <p className="text-xs text-muted-foreground">
              {monthOptions.find((m) => m.value === selectedMonth)?.label}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventoryLoading ? "..." : formatCurrency(inventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total stock at cost price
            </p>
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
                  <YAxis tickFormatter={formatAxisTick} />
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

      {/* Machine Profit Comparison & Cashflow */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Machine Profit Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {profitsLoading ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : machineProfits && machineProfits.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={machineProfits}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="machine_name" />
                  <YAxis tickFormatter={formatAxisTick} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#054b17be" />
                  <Bar dataKey="profit" name="Profit" fill="#29be35bd" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No machines or sales data yet.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cashflow</CardTitle>
          </CardHeader>
          <CardContent>
            {cashflowLoading ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : cashflowChartData && cashflowChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={cashflowChartData} barGap={-40}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatAxisTick} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" />
                  <Bar dataKey="Income" fill="#2dd4bf" barSize={40} />
                  <Bar dataKey="Expenses" fill="#f472b6" barSize={40} />
                  <Line
                    type="monotone"
                    dataKey="Net Cashflow"
                    stroke="#000"
                    strokeWidth={2}
                    dot={{ fill: "#000", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Total Cash"
                    stroke="#666"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "#666", r: 4, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No cashflow data yet. Record sales and expenditures.
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
                : formatPercent(
                    stats?.totalRevenue
                      ? `${(((stats.grossProfit || 0) / stats.totalRevenue) * 100).toFixed(1)}%`
                      : "0%"
                  )}
            </div>
            <p className="text-xs text-muted-foreground">
              Gross profit / Revenue
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showRevealDialog} onOpenChange={setShowRevealDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reveal financial information?</AlertDialogTitle>
            <AlertDialogDescription>
              This will display all financial values on the dashboard. Are You Sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReveal}>Reveal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
  );
}
