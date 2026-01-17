"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { useMachines } from "@/lib/hooks/use-machines";
import {
  useSales,
  useSaleDetails,
  useRecordSale,
  useAvailableDrinks,
  type SaleWithDetails,
  type RecordSaleItem,
} from "@/lib/hooks/use-sales";

type CartItem = {
  drink_id: string;
  drink_name: string;
  selling_price: number;
  quantity: number;
};

export default function SalesPage() {
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<SaleWithDetails | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const { data: sales, isLoading } = useSales();
  const { data: machines } = useMachines();
  const { data: availableDrinks } = useAvailableDrinks(selectedMachine);
  const recordSale = useRecordSale();

  const handleAddToCart = (drinkId: string) => {
    const drink = availableDrinks?.find((d) => d.drink_id === drinkId);
    if (!drink) return;

    const existing = cart.find((c) => c.drink_id === drinkId);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.drink_id === drinkId ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          drink_id: drink.drink_id,
          drink_name: drink.drink_name,
          selling_price: drink.selling_price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (drinkId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((c) => c.drink_id !== drinkId));
    } else {
      setCart(
        cart.map((c) => (c.drink_id === drinkId ? { ...c, quantity } : c))
      );
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.selling_price * item.quantity,
    0
  );

  const handleRecordSale = async () => {
    if (!selectedMachine || cart.length === 0) return;

    const items: RecordSaleItem[] = cart.map((c) => ({
      drink_id: c.drink_id,
      quantity: c.quantity,
    }));

    try {
      await recordSale.mutateAsync({
        machine_id: selectedMachine,
        items,
      });
      toast.success("Sale recorded successfully");
      setCart([]);
      setSelectedMachine("");
      setIsRecordOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to record sale";
      toast.error(message);
    }
  };

  const resetDialog = () => {
    setCart([]);
    setSelectedMachine("");
  };

  return (
    <div>
      <PageHeader title="Sales" description="Record and view sales transactions">
        <Dialog
          open={isRecordOpen}
          onOpenChange={(open) => {
            setIsRecordOpen(open);
            if (!open) resetDialog();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Record Sale</DialogTitle>
              <DialogDescription>
                Select a machine and add drinks to the sale.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Machine</Label>
                <Select value={selectedMachine} onValueChange={(value) => { setSelectedMachine(value); setCart([]); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines
                      ?.filter((m) => m.status === "active")
                      .map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMachine && (
                <>
                  <Separator />
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Select Drinks</Label>
                      {cart.length > 0 && (
                        <span className="text-lg font-bold">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)} drinks · ${cartTotal.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto p-1">
                      {availableDrinks?.length === 0 ? (
                        <p className="text-sm text-muted-foreground col-span-4">
                          No drinks configured for this machine.
                        </p>
                      ) : (
                        availableDrinks?.map((drink) => {
                          const inCart = cart.find((c) => c.drink_id === drink.drink_id);
                          const quantity = inCart?.quantity || 0;
                          return (
                            <div
                              key={drink.drink_id}
                              className={`relative flex flex-col items-center p-2 border rounded-lg transition-colors ${
                                quantity > 0 ? "ring-2 ring-purple-400 bg-purple-100 dark:bg-purple-900/30" : ""
                              } ${drink.total_stock === 0 ? "opacity-50" : ""}`}
                            >
                              <div
                                className="w-full cursor-pointer"
                                onClick={() => drink.total_stock > 0 && handleAddToCart(drink.drink_id)}
                              >
                                <div className="w-16 h-16 mx-auto mb-1 rounded overflow-hidden bg-muted flex items-center justify-center">
                                  {drink.image_url ? (
                                    <img
                                      src={drink.image_url}
                                      alt={drink.drink_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-2xl">🥤</span>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-center line-clamp-2 leading-tight">
                                  {drink.drink_name}
                                </p>
                                <p className="text-xs text-muted-foreground text-center">
                                  ${drink.selling_price.toFixed(2)}
                                </p>
                              </div>
                              {quantity > 0 ? (
                                <div className="flex items-center gap-1 mt-1">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() => handleUpdateQuantity(drink.drink_id, quantity - 1)}
                                  >
                                    <span className="text-sm">-</span>
                                  </Button>
                                  <input
                                    key={`${drink.drink_id}-${quantity}`}
                                    type="number"
                                    min="1"
                                    defaultValue={quantity}
                                    onBlur={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (isNaN(val) || val <= 0) {
                                        handleUpdateQuantity(drink.drink_id, 0);
                                      } else if (val !== quantity) {
                                        handleUpdateQuantity(drink.drink_id, val);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    className="w-10 h-6 text-center text-sm font-medium border rounded bg-background"
                                  />
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() => handleAddToCart(drink.drink_id)}
                                  >
                                    <span className="text-sm">+</span>
                                  </Button>
                                </div>
                              ) : (
                                <div className="h-7 mt-1 flex items-center">
                                  {drink.total_stock <= 5 && drink.total_stock > 0 && (
                                    <span className="text-[10px] text-orange-500">
                                      Low: {drink.total_stock}
                                    </span>
                                  )}
                                  {drink.total_stock === 0 && (
                                    <span className="text-[10px] text-destructive">
                                      Out of stock
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRecordOpen(false);
                  resetDialog();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordSale}
                disabled={!selectedMachine || cart.length === 0 || recordSale.isPending}
              >
                {recordSale.isPending ? "Recording..." : "Record Sale"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sales?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No sales recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              sales?.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {new Date(sale.sale_date).toLocaleString()}
                  </TableCell>
                  <TableCell>{sale.machine.name}</TableCell>
                  <TableCell className="text-right">
                    ${sale.total_revenue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${sale.total_cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${sale.total_profit.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewingSale(sale)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={!!viewingSale} onOpenChange={(open) => !open && setViewingSale(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              {viewingSale && new Date(viewingSale.sale_date).toLocaleString()} at{" "}
              {viewingSale?.machine.name}
            </DialogDescription>
          </DialogHeader>
          <SaleDetailsContent saleId={viewingSale?.id || ""} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingSale(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SaleDetailsContent({ saleId }: { saleId: string }) {
  const { data: lineItems, isLoading } = useSaleDetails(saleId);

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drink</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.drink.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${item.selling_price_snapshot.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${item.cost_price_snapshot.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.line_profit.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
