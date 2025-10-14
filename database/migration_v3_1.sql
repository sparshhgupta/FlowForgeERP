-- Add display fields to product_production table
-- These fields allow owners to show different values to clients if needed

ALTER TABLE product_production 
ADD COLUMN IF NOT EXISTS display_quantity_produced INTEGER,
ADD COLUMN IF NOT EXISTS display_target_quantity INTEGER;

-- Add comments to explain the fields
COMMENT ON COLUMN product_production.display_quantity_produced IS 'Quantity to display to client (if different from actual)';
COMMENT ON COLUMN product_production.display_target_quantity IS 'Target quantity to display to client (if different from actual)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_production_project ON product_production(project_id);