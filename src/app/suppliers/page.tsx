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
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/lib/hooks/use-suppliers";
import type { Supplier } from "@/types/database";

export default function SuppliersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);

  const { data: suppliers, isLoading, error } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const contact_info = formData.get("contact_info") as string;

    try {
      await createSupplier.mutateAsync({ name, contact_info: contact_info || null });
      toast.success("Supplier created successfully");
      setIsCreateOpen(false);
    } catch {
      toast.error("Failed to create supplier");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSupplier) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const contact_info = formData.get("contact_info") as string;

    try {
      await updateSupplier.mutateAsync({
        id: editingSupplier.id,
        data: { name, contact_info: contact_info || null },
      });
      toast.success("Supplier updated successfully");
      setEditingSupplier(null);
    } catch {
      toast.error("Failed to update supplier");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteSupplier.mutateAsync(deleteConfirm.id);
      toast.success("Supplier deleted successfully");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete supplier. It may be linked to drinks.");
    }
  };

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-destructive">Failed to load suppliers. Check your Supabase connection.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Manage your drink suppliers"
      >
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Supplier</DialogTitle>
                <DialogDescription>
                  Create a new supplier for your drinks.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Supplier name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact_info">Contact Info</Label>
                  <Input
                    id="contact_info"
                    name="contact_info"
                    placeholder="Phone, email, or address"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSupplier.isPending}>
                  {createSupplier.isPending ? "Creating..." : "Create"}
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
              <TableHead>Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : suppliers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No suppliers yet. Add your first supplier.
                </TableCell>
              </TableRow>
            ) : (
              suppliers?.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_info || "-"}</TableCell>
                  <TableCell>
                    {new Date(supplier.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ActionsDropdown
                      item={supplier}
                      onEdit={setEditingSupplier}
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
      <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>
                Update supplier information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingSupplier?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contact_info">Contact Info</Label>
                <Input
                  id="edit-contact_info"
                  name="contact_info"
                  defaultValue={editingSupplier?.contact_info || ""}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingSupplier(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSupplier.isPending}>
                {updateSupplier.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Supplier"
        description={<>Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This action cannot be undone.</>}
        onConfirm={handleDelete}
        isPending={deleteSupplier.isPending}
      />
    </div>
  );
}
