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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useMachines } from "@/lib/hooks/use-machines";
import { useSuppliers } from "@/lib/hooks/use-suppliers";
import {
  useExpenditures,
  useCreateExpenditure,
  useUpdateExpenditure,
  useDeleteExpenditure,
  type ExpenditureWithRelations,
} from "@/lib/hooks/use-expenditures";

const categoryLabels = {
  restocking: "Restocking",
  equipment: "Equipment",
  transport: "Transport",
  misc: "Misc",
};

const categoryColors = {
  restocking: "bg-emerald-100 text-emerald-800",
  equipment: "bg-purple-100 text-purple-800",
  transport: "bg-blue-100 text-blue-800",
  misc: "bg-slate-100 text-slate-800",
};

export default function ExpendituresPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenditureWithRelations | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ExpenditureWithRelations | null>(null);

  const { data: expenditures, isLoading } = useExpenditures();
  const { data: machines } = useMachines();
  const { data: suppliers } = useSuppliers();
  const createExpenditure = useCreateExpenditure();
  const updateExpenditure = useUpdateExpenditure();
  const deleteExpenditure = useDeleteExpenditure();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const machineId = formData.get("machine_id") as string;
    const supplierId = formData.get("supplier_id") as string;

    try {
      await createExpenditure.mutateAsync({
        category: formData.get("category") as "restocking" | "equipment" | "transport" | "misc",
        description: formData.get("description") as string,
        amount: parseFloat(formData.get("amount") as string),
        purchase_date: formData.get("purchase_date") as string,
        machine_id: machineId === "none" ? null : machineId,
        supplier_id: supplierId === "none" ? null : supplierId,
        notes: (formData.get("notes") as string) || null,
      });
      toast.success("Expenditure recorded successfully");
      setIsCreateOpen(false);
    } catch {
      toast.error("Failed to record expenditure");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const formData = new FormData(e.currentTarget);
    const machineId = formData.get("machine_id") as string;
    const supplierId = formData.get("supplier_id") as string;

    try {
      await updateExpenditure.mutateAsync({
        id: editing.id,
        data: {
          category: formData.get("category") as "restocking" | "equipment" | "transport" | "misc",
          description: formData.get("description") as string,
          amount: parseFloat(formData.get("amount") as string),
          purchase_date: formData.get("purchase_date") as string,
          machine_id: machineId === "none" ? null : machineId,
          supplier_id: supplierId === "none" ? null : supplierId,
          notes: (formData.get("notes") as string) || null,
        },
      });
      toast.success("Expenditure updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteExpenditure.mutateAsync(deleteConfirm.id);
      toast.success("Expenditure deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <PageHeader
        title="Expenditures"
        description="Track one-time purchases for restocking, equipment, transport, and misc expenses"
      >
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expenditure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Expenditure</DialogTitle>
                <DialogDescription>
                  Record a one-time purchase or expense.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restocking">Restocking</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="misc">Misc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="What was purchased"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    name="purchase_date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Machine (optional)</Label>
                  <Select name="machine_id" defaultValue="none">
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {machines?.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Supplier (optional)</Label>
                  <Select name="supplier_id" defaultValue="none">
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional details"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createExpenditure.isPending}>
                  {createExpenditure.isPending ? "Adding..." : "Add Expenditure"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : expenditures?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No expenditures recorded.
                </TableCell>
              </TableRow>
            ) : (
              expenditures?.map((expenditure) => (
                <TableRow key={expenditure.id}>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={categoryColors[expenditure.category]}
                    >
                      {categoryLabels[expenditure.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>{expenditure.description}</TableCell>
                  <TableCell>{expenditure.machine?.name || "-"}</TableCell>
                  <TableCell>{expenditure.supplier?.name || "-"}</TableCell>
                  <TableCell>
                    {new Date(expenditure.purchase_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${expenditure.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <ActionsDropdown
                      item={expenditure}
                      onEdit={setEditing}
                      onDelete={setDeleteConfirm}
                    />
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
              <DialogTitle>Edit Expenditure</DialogTitle>
              <DialogDescription>Update expenditure details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select name="category" defaultValue={editing?.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restocking">Restocking</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="misc">Misc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editing?.description}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.amount}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-purchase_date">Purchase Date</Label>
                <Input
                  id="edit-purchase_date"
                  name="purchase_date"
                  type="date"
                  defaultValue={editing?.purchase_date}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Machine</Label>
                <Select name="machine_id" defaultValue={editing?.machine_id || "none"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {machines?.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Supplier</Label>
                <Select name="supplier_id" defaultValue={editing?.supplier_id || "none"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={editing?.notes || ""}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateExpenditure.isPending}>
                {updateExpenditure.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Expenditure"
        description={
          <>
            Are you sure you want to delete this ${deleteConfirm?.amount.toFixed(2)}{" "}
            {deleteConfirm && categoryLabels[deleteConfirm.category].toLowerCase()} expense?
          </>
        }
        onConfirm={handleDelete}
        isPending={deleteExpenditure.isPending}
      />
    </div>
  );
}
