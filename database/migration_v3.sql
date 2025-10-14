-- Migration v3: Enhanced project management, machines, payments, and client portal
-- Run this after migration_v2.sql

-- Create machines table
CREATE TABLE IF NOT EXISTS machines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    model VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update projects table with new statuses and client access
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('pitching', 'received', 'started', 'on-hold', 'finished-production', 'payment-pending', 'closed'));

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS client_password VARCHAR(255),
ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;

-- Update existing projects to have valid status
UPDATE projects SET status = 'started' WHERE status = 'active';

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_type VARCHAR(50) CHECK (payment_type IN ('advance', 'partial', 'final')),
    payment_method VARCHAR(50),
    payment_date DATE,
    transaction_reference VARCHAR(255),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update worker_assignments to reference machines table
ALTER TABLE worker_assignments 
ADD COLUMN IF NOT EXISTS machine_id INTEGER REFERENCES machines(id);

-- Create project_timeline table for status tracking
CREATE TABLE IF NOT EXISTS project_timeline (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50),
    notes TEXT,
    changed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_timeline_project ON project_timeline(project_id);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);

-- Insert sample machines
INSERT INTO machines (name, type, model, status) VALUES
('Lathe Machine 1', 'Lathe', 'HMT-LT250', 'active'),
('Lathe Machine 2', 'Lathe', 'HMT-LT300', 'active'),
('Drilling Machine 1', 'Drilling', 'Pillar-D450', 'active'),
('Drilling Machine 2', 'Drilling', 'Radial-R500', 'active'),
('Threading Machine 1', 'Threading', 'Thread-T200', 'active'),
('Cutting Machine 1', 'Cutting', 'Cut-C150', 'active'),
('Welding Station 1', 'Welding', 'Arc-W300', 'active'),
('Welding Station 2', 'Welding', 'Arc-W300', 'active'),
('Grinding Machine 1', 'Grinding', 'Grind-G200', 'active'),
('Assembly Station', 'Assembly', 'Manual', 'active'),
('Heat Treatment', 'Heat Treatment', 'Furnace-F500', 'active'),
('Quality Check', 'QC', 'Manual', 'active')
ON CONFLICT DO NOTHING;

-- Update existing worker_assignments with machine_id based on machine_assigned
UPDATE worker_assignments wa
SET machine_id = m.id
FROM machines m
WHERE wa.machine_assigned = m.name;

-- Add sample client credentials to existing projects
UPDATE projects 
SET 
    client_name = 'Delhi Metro Rail Corporation',
    client_email = 'client1@dmrc.com',
    client_phone = '011-23417910',
    client_password = '$2a$10$rX8TQYqZ9X9X9X9X9X9X9e7KGkJ8HqJ8HqJ8HqJ8HqJ8HqJ8HqJ8H', -- password: client123
    expected_delivery_date = target_completion_date
WHERE id = 1;

UPDATE projects 
SET 
    client_name = 'Industrial Warehousing Ltd',
    client_email = 'client2@iwl.com',
    client_phone = '011-45678901',
    client_password = '$2a$10$rX8TQYqZ9X9X9X9X9X9X9e7KGkJ8HqJ8HqJ8HqJ8HqJ8HqJ8HqJ8H',
    expected_delivery_date = target_completion_date
WHERE id = 2;

UPDATE projects 
SET 
    client_name = 'Bridge Construction Corp',
    client_email = 'client3@bcc.com',
    client_phone = '011-98765432',
    client_password = '$2a$10$rX8TQYqZ9X9X9X9X9X9X9e7KGkJ8HqJ8HqJ8HqJ8HqJ8HqJ8HqJ8H',
    expected_delivery_date = target_completion_date
WHERE id = 3;

-- Insert sample payments
INSERT INTO payments (project_id, amount, payment_type, payment_method, payment_date, transaction_reference, created_by) VALUES
(1, 500000.00, 'advance', 'Bank Transfer', CURRENT_DATE - INTERVAL '60 days', 'TXN001234', 1),
(1, 300000.00, 'partial', 'Bank Transfer', CURRENT_DATE - INTERVAL '30 days', 'TXN001567', 1),
(2, 250000.00, 'advance', 'Cheque', CURRENT_DATE - INTERVAL '40 days', 'CHQ445566', 1),
(3, 400000.00, 'advance', 'Bank Transfer', CURRENT_DATE - INTERVAL '70 days', 'TXN002234', 1),
(3, 200000.00, 'partial', 'Bank Transfer', CURRENT_DATE - INTERVAL '35 days', 'TXN002567', 1)
ON CONFLICT DO NOTHING;

-- Insert project timeline for existing projects
INSERT INTO project_timeline (project_id, status, notes, changed_by) VALUES
(1, 'pitching', 'Initial proposal submitted', 1),
(1, 'received', 'Order confirmed by client', 1),
(1, 'started', 'Production started', 1),
(2, 'received', 'Order received', 1),
(2, 'started', 'Production in progress', 1),
(3, 'received', 'Order confirmed', 1),
(3, 'started', 'Manufacturing started', 1),
(4, 'pitching', 'Proposal under review', 1),
(4, 'on-hold', 'Client requested to pause', 1)
ON CONFLICT DO NOTHING;

-- Calculate total project values and pending amounts
-- This will be done in the application, but here's a view for reference
CREATE OR REPLACE VIEW project_financials AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.status,
    COALESCE(SUM(pay.amount), 0) as total_paid,
    COALESCE(SUM(CASE WHEN pay.payment_type = 'advance' THEN pay.amount ELSE 0 END), 0) as advance_paid,
    COALESCE(SUM(CASE WHEN pay.payment_type = 'partial' THEN pay.amount ELSE 0 END), 0) as partial_paid,
    COALESCE(SUM(CASE WHEN pay.payment_type = 'final' THEN pay.amount ELSE 0 END), 0) as final_paid
FROM projects p
LEFT JOIN payments pay ON p.id = pay.project_id
GROUP BY p.id, p.name, p.status;