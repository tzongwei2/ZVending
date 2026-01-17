"use client";

import React, { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Pencil, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, GlassWater, ChevronRight, ChevronDown, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDrinks } from "@/lib/hooks/use-drinks";
import { useSuppliers } from "@/lib/hooks/use-suppliers";
import { useMachines } from "@/lib/hooks/use-machines";
import {
  useDrinkSuppliers,
  useCreateDrinkSupplier,
  useUpdateDrinkSupplier,
  useDeleteDrinkSupplier,
  useMachineDrinkPrices,
  useCreateMachineDrinkPrice,
  useUpdateMachineDrinkPrice,
  useDeleteMachineDrinkPrice,
  type DrinkSupplierWithDetails,
  type MachineDrinkPriceWithDetails,
} from "@/lib/hooks/use-inventory";

export default function InventoryPage() {
  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Manage drink stock and machine pricing"
      />

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Drink Stock</TabsTrigger>
          <TabsTrigger value="pricing">Machine Pricing</TabsTrigger>
        </TabsList>
        <TabsContent value="stock">
          <DrinkStockTab />
        </TabsContent>
        <TabsContent value="pricing">
          <MachinePricingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type SortField = "drink" | "quantity";
type SortDirection = "asc" | "desc";

interface GroupedDrink {
  drink: DrinkSupplierWithDetails["drink"];
  totalQuantity: number;
  suppliers: DrinkSupplierWithDetails[];
}

function DrinkStockTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DrinkSupplierWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DrinkSupplierWithDetails | null>(null);
  const [restocking, setRestocking] = useState<DrinkSupplierWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("drink");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedDrinks, setExpandedDrinks] = useState<Set<string>>(new Set());

  const { data: drinkSuppliers, isLoading } = useDrinkSuppliers();
  const { data: drinks } = useDrinks();
  const { data: suppliers } = useSuppliers();
  const createDrinkSupplier = useCreateDrinkSupplier();
  const updateDrinkSupplier = useUpdateDrinkSupplier();
  const deleteDrinkSupplier = useDeleteDrinkSupplier();

  // Group drinks and aggregate quantities
  const groupedDrinks: GroupedDrink[] = (() => {
    if (!drinkSuppliers) return [];

    const drinkMap = new Map<string, GroupedDrink>();

    drinkSuppliers.forEach((ds) => {
      const existing = drinkMap.get(ds.drink_id);
      if (existing) {
        existing.totalQuantity += ds.quantity;
        existing.suppliers.push(ds);
      } else {
        drinkMap.set(ds.drink_id, {
          drink: ds.drink,
          totalQuantity: ds.quantity,
          suppliers: [ds],
        });
      }
    });

    return Array.from(drinkMap.values());
  })();

  // Filter and sort grouped data
  const filteredAndSortedData = groupedDrinks
    .filter((group) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        group.drink.name.toLowerCase().includes(query) ||
        group.suppliers.some((s) => s.supplier.name.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "drink":
          comparison = a.drink.name.localeCompare(b.drink.name);
          break;
        case "quantity":
          comparison = a.totalQuantity - b.totalQuantity;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />;
    return sortDirection === "asc"
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  const toggleExpanded = (drinkId: string) => {
    setExpandedDrinks((prev) => {
      const next = new Set(prev);
      if (next.has(drinkId)) {
        next.delete(drinkId);
      } else {
        next.add(drinkId);
      }
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createDrinkSupplier.mutateAsync({
        drink_id: formData.get("drink_id") as string,
        supplier_id: formData.get("supplier_id") as string,
        cost_price: parseFloat(formData.get("cost_price") as string),
        quantity: parseInt(formData.get("quantity") as string),
      });
      toast.success("Inventory record created");
      setIsCreateOpen(false);
    } catch {
      toast.error("Failed to create. This drink-supplier combination may already exist.");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const formData = new FormData(e.currentTarget);

    try {
      await updateDrinkSupplier.mutateAsync({
        id: editing.id,
        data: {
          quantity: parseInt(formData.get("quantity") as string),
        },
      });
      toast.success("Inventory updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDrinkSupplier.mutateAsync(deleteConfirm.id);
      toast.success("Inventory record deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete. This may be linked to sales records.");
    }
  };

  const handleRestock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!restocking) return;
    const formData = new FormData(e.currentTarget);
    const addQuantity = parseInt(formData.get("quantity") as string);

    try {
      await updateDrinkSupplier.mutateAsync({
        id: restocking.id,
        data: {
          quantity: restocking.quantity + addQuantity,
        },
      });
      toast.success(`Added ${addQuantity} units to stock`);
      setRestocking(null);
    } catch {
      toast.error("Failed to restock");
    }
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (quantity < 10) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    return <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by drink or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Drink Stock</DialogTitle>
                <DialogDescription>
                  Link a drink to a supplier with cost price and quantity.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Drink</Label>
                  <Select name="drink_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select drink" />
                    </SelectTrigger>
                    <SelectContent>
                      {drinks?.map((drink) => (
                        <SelectItem key={drink.id} value={drink.id}>
                          {drink.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Supplier</Label>
                  <Select name="supplier_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cost_price">Cost Price</Label>
                  <Input
                    id="cost_price"
                    name="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    defaultValue="0"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDrinkSupplier.isPending}>
                  {createDrinkSupplier.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[60px]">Image</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 px-2 -ml-2 font-medium"
                  onClick={() => handleSort("drink")}
                >
                  Drink
                  <SortIcon field="drink" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 px-2 -ml-2 font-medium"
                  onClick={() => handleSort("quantity")}
                >
                  Total Qty
                  <SortIcon field="quantity" />
                </Button>
              </TableHead>
              <TableHead>Suppliers</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredAndSortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {searchQuery ? "No results found." : "No inventory records. Add drinks from suppliers."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedData.map((group) => {
                const isExpanded = expandedDrinks.has(group.drink.id);
                return (
                  <React.Fragment key={group.drink.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpanded(group.drink.id)}
                    >
                      <TableCell className="w-[40px]">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {group.drink.image_url ? (
                          <img
                            src={group.drink.image_url}
                            alt={group.drink.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <GlassWater className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{group.drink.name}</TableCell>
                      <TableCell className="font-semibold">{group.totalQuantity}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {group.suppliers.length} supplier{group.suppliers.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell>{getStockBadge(group.totalQuantity)}</TableCell>
                    </TableRow>
                    {isExpanded && group.suppliers.map((ds) => (
                      <TableRow key={ds.id} className="bg-muted/30">
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="pl-8 text-muted-foreground">
                          {ds.supplier.name}
                        </TableCell>
                        <TableCell>{ds.quantity}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          @ ${ds.cost_price.toFixed(2)} each
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRestocking(ds); }}>
                                <PackagePlus className="mr-2 h-4 w-4" />
                                Restock
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(ds); }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(ds); }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Stock</DialogTitle>
              <DialogDescription>
                Update {editing?.drink.name} from {editing?.supplier.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  defaultValue={editing?.quantity}
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Cost price: ${editing?.cost_price.toFixed(2)} (not editable)
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateDrinkSupplier.isPending}>
                {updateDrinkSupplier.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stock Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteConfirm?.drink.name} from {deleteConfirm?.supplier.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteDrinkSupplier.isPending}>
              {deleteDrinkSupplier.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={!!restocking} onOpenChange={(open) => !open && setRestocking(null)}>
        <DialogContent>
          <form onSubmit={handleRestock}>
            <DialogHeader>
              <DialogTitle>Restock from Supplier</DialogTitle>
              <DialogDescription>
                Add more {restocking?.drink.name} from {restocking?.supplier.name} (@ ${restocking?.cost_price.toFixed(2)} each)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="restock-quantity">Quantity to Add</Label>
                <Input
                  id="restock-quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  autoFocus
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Current stock: {restocking?.quantity} units
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRestocking(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateDrinkSupplier.isPending}>
                {updateDrinkSupplier.isPending ? "Adding..." : "Add Stock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MachinePricingTab() {
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MachineDrinkPriceWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MachineDrinkPriceWithDetails | null>(null);

  const { data: machinePrices, isLoading } = useMachineDrinkPrices();
  const { data: drinks } = useDrinks();
  const { data: machines } = useMachines();
  const createPrice = useCreateMachineDrinkPrice();
  const updatePrice = useUpdateMachineDrinkPrice();
  const deletePrice = useDeleteMachineDrinkPrice();

  const filteredPrices = machinePrices?.filter(
    (mp) => mp.machine_id === selectedMachine
  );

  const selectedMachineData = machines?.find((m) => m.id === selectedMachine);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createPrice.mutateAsync({
        machine_id: selectedMachine,
        drink_id: formData.get("drink_id") as string,
        selling_price: parseFloat(formData.get("selling_price") as string),
        is_available: true,
      });
      toast.success("Price set successfully");
      setIsCreateOpen(false);
    } catch {
      toast.error("Failed. This drink may already have a price set for this machine.");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const formData = new FormData(e.currentTarget);

    try {
      await updatePrice.mutateAsync({
        id: editing.id,
        data: {
          selling_price: parseFloat(formData.get("selling_price") as string),
          is_available: formData.get("is_available") === "true",
        },
      });
      toast.success("Price updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deletePrice.mutateAsync(deleteConfirm.id);
      toast.success("Price deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">Select Machine:</Label>
          <Select value={selectedMachine} onValueChange={setSelectedMachine}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Choose a machine to manage pricing" />
            </SelectTrigger>
            <SelectContent>
              {machines?.map((machine) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedMachine && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Drink Price
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Set Drink Price</DialogTitle>
                  <DialogDescription>
                    Set the selling price for a drink at {selectedMachineData?.name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Drink</Label>
                    <Select name="drink_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select drink" />
                      </SelectTrigger>
                      <SelectContent>
                        {drinks?.map((drink) => (
                          <SelectItem key={drink.id} value={drink.id}>
                            {drink.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="selling_price">Selling Price</Label>
                    <Input
                      id="selling_price"
                      name="selling_price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPrice.isPending}>
                    {createPrice.isPending ? "Setting..." : "Set Price"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!selectedMachine ? (
        <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
          <p className="text-muted-foreground">
            Select a machine above to view and manage drink prices.
          </p>
        </div>
      ) : (
        /* Vending Machine Planogram - styled like reference image */
        <div className="flex justify-center">
          <div className="relative w-[420px]">
            {/* Machine Frame */}
            <div className="bg-white rounded-t-3xl rounded-b-xl shadow-2xl overflow-hidden border-2 border-slate-300">
              {/* Top Frame */}
              <div className="bg-slate-200 h-4 rounded-t-3xl" />

              {/* Glass Display Section */}
              <div className="mx-3 mt-2 mb-3">
                {/* Glass Panel with Reflection */}
                <div className="relative bg-gradient-to-br from-sky-200 via-sky-100 to-sky-50 rounded-lg border-4 border-slate-400 overflow-hidden">
                  {/* Glass Reflection Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-4 left-4 w-32 h-1 bg-white/50 rounded-full transform -rotate-45 pointer-events-none" />
                  <div className="absolute top-8 left-8 w-20 h-0.5 bg-white/30 rounded-full transform -rotate-45 pointer-events-none" />

                  {isLoading ? (
                    <div className="flex h-[320px] items-center justify-center text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <div className="p-3 space-y-3 min-h-[320px]">
                      {/* Organize drinks into rows (shelves) */}
                      {(() => {
                        const numRows = 3;
                        const allItems = [...(filteredPrices || [])];
                        // Calculate items per row to fit all drinks in exactly 3 rows
                        const itemsPerRow = Math.max(5, Math.ceil(allItems.length / numRows));
                        const rows: (MachineDrinkPriceWithDetails | null)[][] = [];

                        // Create exactly 3 rows of drinks
                        for (let i = 0; i < numRows; i++) {
                          const startIdx = i * itemsPerRow;
                          rows.push(allItems.slice(startIdx, startIdx + itemsPerRow));
                        }

                        return rows.map((row, rowIndex) => (
                          <div key={rowIndex} className="relative">
                            {/* Shelf */}
                            <div
                              className="grid gap-1.5"
                              style={{ gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))` }}
                            >
                              {row.map((mp, colIndex) => mp && (
                                <div
                                  key={mp.id}
                                  className={cn(
                                    "group relative cursor-pointer transition-all hover:scale-105 hover:z-10",
                                    !mp.is_available && "opacity-40"
                                  )}
                                  onClick={() => setEditing(mp)}
                                >
                                  {/* Drink Container */}
                                  <div className="flex flex-col items-center w-full">
                                    {/* Drink Image */}
                                    <div className="w-full h-20 flex items-end justify-center">
                                      {mp.drink.image_url ? (
                                        <img
                                          src={mp.drink.image_url}
                                          alt={mp.drink.name}
                                          className="max-h-full max-w-full object-contain drop-shadow-md"
                                        />
                                      ) : (
                                        <div className="w-10 h-18 bg-gradient-to-b from-blue-400 to-blue-600 rounded-sm shadow-md" />
                                      )}
                                    </div>
                                    {/* Price Tag */}
                                    <div className="bg-white/90 rounded px-1.5 py-0.5 mt-1 shadow-sm">
                                      <p className="text-xs font-bold text-primary">
                                        ${mp.selling_price.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                  {/* Unavailable Badge */}
                                  {!mp.is_available && (
                                    <div className="absolute top-0 left-0">
                                      <Badge variant="destructive" className="text-[8px] px-1 py-0">
                                        Off
                                      </Badge>
                                    </div>
                                  )}
                                  {/* Hover Actions */}
                                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="secondary" size="icon" className="h-5 w-5 rounded-full shadow">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(mp); }}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(mp); }}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Remove
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              ))}
                              {/* Empty slots to fill the row */}
                              {Array.from({ length: Math.max(0, itemsPerRow - row.length) }).map((_, i) => (
                                <div key={`empty-${rowIndex}-${i}`} className="h-[94px]" />
                              ))}
                            </div>
                            {/* Shelf Bar */}
                            <div className="h-2 bg-gradient-to-b from-slate-400 to-slate-500 rounded-b shadow-inner mt-1" />
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Lower Body - White Section */}
              <div className="bg-white px-3 pb-3">
                <div className="flex gap-3">
                  {/* Left Panel - Decorative Display */}
                  <div className="flex-1 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg h-24 flex items-center justify-center overflow-hidden shadow-inner border border-amber-600">
                    <div className="text-center">
                      <GlassWater className="h-8 w-8 text-amber-300 mx-auto" />
                      <p className="text-amber-200 text-xs font-semibold mt-1">{selectedMachineData?.name}</p>
                    </div>
                  </div>

                  {/* Right Panel - Controls */}
                  <div className="w-28 space-y-3">
                    {/* Coin Slot */}
                    <div className="bg-slate-700 rounded h-6 flex items-center justify-center">
                      <div className="w-10 h-1.5 bg-slate-500 rounded-full" />
                    </div>
                    {/* Bill Slot */}
                    <div className="bg-slate-700 rounded h-4 flex items-center justify-center">
                      <div className="w-14 h-0.5 bg-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Dispensing Slot */}
                <div className="mt-3 bg-slate-800 rounded-lg h-10 flex items-center justify-center shadow-inner border-2 border-slate-700">
                  <div className="bg-slate-900 w-[90%] h-6 rounded flex items-center justify-center">
                  </div>
                </div>
              </div>
            </div>

            {/* Machine Legs */}
            <div className="flex justify-between px-6">
              <div className="w-8 h-6 bg-slate-400 rounded-b-lg shadow-md" />
              <div className="w-8 h-6 bg-slate-400 rounded-b-lg shadow-md" />
            </div>

            {/* Shadow Effect */}
            <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/20 rounded-full blur-md -z-10" />
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Price</DialogTitle>
              <DialogDescription>
                Update {editing?.drink.name} at {editing?.machine.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-selling_price">Selling Price</Label>
                <Input
                  id="edit-selling_price"
                  name="selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.selling_price}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Available for Sale</Label>
                <Select name="is_available" defaultValue={editing?.is_available ? "true" : "false"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePrice.isPending}>
                {updatePrice.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Price</DialogTitle>
            <DialogDescription>
              Remove {deleteConfirm?.drink.name} from {deleteConfirm?.machine.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePrice.isPending}>
              {deletePrice.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
