-- Update the project_financials view to include total project value and pending amounts
CREATE OR REPLACE VIEW project_financials AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.client_name,
    p.client_phone,
    p.status,
    p.expected_delivery_date,
    p.actual_delivery_date,
    -- Calculate total project value (you might want to add a project_value column to projects table)
    COALESCE(p.project_value, 
             (SELECT SUM(pp.target_quantity * pr.unit_price) 
              FROM product_production pp 
              JOIN products pr ON pp.product_id = pr.id 
              WHERE pp.project_id = p.id), 
             0) as total_project_value,
    -- Payment summaries
    COALESCE(SUM(pay.amount), 0) as total_paid,
    COALESCE(SUM(CASE WHEN pay.payment_type = 'advance' THEN pay.amount ELSE 0 END), 0) as advance_paid,
    COALESCE(SUM(CASE WHEN pay.payment_type = 'partial' THEN pay.amount ELSE 0 END), 0) as partial_paid,
    COALESCE(SUM(CASE WHEN pay.payment_type = 'final' THEN pay.amount ELSE 0 END), 0) as final_paid,
    -- Calculate pending amount
    COALESCE(p.project_value, 
             (SELECT SUM(pp.target_quantity * pr.unit_price) 
              FROM product_production pp 
              JOIN products pr ON pp.product_id = pr.id 
              WHERE pp.project_id = p.id), 
             0) - COALESCE(SUM(pay.amount), 0) as pending_amount
FROM projects p
LEFT JOIN payments pay ON p.id = pay.project_id
GROUP BY p.id, p.name, p.client_name, p.client_phone, p.status, 
         p.expected_delivery_date, p.actual_delivery_date, p.project_value;