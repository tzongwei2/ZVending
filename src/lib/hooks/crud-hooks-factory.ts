import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type TableName = keyof Database["public"]["Tables"];

const supabase = createClient();

export function createFetchAllQuery<T>(
  tableName: TableName,
  options?: {
    select?: string;
    orderBy?: string;
    ascending?: boolean;
  }
) {
  return async (): Promise<T[]> => {
    let query = supabase.from(tableName).select(options?.select ?? "*");

    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.ascending ?? true,
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as T[];
  };
}

export function createFetchOneByIdQuery<T>(
  tableName: TableName,
  id: string,
  options?: {
    select?: string;
  }
) {
  return async (): Promise<T> => {
    const { data, error } = await supabase
      .from(tableName)
      .select(options?.select ?? "*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as T;
  };
}

export function createInsertMutation<TInsert>(tableName: TableName) {
  return async (item: TInsert) => {
    const { data, error } = await supabase
      .from(tableName)
      .insert(item as never)
      .select()
      .single();

    if (error) throw error;
    return data;
  };
}

export function createUpdateMutation<TUpdate>(tableName: TableName) {
  return async ({ id, data }: { id: string; data: TUpdate }) => {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data as never)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  };
}

export function createDeleteMutation(tableName: TableName) {
  return async (id: string) => {
    const { error } = await supabase.from(tableName).delete().eq("id", id);

    if (error) throw error;
  };
}
