"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Package, Search, GlassWater } from "lucide-react";
import { useForecast } from "@/lib/hooks/use-forecast";

export default function ForecastsPage() {
  const [forecastMonths, setForecastMonths] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeCurrentMonth, setIncludeCurrentMonth] = useState(false);

  const { data, isLoading, error } = useForecast(forecastMonths, includeCurrentMonth);

  // Filter items by search query
  const filteredItems = data?.items.filter((item) =>
    item.drink_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Recalculate total cartons for filtered items
  const filteredTotalCartons = filteredItems.reduce(
    (sum, item) => sum + item.cartonsToOrder,
    0
  );

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-destructive">
          Failed to load forecast data. Check your Supabase connection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forecasts"
        description="Predict demand and plan your restocking"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="include-current"
              checked={includeCurrentMonth}
              onCheckedChange={setIncludeCurrentMonth}
            />
            <Label htmlFor="include-current" className="text-sm whitespace-nowrap">
              Month completed
            </Label>
          </div>
          <Select
            value={forecastMonths.toString()}
            onValueChange={(value) => setForecastMonths(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 month ahead</SelectItem>
              <SelectItem value="2">2 months ahead</SelectItem>
              <SelectItem value="3">3 months ahead</SelectItem>
              <SelectItem value="4">4 months ahead</SelectItem>
              <SelectItem value="5">5 months ahead</SelectItem>
              <SelectItem value="6">6 months ahead</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Cartons to Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-4xl font-bold">
                {isLoading ? "..." : filteredTotalCartons}
              </p>
              <p className="text-sm text-muted-foreground">
                for {forecastMonths} month{forecastMonths > 1 ? "s" : ""} supply
                {searchQuery && ` (filtered)`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search drinks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Forecast Table */}
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          Loading...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          {searchQuery
            ? "No drinks match your search."
            : "No sales data found for forecasting."}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Drink</TableHead>
                <TableHead className="text-right">Avg/Month</TableHead>
                <TableHead className="text-right">
                  Forecast ({forecastMonths} mo)
                </TableHead>
                <TableHead className="text-right">Cartons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.drink_id}>
                  <TableCell>
                    <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.drink_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <GlassWater className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.drink_name}</TableCell>
                  <TableCell className="text-right">{item.avgMonthlySales}</TableCell>
                  <TableCell className="text-right">{item.forecastedUnits}</TableCell>
                  <TableCell className="text-right font-bold">
                    {item.cartonsToOrder}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-muted-foreground">
        Forecast based on weighted average of last 3 months sales with 10% buffer.
        1 carton = 24 drinks.
      </p>
    </div>
  );
}
