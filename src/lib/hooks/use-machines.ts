"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VendingMachine, InsertTables, UpdateTables } from "@/types/database";
import {
  createFetchAllQuery,
  createFetchOneByIdQuery,
  createInsertMutation,
  createUpdateMutation,
  createDeleteMutation,
} from "./crud-hooks-factory";

export function useMachines() {
  return useQuery({
    queryKey: ["machines"],
    queryFn: createFetchAllQuery<VendingMachine>("vending_machines", { orderBy: "name" }),
  });
}

export function useMachine(id: string) {
  return useQuery({
    queryKey: ["machines", id],
    queryFn: createFetchOneByIdQuery<VendingMachine>("vending_machines", id),
    enabled: !!id,
  });
}

export function useCreateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInsertMutation<InsertTables<"vending_machines">>("vending_machines"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });
}

export function useUpdateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdateMutation<UpdateTables<"vending_machines">>("vending_machines"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeleteMutation("vending_machines"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });
}
