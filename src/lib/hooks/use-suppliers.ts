"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Supplier, InsertTables, UpdateTables } from "@/types/database";
import {
  createFetchAllQuery,
  createFetchOneByIdQuery,
  createInsertMutation,
  createUpdateMutation,
  createDeleteMutation,
} from "./crud-hooks-factory";

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: createFetchAllQuery<Supplier>("suppliers", { orderBy: "name" }),
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: createFetchOneByIdQuery<Supplier>("suppliers", id),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInsertMutation<InsertTables<"suppliers">>("suppliers"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdateMutation<UpdateTables<"suppliers">>("suppliers"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeleteMutation("suppliers"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}
