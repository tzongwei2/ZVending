-- Vending Machine Management System Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE machine_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE cost_type AS ENUM ('rental', 'maintenance', 'utilities', 'other');

-- ============================================
-- CORE TABLES
-- ============================================

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drinks table
CREATE TABLE drinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vending machines table
CREATE TABLE vending_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    status machine_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JUNCTION TABLES
-- ============================================

-- Drink suppliers (many-to-many with cost price and quantity)
CREATE TABLE drink_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drink_id UUID NOT NULL REFERENCES drinks(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    cost_price DECIMAL(10, 2) NOT NULL CHECK (cost_price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(drink_id, supplier_id)
);

-- Machine drink prices (selling price per drink per machine)
CREATE TABLE machine_drink_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES vending_machines(id) ON DELETE CASCADE,
    drink_id UUID NOT NULL REFERENCES drinks(id) ON DELETE CASCADE,
    selling_price DECIMAL(10, 2) NOT NULL CHECK (selling_price >= 0),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(machine_id, drink_id)
);

-- ============================================
-- SALES TABLES (Immutable Records)
-- ============================================

-- Sales header
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES vending_machines(id) ON DELETE RESTRICT,
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    total_revenue DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    total_profit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale line items (with snapshotted prices)
CREATE TABLE sale_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    drink_id UUID NOT NULL REFERENCES drinks(id) ON DELETE RESTRICT,
    drink_supplier_id UUID NOT NULL REFERENCES drink_suppliers(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    selling_price_snapshot DECIMAL(10, 2) NOT NULL,
    cost_price_snapshot DECIMAL(10, 2) NOT NULL,
    line_revenue DECIMAL(10, 2) NOT NULL,
    line_cost DECIMAL(10, 2) NOT NULL,
    line_profit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OPERATIONAL COSTS TABLE
-- ============================================

CREATE TABLE operational_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES vending_machines(id) ON DELETE CASCADE,  -- NULL = company-wide
    cost_type cost_type NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (period_end >= period_start)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_drink_suppliers_drink_id ON drink_suppliers(drink_id);
CREATE INDEX idx_drink_suppliers_supplier_id ON drink_suppliers(supplier_id);
CREATE INDEX idx_drink_suppliers_quantity ON drink_suppliers(quantity);
CREATE INDEX idx_machine_drink_prices_machine_id ON machine_drink_prices(machine_id);
CREATE INDEX idx_machine_drink_prices_drink_id ON machine_drink_prices(drink_id);
CREATE INDEX idx_sales_machine_id ON sales(machine_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sale_line_items_sale_id ON sale_line_items(sale_id);
CREATE INDEX idx_sale_line_items_drink_id ON sale_line_items(drink_id);
CREATE INDEX idx_operational_costs_machine_id ON operational_costs(machine_id);
CREATE INDEX idx_operational_costs_period ON operational_costs(period_start, period_end);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drink_suppliers_updated_at
    BEFORE UPDATE ON drink_suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machine_drink_prices_updated_at
    BEFORE UPDATE ON machine_drink_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RECORD SALE FUNCTION (Critical Business Logic)
-- ============================================

CREATE OR REPLACE FUNCTION record_sale(
    p_machine_id UUID,
    p_items JSONB  -- Array of {drink_id: uuid, quantity: int}
)
RETURNS UUID AS $$
DECLARE
    v_sale_id UUID;
    v_item JSONB;
    v_drink_id UUID;
    v_quantity_to_sell INTEGER;
    v_remaining_qty INTEGER;
    v_selling_price DECIMAL(10, 2);
    v_supplier RECORD;
    v_deduct_qty INTEGER;
    v_total_revenue DECIMAL(10, 2) := 0;
    v_total_cost DECIMAL(10, 2) := 0;
    v_line_revenue DECIMAL(10, 2);
    v_line_cost DECIMAL(10, 2);
BEGIN
    -- Create the sale record first (we'll update totals at the end)
    INSERT INTO sales (machine_id, total_revenue, total_cost, total_profit)
    VALUES (p_machine_id, 0, 0, 0)
    RETURNING id INTO v_sale_id;

    -- Process each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_drink_id := (v_item->>'drink_id')::UUID;
        v_quantity_to_sell := (v_item->>'quantity')::INTEGER;
        v_remaining_qty := v_quantity_to_sell;

        -- Get selling price for this drink at this machine
        SELECT selling_price INTO v_selling_price
        FROM machine_drink_prices
        WHERE machine_id = p_machine_id AND drink_id = v_drink_id AND is_available = TRUE;

        IF v_selling_price IS NULL THEN
            RAISE EXCEPTION 'Drink % is not available at machine %', v_drink_id, p_machine_id;
        END IF;

        -- Get suppliers ordered by quantity ASC (lowest first)
        FOR v_supplier IN
            SELECT id, supplier_id, cost_price, quantity
            FROM drink_suppliers
            WHERE drink_id = v_drink_id AND quantity > 0
            ORDER BY quantity ASC
            FOR UPDATE  -- Lock rows for update
        LOOP
            IF v_remaining_qty <= 0 THEN
                EXIT;
            END IF;

            -- Calculate how much to deduct from this supplier
            v_deduct_qty := LEAST(v_supplier.quantity, v_remaining_qty);

            -- Calculate line totals
            v_line_revenue := v_selling_price * v_deduct_qty;
            v_line_cost := v_supplier.cost_price * v_deduct_qty;

            -- Create sale line item with snapshotted prices
            INSERT INTO sale_line_items (
                sale_id,
                drink_id,
                drink_supplier_id,
                quantity,
                selling_price_snapshot,
                cost_price_snapshot,
                line_revenue,
                line_cost,
                line_profit
            ) VALUES (
                v_sale_id,
                v_drink_id,
                v_supplier.id,
                v_deduct_qty,
                v_selling_price,
                v_supplier.cost_price,
                v_line_revenue,
                v_line_cost,
                v_line_revenue - v_line_cost
            );

            -- Update supplier inventory
            UPDATE drink_suppliers
            SET quantity = quantity - v_deduct_qty
            WHERE id = v_supplier.id;

            -- Track totals
            v_total_revenue := v_total_revenue + v_line_revenue;
            v_total_cost := v_total_cost + v_line_cost;
            v_remaining_qty := v_remaining_qty - v_deduct_qty;
        END LOOP;

        -- Check if we fulfilled the entire quantity
        IF v_remaining_qty > 0 THEN
            RAISE EXCEPTION 'Insufficient stock for drink %. Short by % units.', v_drink_id, v_remaining_qty;
        END IF;
    END LOOP;

    -- Update sale totals
    UPDATE sales
    SET total_revenue = v_total_revenue,
        total_cost = v_total_cost,
        total_profit = v_total_revenue - v_total_cost
    WHERE id = v_sale_id;

    RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DASHBOARD VIEWS
-- ============================================

-- Monthly sales summary view
CREATE OR REPLACE VIEW monthly_sales_summary AS
SELECT
    DATE_TRUNC('month', s.sale_date) AS month,
    s.machine_id,
    vm.name AS machine_name,
    COUNT(s.id) AS sale_count,
    SUM(s.total_revenue) AS revenue,
    SUM(s.total_cost) AS cost,
    SUM(s.total_profit) AS gross_profit
FROM sales s
JOIN vending_machines vm ON s.machine_id = vm.id
GROUP BY DATE_TRUNC('month', s.sale_date), s.machine_id, vm.name;

-- Monthly operational costs view
CREATE OR REPLACE VIEW monthly_operational_costs AS
SELECT
    DATE_TRUNC('month', period_start) AS month,
    machine_id,
    SUM(amount) AS total_cost
FROM operational_costs
GROUP BY DATE_TRUNC('month', period_start), machine_id;

-- Inventory status view
CREATE OR REPLACE VIEW inventory_status AS
SELECT
    d.id AS drink_id,
    d.name AS drink_name,
    s.id AS supplier_id,
    s.name AS supplier_name,
    ds.id AS drink_supplier_id,
    ds.cost_price,
    ds.quantity,
    CASE
        WHEN ds.quantity = 0 THEN 'out_of_stock'
        WHEN ds.quantity < 10 THEN 'low_stock'
        ELSE 'in_stock'
    END AS stock_status
FROM drinks d
JOIN drink_suppliers ds ON d.id = ds.drink_id
JOIN suppliers s ON ds.supplier_id = s.id;

-- Sales by drink view (for dashboard filtering)
CREATE OR REPLACE VIEW sales_by_drink AS
SELECT
    DATE_TRUNC('month', s.sale_date) AS month,
    s.machine_id,
    sli.drink_id,
    d.name AS drink_name,
    SUM(sli.quantity) AS total_quantity,
    SUM(sli.line_revenue) AS revenue,
    SUM(sli.line_cost) AS cost,
    SUM(sli.line_profit) AS profit
FROM sales s
JOIN sale_line_items sli ON s.id = sli.sale_id
JOIN drinks d ON sli.drink_id = d.id
GROUP BY DATE_TRUNC('month', s.sale_date), s.machine_id, sli.drink_id, d.name;
