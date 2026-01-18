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
import { Badge } from "@/components/ui/badge";
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useMachines } from "@/lib/hooks/use-machines";
import {
  useOperationalCosts,
  useCreateOperationalCost,
  useUpdateOperationalCost,
  useDeleteOperationalCost,
  type OperationalCostWithMachine,
} from "@/lib/hooks/use-costs";

const costTypeLabels = {
  rental: "Rental",
  maintenance: "Maintenance",
  utilities: "Utilities",
  other: "Other",
};

const costTypeColors = {
  rental: "bg-blue-100 text-blue-800",
  maintenance: "bg-orange-100 text-orange-800",
  utilities: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
};

export default function CostsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<OperationalCostWithMachine | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<OperationalCostWithMachine | null>(null);

  const { data: costs, isLoading } = useOperationalCosts();
  const { data: machines } = useMachines();
  const createCost = useCreateOperationalCost();
  const updateCost = useUpdateOperationalCost();
  const deleteCost = useDeleteOperationalCost();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const machineId = formData.get("machine_id") as string;

    try {
      await createCost.mutateAsync({
        machine_id: machineId === "all" ? null : machineId,
        cost_type: formData.get("cost_type") as "rental" | "maintenance" | "utilities" | "other",
        description: (formData.get("description") as string) || null,
        amount: parseFloat(formData.get("amount") as string),
        period_start: formData.get("period_start") as string,
        period_end: formData.get("period_end") as string,
      });
      toast.success("Cost added successfully");
      setIsCreateOpen(false);
    } catch {
      toast.error("Failed to add cost");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const formData = new FormData(e.currentTarget);
    const machineId = formData.get("machine_id") as string;

    try {
      await updateCost.mutateAsync({
        id: editing.id,
        data: {
          machine_id: machineId === "all" ? null : machineId,
          cost_type: formData.get("cost_type") as "rental" | "maintenance" | "utilities" | "other",
          description: (formData.get("description") as string) || null,
          amount: parseFloat(formData.get("amount") as string),
          period_start: formData.get("period_start") as string,
          period_end: formData.get("period_end") as string,
        },
      });
      toast.success("Cost updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCost.mutateAsync(deleteConfirm.id);
      toast.success("Cost deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const formatDateRange = (start: string, end: string) => {
    return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
  };

  return (
    <div>
      <PageHeader
        title="Operational Costs"
        description="Track rental, maintenance, and other operating expenses"
      >
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Cost
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Operational Cost</DialogTitle>
                <DialogDescription>
                  Record a business expense for a specific period.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Machine (optional)</Label>
                  <Select name="machine_id" defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="All machines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Machines (Company-wide)</SelectItem>
                      {machines?.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Cost Type</Label>
                  <Select name="cost_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rental">Rental</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Optional notes"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="period_start">Period Start</Label>
                    <Input
                      id="period_start"
                      name="period_start"
                      type="date"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="period_end">Period End</Label>
                    <Input
                      id="period_end"
                      name="period_end"
                      type="date"
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCost.isPending}>
                  {createCost.isPending ? "Adding..." : "Add Cost"}
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
              <TableHead>Type</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
            ) : costs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No operational costs recorded.
                </TableCell>
              </TableRow>
            ) : (
              costs?.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={costTypeColors[cost.cost_type]}
                    >
                      {costTypeLabels[cost.cost_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cost.machine?.name || "All Machines"}
                  </TableCell>
                  <TableCell>{cost.description || "-"}</TableCell>
                  <TableCell>
                    {formatDateRange(cost.period_start, cost.period_end)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${cost.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <ActionsDropdown
                      item={cost}
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
              <DialogTitle>Edit Cost</DialogTitle>
              <DialogDescription>Update operational cost details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Machine</Label>
                <Select name="machine_id" defaultValue={editing?.machine_id || "all"}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="grid gap-2">
                <Label>Cost Type</Label>
                <Select name="cost_type" defaultValue={editing?.cost_type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rental">Rental</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editing?.description || ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-period_start">Period Start</Label>
                  <Input
                    id="edit-period_start"
                    name="period_start"
                    type="date"
                    defaultValue={editing?.period_start}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-period_end">Period End</Label>
                  <Input
                    id="edit-period_end"
                    name="period_end"
                    type="date"
                    defaultValue={editing?.period_end}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCost.isPending}>
                {updateCost.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Cost"
        description={
          <>
            Are you sure you want to delete this ${deleteConfirm?.amount.toFixed(2)}{" "}
            {deleteConfirm && costTypeLabels[deleteConfirm.cost_type].toLowerCase()} cost?
          </>
        }
        onConfirm={handleDelete}
        isPending={deleteCost.isPending}
      />
    </div>
  );
}
