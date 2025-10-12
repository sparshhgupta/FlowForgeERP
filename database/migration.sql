-- Migration script to update existing database
-- Run this after the initial schema

-- Drop the old attendance table
DROP TABLE IF EXISTS attendance CASCADE;

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Create new attendance table with worker reference
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half-day')),
    machine_assigned VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, date, project_id)
);

-- Create project_workers junction table (for assigning workers to projects)
CREATE TABLE IF NOT EXISTS project_workers (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(project_id, worker_id)
);

-- Add worker assignment to product_production
ALTER TABLE product_production 
ADD COLUMN IF NOT EXISTS assigned_workers INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workers_name ON workers(name);
CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance(worker_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_project_workers_project ON project_workers(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workers_worker ON project_workers(worker_id);

-- Insert dummy workers
INSERT INTO workers (name, phone, address, created_by) VALUES
('Rajesh Kumar', '9876543210', 'Delhi', 1),
('Amit Singh', '9876543211', 'Noida', 1),
('Vijay Sharma', '9876543212', 'Gurgaon', 1),
('Suresh Yadav', '9876543213', 'Faridabad', 1),
('Prakash Verma', '9876543214', 'Delhi', 1),
('Ramesh Gupta', '9876543215', 'Delhi', 1),
('Manoj Tiwari', '9876543216', 'Noida', 1),
('Deepak Pandey', '9876543217', 'Ghaziabad', 1),
('Anil Mishra', '9876543218', 'Delhi', 1),
('Sanjay Kumar', '9876543219', 'Delhi', 1),
('Ravi Shankar', '9876543220', 'Noida', 1),
('Mohan Lal', '9876543221', 'Delhi', 1),
('Ashok Singh', '9876543222', 'Faridabad', 1),
('Dinesh Pal', '9876543223', 'Gurgaon', 1);

-- Assign workers to projects
INSERT INTO project_workers (project_id, worker_id, is_active) VALUES
(1, 1, true), (1, 2, true), (1, 3, true), (1, 4, true), (1, 5, true),
(2, 6, true), (2, 7, true), (2, 8, true),
(3, 9, true), (3, 10, true), (3, 11, true), (3, 12, true),
(4, 13, true), (4, 14, true);

-- Insert attendance records for today
INSERT INTO attendance (worker_id, project_id, date, status, machine_assigned) VALUES
(1, 1, CURRENT_DATE, 'present', 'Lathe Machine 1'),
(2, 1, CURRENT_DATE, 'present', 'Drilling Machine 2'),
(3, 1, CURRENT_DATE, 'present', 'Threading Machine 1'),
(4, 1, CURRENT_DATE, 'absent', NULL),
(5, 1, CURRENT_DATE, 'present', 'Cutting Machine 1'),
(6, 2, CURRENT_DATE, 'present', 'Welding Station 1'),
(7, 2, CURRENT_DATE, 'present', 'Grinding Machine 1'),
(8, 2, CURRENT_DATE, 'half-day', 'Assembly Station'),
(9, 3, CURRENT_DATE, 'present', 'Lathe Machine 2'),
(10, 3, CURRENT_DATE, 'present', 'Drilling Machine 1'),
(11, 3, CURRENT_DATE, 'present', 'Heat Treatment'),
(12, 3, CURRENT_DATE, 'present', 'Quality Check'),
(13, 4, CURRENT_DATE, 'present', 'Welding Station 2'),
(14, 4, CURRENT_DATE, 'absent', NULL);

-- Insert previous day attendance
INSERT INTO attendance (worker_id, project_id, date, status, machine_assigned) VALUES
(1, 1, CURRENT_DATE - INTERVAL '1 day', 'present', 'Lathe Machine 1'),
(2, 1, CURRENT_DATE - INTERVAL '1 day', 'present', 'Drilling Machine 2'),
(3, 1, CURRENT_DATE - INTERVAL '1 day', 'half-day', 'Threading Machine 1'),
(6, 2, CURRENT_DATE - INTERVAL '1 day', 'present', 'Welding Station 1'),
(9, 3, CURRENT_DATE - INTERVAL '1 day', 'present', 'Lathe Machine 2');

-- Update some product productions with assigned workers
UPDATE product_production SET assigned_workers = 3 WHERE project_id = 1 AND product_id = 1;
UPDATE product_production SET assigned_workers = 2 WHERE project_id = 1 AND product_id = 2;
UPDATE product_production SET assigned_workers = 2 WHERE project_id = 2 AND product_id = 4;
UPDATE product_production SET assigned_workers = 1 WHERE project_id = 3 AND product_id = 3;