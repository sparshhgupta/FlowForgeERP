-- Create worker_product_assignments table
CREATE TABLE IF NOT EXISTS worker_product_assignments (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    product_production_id INTEGER REFERENCES product_production(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, product_production_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_worker_product_assignments_date ON worker_product_assignments(date);
CREATE INDEX idx_worker_product_assignments_product ON worker_product_assignments(product_production_id);
CREATE INDEX idx_worker_product_assignments_worker ON worker_product_assignments(worker_id);

-- Add dimensions column to product_production if not exists (already in your code)
ALTER TABLE product_production ADD COLUMN IF NOT EXISTS dimensions JSONB;

-- Create a function to remove assignments when attendance is absent
CREATE OR REPLACE FUNCTION remove_assignments_on_absent()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to 'absent'
  IF NEW.status = 'absent' AND (OLD.status IS NULL OR OLD.status != 'absent') THEN
    -- Remove from worker_assignments
    DELETE FROM worker_assignments 
    WHERE worker_id = NEW.worker_id 
      AND date = NEW.date;
    
    -- Remove from worker_product_assignments
    DELETE FROM worker_product_assignments 
    WHERE worker_id = NEW.worker_id 
      AND date = NEW.date;
      
    RAISE NOTICE 'Removed assignments for worker % on date % due to absent status', NEW.worker_id, NEW.date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendance table
DROP TRIGGER IF EXISTS attendance_absent_trigger ON attendance;
CREATE TRIGGER attendance_absent_trigger
AFTER INSERT OR UPDATE OF status ON attendance
FOR EACH ROW
EXECUTE FUNCTION remove_assignments_on_absent();