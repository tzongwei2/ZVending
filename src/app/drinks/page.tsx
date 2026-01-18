"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Plus, GlassWater } from "lucide-react";
import { toast } from "sonner";
import {
  useDrinks,
  useCreateDrink,
  useUpdateDrink,
  useDeleteDrink,
} from "@/lib/hooks/use-drinks";
import type { Drink } from "@/types/database";

export default function DrinksPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Drink | null>(null);

  const { data: drinks, isLoading, error } = useDrinks();
  const createDrink = useCreateDrink();
  const updateDrink = useUpdateDrink();
  const deleteDrink = useDeleteDrink();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;

    try {
      await createDrink.mutateAsync({
        name,
        description: description || null,
        image_url: image_url || null,
      });
      toast.success("Drink created successfully", { duration: 1500 });
      setIsCreateOpen(false);
    } catch {
      toast.error("Failed to create drink", { duration: 1500 });
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDrink) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;

    try {
      await updateDrink.mutateAsync({
        id: editingDrink.id,
        data: {
          name,
          description: description || null,
          image_url: image_url || null,
        },
      });
      toast.success("Drink updated successfully", { duration: 1500 });
      setEditingDrink(null);
    } catch {
      toast.error("Failed to update drink", { duration: 1500 });
    }
  };
  
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteDrink.mutateAsync(deleteConfirm.id);
      toast.success("Drink deleted successfully", { duration: 1500 });
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete drink. It may have inventory or sales records.", { duration: 1500 });
    }
  };

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-destructive">Failed to load drinks. Check your Supabase connection.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Drinks" description="Manage your drink products">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Drink
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Drink</DialogTitle>
                <DialogDescription>
                  Create a new drink product.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Drink name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDrink.isPending}>
                  {createDrink.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          Loading...
        </div>
      ) : drinks?.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          No drinks yet. Add your first drink.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {drinks?.map((drink) => (
            <Card key={drink.id} className="overflow-hidden py-0">
              <div className="relative aspect-square bg-muted">
                {drink.image_url ? (
                  <img
                    src={drink.image_url}
                    alt={drink.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <GlassWater className="h-16 w-16 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <ActionsDropdown
                    item={drink}
                    onEdit={setEditingDrink}
                    onDelete={setDeleteConfirm}
                    variant="secondary"
                    size="sm"
                    className="shadow-sm"
                  />
                </div>
              </div>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">{drink.name}</CardTitle>
                {drink.description && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {drink.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDrink} onOpenChange={(open) => !open && setEditingDrink(null)}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Drink</DialogTitle>
              <DialogDescription>
                Update drink information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingDrink?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editingDrink?.description || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-image_url">Image URL</Label>
                <Input
                  id="edit-image_url"
                  name="image_url"
                  defaultValue={editingDrink?.image_url || ""}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingDrink(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateDrink.isPending}>
                {updateDrink.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Drink"
        description={<>Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This action cannot be undone.</>}
        onConfirm={handleDelete}
        isPending={deleteDrink.isPending}
      />
    </div>
  );
}
