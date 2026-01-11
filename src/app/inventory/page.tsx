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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

function DrinkStockTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DrinkSupplierWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DrinkSupplierWithDetails | null>(null);

  const { data: drinkSuppliers, isLoading } = useDrinkSuppliers();
  const { data: drinks } = useDrinks();
  const { data: suppliers } = useSuppliers();
  const createDrinkSupplier = useCreateDrinkSupplier();
  const updateDrinkSupplier = useUpdateDrinkSupplier();
  const deleteDrinkSupplier = useDeleteDrinkSupplier();

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
          cost_price: parseFloat(formData.get("cost_price") as string),
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

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (quantity < 10) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    return <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
              <TableHead>Drink</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Cost Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : drinkSuppliers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No inventory records. Add drinks from suppliers.
                </TableCell>
              </TableRow>
            ) : (
              drinkSuppliers?.map((ds) => (
                <TableRow key={ds.id}>
                  <TableCell className="font-medium">{ds.drink.name}</TableCell>
                  <TableCell>{ds.supplier.name}</TableCell>
                  <TableCell>${ds.cost_price.toFixed(2)}</TableCell>
                  <TableCell>{ds.quantity}</TableCell>
                  <TableCell>{getStockBadge(ds.quantity)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(ds)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteConfirm(ds)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
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
                <Label htmlFor="edit-cost_price">Cost Price</Label>
                <Input
                  id="edit-cost_price"
                  name="cost_price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.cost_price}
                  required
                />
              </div>
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
    </div>
  );
}

function MachinePricingTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MachineDrinkPriceWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MachineDrinkPriceWithDetails | null>(null);

  const { data: machinePrices, isLoading } = useMachineDrinkPrices();
  const { data: drinks } = useDrinks();
  const { data: machines } = useMachines();
  const createPrice = useCreateMachineDrinkPrice();
  const updatePrice = useUpdateMachineDrinkPrice();
  const deletePrice = useDeleteMachineDrinkPrice();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createPrice.mutateAsync({
        machine_id: formData.get("machine_id") as string,
        drink_id: formData.get("drink_id") as string,
        selling_price: parseFloat(formData.get("selling_price") as string),
        is_available: true,
      });
      toast.success("Price set successfully");
      setIsCreateOpen(false);
    } catch {
      toast.error("Failed. This machine-drink combination may already exist.");
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
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Set Price
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Set Machine Price</DialogTitle>
                <DialogDescription>
                  Set the selling price for a drink at a specific machine.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Machine</Label>
                  <Select name="machine_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Machine</TableHead>
              <TableHead>Drink</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : machinePrices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No prices set. Configure selling prices for machines.
                </TableCell>
              </TableRow>
            ) : (
              machinePrices?.map((mp) => (
                <TableRow key={mp.id}>
                  <TableCell className="font-medium">{mp.machine.name}</TableCell>
                  <TableCell>{mp.drink.name}</TableCell>
                  <TableCell>${mp.selling_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={mp.is_available ? "default" : "secondary"}>
                      {mp.is_available ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(mp)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteConfirm(mp)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
