"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Drink, InsertTables, UpdateTables } from "@/types/database";
import {
  createFetchAllQuery,
  createFetchOneByIdQuery,
  createInsertMutation,
  createUpdateMutation,
  createDeleteMutation,
} from "./crud-hooks-factory";

export function useDrinks() {
  return useQuery({
    queryKey: ["drinks"],
    queryFn: createFetchAllQuery<Drink>("drinks", { orderBy: "name" }),
  });
}

export function useDrink(id: string) {
  return useQuery({
    queryKey: ["drinks", id],
    queryFn: createFetchOneByIdQuery<Drink>("drinks", id),
    enabled: !!id,
  });
}

export function useCreateDrink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInsertMutation<InsertTables<"drinks">>("drinks"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
    },
  });
}

export function useUpdateDrink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdateMutation<UpdateTables<"drinks">>("drinks"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
    },
  });
}

export function useDeleteDrink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeleteMutation("drinks"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
    },
  });
}
