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
import { Input } from "@/components/ui/input";
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
import { Plus, Eye, Trash2 } from "lucide-react";
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

  const handleRemoveFromCart = (drinkId: string) => {
    setCart(cart.filter((c) => c.drink_id !== drinkId));
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Sale</DialogTitle>
              <DialogDescription>
                Select a machine and add drinks to the sale.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Machine</Label>
                <Select value={selectedMachine} onValueChange={setSelectedMachine}>
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
                    <Label>Available Drinks</Label>
                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {availableDrinks?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No drinks configured for this machine.
                        </p>
                      ) : (
                        availableDrinks?.map((drink) => (
                          <div
                            key={drink.drink_id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div>
                              <span className="font-medium">{drink.drink_name}</span>
                              <span className="text-muted-foreground ml-2">
                                ${drink.selling_price.toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                (Stock: {drink.total_stock})
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddToCart(drink.drink_id)}
                              disabled={drink.total_stock === 0}
                            >
                              Add
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <>
                      <Separator />
                      <div className="grid gap-2">
                        <Label>Cart</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {cart.map((item) => (
                            <div
                              key={item.drink_id}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <span>{item.drink_name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  ${item.selling_price.toFixed(2)} x
                                </span>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateQuantity(
                                      item.drink_id,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-16"
                                />
                                <span className="font-medium w-20 text-right">
                                  ${(item.selling_price * item.quantity).toFixed(2)}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveFromCart(item.drink_id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end pt-2 border-t">
                          <span className="text-lg font-bold">
                            Total: ${cartTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
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
