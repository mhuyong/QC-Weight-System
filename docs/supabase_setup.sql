-- ===== QC Weight System - Supabase Setup =====

-- 1. Tables
CREATE TABLE machines (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_no TEXT NOT NULL UNIQUE,
    machine_name TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    target_weight NUMERIC NOT NULL,
    min_weight NUMERIC NOT NULL,
    max_weight NUMERIC NOT NULL,
    unit TEXT DEFAULT 'กรัม',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE operators (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    employee_id TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE qc_inspectors (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    employee_id TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weight_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id),
    operator_id BIGINT NOT NULL REFERENCES operators(id),
    qc_id BIGINT NOT NULL REFERENCES qc_inspectors(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    weight NUMERIC NOT NULL,
    status TEXT NOT NULL,
    check_date DATE NOT NULL,
    check_hour INTEGER NOT NULL,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_records_date_hour ON weight_records(check_date, check_hour);
CREATE INDEX idx_records_machine ON weight_records(machine_id);

-- 2. Enable Row Level Security (allow all for anon - public app)
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on machines" ON machines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on operators" ON operators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on qc_inspectors" ON qc_inspectors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on weight_records" ON weight_records FOR ALL USING (true) WITH CHECK (true);
