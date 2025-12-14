-- Add dimensions column to product_production table
ALTER TABLE product_production 
ADD COLUMN dimensions JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN product_production.dimensions IS 'Product dimensions as key-value pairs (e.g., {"length": "50m", "width": "30m"})';

-- Create an index for better JSON query performance (optional but recommended)
CREATE INDEX idx_product_production_dimensions ON product_production USING GIN (dimensions);