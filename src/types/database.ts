export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_info: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_info?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_info?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      drinks: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      vending_machines: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          status: "active" | "inactive" | "maintenance";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          status?: "active" | "inactive" | "maintenance";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string | null;
          status?: "active" | "inactive" | "maintenance";
          created_at?: string;
        };
        Relationships: [];
      };
      drink_suppliers: {
        Row: {
          id: string;
          drink_id: string;
          supplier_id: string;
          cost_price: number;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          drink_id: string;
          supplier_id: string;
          cost_price: number;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          drink_id?: string;
          supplier_id?: string;
          cost_price?: number;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drink_suppliers_drink_id_fkey";
            columns: ["drink_id"];
            referencedRelation: "drinks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "drink_suppliers_supplier_id_fkey";
            columns: ["supplier_id"];
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          }
        ];
      };
      machine_drink_prices: {
        Row: {
          id: string;
          machine_id: string;
          drink_id: string;
          selling_price: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          machine_id: string;
          drink_id: string;
          selling_price: number;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          machine_id?: string;
          drink_id?: string;
          selling_price?: number;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "machine_drink_prices_machine_id_fkey";
            columns: ["machine_id"];
            referencedRelation: "vending_machines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "machine_drink_prices_drink_id_fkey";
            columns: ["drink_id"];
            referencedRelation: "drinks";
            referencedColumns: ["id"];
          }
        ];
      };
      sales: {
        Row: {
          id: string;
          machine_id: string;
          sale_date: string;
          total_revenue: number;
          total_cost: number;
          total_profit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          machine_id: string;
          sale_date?: string;
          total_revenue: number;
          total_cost: number;
          total_profit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          machine_id?: string;
          sale_date?: string;
          total_revenue?: number;
          total_cost?: number;
          total_profit?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_machine_id_fkey";
            columns: ["machine_id"];
            referencedRelation: "vending_machines";
            referencedColumns: ["id"];
          }
        ];
      };
      sale_line_items: {
        Row: {
          id: string;
          sale_id: string;
          drink_id: string;
          drink_supplier_id: string;
          quantity: number;
          selling_price_snapshot: number;
          cost_price_snapshot: number;
          line_revenue: number;
          line_cost: number;
          line_profit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          drink_id: string;
          drink_supplier_id: string;
          quantity: number;
          selling_price_snapshot: number;
          cost_price_snapshot: number;
          line_revenue: number;
          line_cost: number;
          line_profit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          drink_id?: string;
          drink_supplier_id?: string;
          quantity?: number;
          selling_price_snapshot?: number;
          cost_price_snapshot?: number;
          line_revenue?: number;
          line_cost?: number;
          line_profit?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sale_line_items_sale_id_fkey";
            columns: ["sale_id"];
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_line_items_drink_id_fkey";
            columns: ["drink_id"];
            referencedRelation: "drinks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_line_items_drink_supplier_id_fkey";
            columns: ["drink_supplier_id"];
            referencedRelation: "drink_suppliers";
            referencedColumns: ["id"];
          }
        ];
      };
      operational_costs: {
        Row: {
          id: string;
          machine_id: string | null;
          cost_type: "rental" | "maintenance" | "utilities" | "other";
          description: string | null;
          amount: number;
          period_start: string;
          period_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          machine_id?: string | null;
          cost_type: "rental" | "maintenance" | "utilities" | "other";
          description?: string | null;
          amount: number;
          period_start: string;
          period_end: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          machine_id?: string | null;
          cost_type?: "rental" | "maintenance" | "utilities" | "other";
          description?: string | null;
          amount?: number;
          period_start?: string;
          period_end?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_costs_machine_id_fkey";
            columns: ["machine_id"];
            referencedRelation: "vending_machines";
            referencedColumns: ["id"];
          }
        ];
      };
      expenditures: {
        Row: {
          id: string;
          category: "restocking" | "equipment" | "transport" | "misc";
          description: string;
          amount: number;
          purchase_date: string;
          machine_id: string | null;
          supplier_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: "restocking" | "equipment" | "transport" | "misc";
          description: string;
          amount: number;
          purchase_date?: string;
          machine_id?: string | null;
          supplier_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: "restocking" | "equipment" | "transport" | "misc";
          description?: string;
          amount?: number;
          purchase_date?: string;
          machine_id?: string | null;
          supplier_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenditures_machine_id_fkey";
            columns: ["machine_id"];
            referencedRelation: "vending_machines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenditures_supplier_id_fkey";
            columns: ["supplier_id"];
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      record_sale: {
        Args: {
          p_machine_id: string;
          p_items: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      machine_status: "active" | "inactive" | "maintenance";
      cost_type: "rental" | "maintenance" | "utilities" | "other";
      expenditure_category: "restocking" | "equipment" | "transport" | "misc";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Supplier = Tables<"suppliers">;
export type Drink = Tables<"drinks">;
export type VendingMachine = Tables<"vending_machines">;
export type DrinkSupplier = Tables<"drink_suppliers">;
export type MachineDrinkPrice = Tables<"machine_drink_prices">;
export type Sale = Tables<"sales">;
export type SaleLineItem = Tables<"sale_line_items">;
export type OperationalCost = Tables<"operational_costs">;
export type Expenditure = Tables<"expenditures">;
export type Setting = Tables<"settings">;
