"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Expenditure, InsertTables, UpdateTables } from "@/types/database";
import {
  createFetchAllQuery,
  createFetchOneByIdQuery,
  createInsertMutation,
  createUpdateMutation,
  createDeleteMutation,
} from "./crud-hooks-factory";

export type ExpenditureWithRelations = Expenditure & {
  machine: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
};

const selectWithRelations = `
  *,
  machine:vending_machines(id, name),
  supplier:suppliers(id, name)
`;

export function useExpenditures() {
  return useQuery({
    queryKey: ["expenditures"],
    queryFn: createFetchAllQuery<ExpenditureWithRelations>("expenditures", {
      select: selectWithRelations,
      orderBy: "purchase_date",
      ascending: false,
    }),
  });
}

export function useExpenditure(id: string) {
  return useQuery({
    queryKey: ["expenditures", id],
    queryFn: createFetchOneByIdQuery<ExpenditureWithRelations>("expenditures", id, {
      select: selectWithRelations,
    }),
    enabled: !!id,
  });
}

export function useCreateExpenditure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInsertMutation<InsertTables<"expenditures">>("expenditures"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
    },
  });
}

export function useUpdateExpenditure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdateMutation<UpdateTables<"expenditures">>("expenditures"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
    },
  });
}

export function useDeleteExpenditure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeleteMutation("expenditures"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
    },
  });
}
