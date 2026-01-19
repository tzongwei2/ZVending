"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OperationalCost, InsertTables, UpdateTables } from "@/types/database";
import {
  createFetchAllQuery,
  createInsertMutation,
  createUpdateMutation,
  createDeleteMutation,
} from "./crud-hooks-factory";

export type OperationalCostWithMachine = OperationalCost & {
  machine: { id: string; name: string } | null;
};

export function useOperationalCosts() {
  return useQuery({
    queryKey: ["operational_costs"],
    queryFn: createFetchAllQuery<OperationalCostWithMachine>("operational_costs", {
      select: `
        *,
        machine:vending_machines(id, name)
      `,
      orderBy: "period_start",
      ascending: false,
    }),
  });
}

export function useCreateOperationalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInsertMutation<InsertTables<"operational_costs">>("operational_costs"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_costs"] });
    },
  });
}

export function useUpdateOperationalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdateMutation<UpdateTables<"operational_costs">>("operational_costs"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_costs"] });
    },
  });
}

export function useDeleteOperationalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeleteMutation("operational_costs"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_costs"] });
    },
  });
}
