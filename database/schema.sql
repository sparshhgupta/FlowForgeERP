-- Drop existing tables if they exist
DROP TABLE IF EXISTS product_production CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'supervisor')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold')),
    start_date DATE,
    target_completion_date DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table (bolts, gratings, etc.)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    unit VARCHAR(50) DEFAULT 'pieces',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product production tracking per project
CREATE TABLE product_production (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity_produced INTEGER DEFAULT 0,
    target_quantity INTEGER NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, product_id)
);

-- Attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    worker_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half-day')),
    machine_assigned VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_name, date, project_id)
);

-- Create indexes for better performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_project ON attendance(project_id);
CREATE INDEX idx_production_project ON product_production(project_id);

-- Insert dummy data

-- Users (passwords are hashed version of 'password123')
INSERT INTO users (username, email, password, role) VALUES
('owner_admin', 'owner@parasnathbuild.com', '$2a$10$rX8TQYqZ9X9X9X9X9X9X9e7KGkJ8HqJ8HqJ8HqJ8HqJ8HqJ8HqJ8H', 'owner'),
('supervisor_ram', 'ram@parasnathbuild.com', '$2a$10$rX8TQYqZ9X9X9X9X9X9X9e7KGkJ8HqJ8HqJ8HqJ8HqJ8HqJ8HqJ8H', 'supervisor'),
('supervisor_shyam', 'shyam@parasnathbuild.com', '$2a$10$rX8TQYqZ9X9X9X9X9X9X9e7KGkJ8HqJ8HqJ8HqJ8HqJ8HqJ8HqJ8H', 'supervisor');

-- Products
INSERT INTO products (name, type, unit) VALUES
('M8 Foundation Bolt', 'bolt', 'pieces'),
('M10 Foundation Bolt', 'bolt', 'pieces'),
('M12 Foundation Bolt', 'bolt', 'pieces'),
('M16 Foundation Bolt', 'bolt', 'pieces'),
('Steel Grating 1x1m', 'grating', 'pieces'),
('Steel Grating 1x2m', 'grating', 'pieces'),
('J-Bolt M10', 'bolt', 'pieces'),
('L-Bolt M12', 'bolt', 'pieces');

-- Projects
INSERT INTO projects (name, description, status, start_date, target_completion_date, created_by) VALUES
('Metro Station Foundation', 'Foundation bolts for Delhi Metro Phase 4', 'active', '2025-09-01', '2025-12-31', 1),
('Industrial Warehouse', 'Steel gratings and foundation bolts for warehouse', 'active', '2025-10-01', '2026-01-15', 1),
('Bridge Construction', 'Heavy duty foundation bolts for bridge pillars', 'active', '2025-08-15', '2025-11-30', 1),
('Factory Setup', 'Complete steel framework and gratings', 'on-hold', '2025-09-20', '2026-02-28', 1);

-- Product production tracking
INSERT INTO product_production (project_id, product_id, quantity_produced, target_quantity) VALUES
-- Metro Station Foundation
(1, 1, 450, 1000),  -- M8 Bolts
(1, 2, 320, 800),   -- M10 Bolts
(1, 3, 180, 500),   -- M12 Bolts

-- Industrial Warehouse
(2, 4, 90, 300),    -- M16 Bolts
(2, 5, 25, 100),    -- Grating 1x1m
(2, 6, 15, 80),     -- Grating 1x2m

-- Bridge Construction
(3, 3, 410, 600),   -- M12 Bolts
(3, 4, 270, 400),   -- M16 Bolts
(3, 7, 155, 300),   -- J-Bolt M10

-- Factory Setup
(4, 5, 40, 150),    -- Grating 1x1m
(4, 6, 30, 120),    -- Grating 1x2m
(4, 8, 85, 250);    -- L-Bolt M12

-- Attendance records (for today and recent days)
INSERT INTO attendance (project_id, worker_name, date, status, machine_assigned) VALUES
-- Metro Station Foundation
(1, 'Rajesh Kumar', CURRENT_DATE, 'present', 'Lathe Machine 1'),
(1, 'Amit Singh', CURRENT_DATE, 'present', 'Drilling Machine 2'),
(1, 'Vijay Sharma', CURRENT_DATE, 'present', 'Threading Machine 1'),
(1, 'Suresh Yadav', CURRENT_DATE, 'absent', NULL),
(1, 'Prakash Verma', CURRENT_DATE, 'present', 'Cutting Machine 1'),

-- Industrial Warehouse
(2, 'Ramesh Gupta', CURRENT_DATE, 'present', 'Welding Station 1'),
(2, 'Manoj Tiwari', CURRENT_DATE, 'present', 'Grinding Machine 1'),
(2, 'Deepak Pandey', CURRENT_DATE, 'half-day', 'Assembly Station'),

-- Bridge Construction
(3, 'Anil Mishra', CURRENT_DATE, 'present', 'Lathe Machine 2'),
(3, 'Sanjay Kumar', CURRENT_DATE, 'present', 'Drilling Machine 1'),
(3, 'Ravi Shankar', CURRENT_DATE, 'present', 'Heat Treatment'),
(3, 'Mohan Lal', CURRENT_DATE, 'present', 'Quality Check'),

-- Factory Setup
(4, 'Ashok Singh', CURRENT_DATE, 'present', 'Welding Station 2'),
(4, 'Dinesh Pal', CURRENT_DATE, 'absent', NULL);

-- Previous day attendance for reference
INSERT INTO attendance (project_id, worker_name, date, status, machine_assigned) VALUES
(1, 'Rajesh Kumar', CURRENT_DATE - INTERVAL '1 day', 'present', 'Lathe Machine 1'),
(1, 'Amit Singh', CURRENT_DATE - INTERVAL '1 day', 'present', 'Drilling Machine 2'),
(1, 'Vijay Sharma', CURRENT_DATE - INTERVAL '1 day', 'half-day', 'Threading Machine 1'),
(2, 'Ramesh Gupta', CURRENT_DATE - INTERVAL '1 day', 'present', 'Welding Station 1'),
(3, 'Anil Mishra', CURRENT_DATE - INTERVAL '1 day', 'present', 'Lathe Machine 2');

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;