const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY type, name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product production for a project
// Get product production for a project - FIXED VERSION
router.get('/production/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        pp.*,
        p.name as product_name,
        p.type as product_type,
        p.unit,
        ROUND((pp.quantity_produced::decimal / pp.target_quantity::decimal) * 100, 2) as completion_percentage,
        ROUND((COALESCE(pp.display_quantity_produced, pp.quantity_produced)::decimal / COALESCE(pp.display_target_quantity, pp.target_quantity)::decimal) * 100, 2) as display_completion_percentage,
        COALESCE(pp.display_quantity_produced, pp.quantity_produced) as display_quantity,
        COALESCE(pp.display_target_quantity, pp.target_quantity) as display_target,
        (
          SELECT COUNT(DISTINCT wpa.worker_id)
          FROM worker_product_assignments wpa
          WHERE wpa.product_production_id = pp.id AND wpa.date = CURRENT_DATE
        ) as assigned_workers_count
      FROM product_production pp
      JOIN products p ON pp.product_id = p.id
      WHERE pp.project_id = $1
      ORDER BY p.type, p.name
    `, [projectId]);

    console.log('Production data fetched for project:', projectId);
    console.log('Number of production records:', result.rows.length);
    
    // Log each production record with its assigned workers count
    result.rows.forEach((row, index) => {
      console.log(`Record ${index + 1}: ${row.product_name}, assigned_workers_count: ${row.assigned_workers_count}`);
    });

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching production:', error);
    res.status(500).json({ error: 'Failed to fetch production data' });
  }
});
// router.get('/production/:projectId', authenticateToken, async (req, res) => {
//   const { projectId } = req.params;

//   try {
//     const result = await pool.query(`
//       SELECT 
//         pp.*,
//         p.name as product_name,
//         p.type as product_type,
//         p.unit,
//         ROUND((pp.quantity_produced::decimal / pp.target_quantity::decimal) * 100, 2) as completion_percentage,
//         ROUND((COALESCE(pp.display_quantity_produced, pp.quantity_produced)::decimal / COALESCE(pp.display_target_quantity, pp.target_quantity)::decimal) * 100, 2) as display_completion_percentage,
//         COALESCE(pp.display_quantity_produced, pp.quantity_produced) as display_quantity,
//         COALESCE(pp.display_target_quantity, pp.target_quantity) as display_target,
//         (
//           SELECT COUNT(DISTINCT wpa.worker_id)
//           FROM worker_product_assignments wpa
//           WHERE wpa.product_production_id = pp.id AND wpa.date = CURRENT_DATE
//         ) as assigned_workers_count
//       FROM product_production pp
//       JOIN products p ON pp.product_id = p.id
//       WHERE pp.project_id = $1
//       ORDER BY p.type, p.name
//     `, [projectId]);

//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error fetching production:', error);
//     res.status(500).json({ error: 'Failed to fetch production data' });
//   }
// });

// Get workers assigned to a specific product
router.get('/production/:id/workers', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        wpa.*,
        w.name as worker_name,
        w.phone as worker_phone,
        a.status as attendance_status,
        a.check_in_time,
        COALESCE(
          json_agg(
            json_build_object(
              'project_id', wa.project_id,
              'project_name', p.name,
              'machine_assigned', wa.machine_assigned
            )
          ) FILTER (WHERE wa.id IS NOT NULL), 
          '[]'
        ) as daily_assignments
      FROM worker_product_assignments wpa
      JOIN workers w ON wpa.worker_id = w.id
      LEFT JOIN attendance a ON wpa.worker_id = a.worker_id AND a.date = CURRENT_DATE
      LEFT JOIN worker_assignments wa ON wpa.worker_id = wa.worker_id AND wa.date = CURRENT_DATE
      LEFT JOIN projects p ON wa.project_id = p.id
      WHERE wpa.product_production_id = $1 AND wpa.date = CURRENT_DATE
      GROUP BY wpa.id, w.id, a.status, a.check_in_time
      ORDER BY w.name
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product workers:', error);
    res.status(500).json({ error: 'Failed to fetch product workers' });
  }
});

// Assign worker to product
router.post('/production/:id/workers', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { worker_id } = req.body;

  try {
    // First get the project_id from product_production
    const productResult = await pool.query(
      'SELECT project_id FROM product_production WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product production record not found' });
    }

    const project_id = productResult.rows[0].project_id;

    // Check if worker is present today
    const attendanceCheck = await pool.query(
      `SELECT status FROM attendance 
       WHERE worker_id = $1 AND date = CURRENT_DATE 
       AND (status = 'present' OR status = 'half-day')`,
      [worker_id]
    );

    if (attendanceCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Worker must be marked present before assignment' });
    }

    // Check if worker is already assigned to this product today
    const existingAssignment = await pool.query(
      'SELECT id FROM worker_product_assignments WHERE worker_id = $1 AND product_production_id = $2 AND date = CURRENT_DATE',
      [worker_id, id]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({ error: 'Worker already assigned to this product today' });
    }

    // Create the assignment
    const result = await pool.query(
      `INSERT INTO worker_product_assignments (worker_id, project_id, product_production_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [worker_id, project_id, id]
    );

    // Update the assigned_workers count
    await pool.query(`
      UPDATE product_production 
      SET assigned_workers = (
        SELECT COUNT(DISTINCT worker_id) 
        FROM worker_product_assignments 
        WHERE product_production_id = $1 AND date = CURRENT_DATE
      )
      WHERE id = $1
    `, [id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning worker to product:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid worker or product ID' });
    }
    res.status(500).json({ error: 'Failed to assign worker to product' });
  }
});

// Remove worker from product
router.delete('/production/:id/workers/:workerId', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id, workerId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM worker_product_assignments WHERE product_production_id = $1 AND worker_id = $2 AND date = CURRENT_DATE RETURNING *',
      [id, workerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Worker assignment not found' });
    }

    // Update the assigned_workers count
    await pool.query(`
      UPDATE product_production 
      SET assigned_workers = (
        SELECT COUNT(DISTINCT worker_id) 
        FROM worker_product_assignments 
        WHERE product_production_id = $1 AND date = CURRENT_DATE
      )
      WHERE id = $1
    `, [id]);

    res.json({ message: 'Worker removed from product' });
  } catch (error) {
    console.error('Error removing worker from product:', error);
    res.status(500).json({ error: 'Failed to remove worker from product' });
  }
});

// Update production quantity
router.put('/production/:id', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { quantity_produced, assigned_workers, target_quantity } = req.body;

  try {
    let query = 'UPDATE product_production SET last_updated = CURRENT_TIMESTAMP';
    const params = [];
    let paramCount = 1;

    if (quantity_produced !== undefined) {
      query += `, quantity_produced = $${paramCount}`;
      params.push(quantity_produced);
      paramCount++;
    }

    if (assigned_workers !== undefined) {
      query += `, assigned_workers = $${paramCount}`;
      params.push(assigned_workers);
      paramCount++;
    }

    if (target_quantity !== undefined) {
      query += `, target_quantity = $${paramCount}`;
      params.push(target_quantity);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Production record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating production:', error);
    res.status(500).json({ error: 'Failed to update production' });
  }
});

// Update display values (owner only)
router.put('/production/:id/display', authenticateToken, authorizeRole('owner'), async (req, res) => {
  const { id } = req.params;
  const { display_quantity_produced, display_target_quantity } = req.body;

  try {
    const result = await pool.query(
      `UPDATE product_production 
       SET display_quantity_produced = $1, display_target_quantity = $2, last_updated = CURRENT_TIMESTAMP 
       WHERE id = $3 RETURNING *`,
      [display_quantity_produced || null, display_target_quantity || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Production record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating display values:', error);
    res.status(500).json({ error: 'Failed to update display values' });
  }
});

// Update dimensions
router.put('/production/:id/dimensions', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { dimensions } = req.body;

  console.log('Received dimensions update request for production ID:', id);
  console.log('Dimensions data:', dimensions);

  try {
    // Validate that dimensions is an object or null
    if (dimensions !== null && typeof dimensions !== 'object') {
      console.log('Invalid dimensions type:', typeof dimensions);
      return res.status(400).json({ error: 'Dimensions must be an object or null' });
    }

    // Convert dimensions to JSON string for PostgreSQL JSONB storage
    const dimensionsJson = dimensions ? JSON.stringify(dimensions) : null;
    console.log('Storing dimensions as:', dimensionsJson);

    const result = await pool.query(
      `UPDATE product_production 
       SET dimensions = $1, last_updated = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [dimensionsJson, id]
    );

    if (result.rows.length === 0) {
      console.log('Production record not found for ID:', id);
      return res.status(404).json({ error: 'Production record not found' });
    }

    console.log('Successfully updated dimensions:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating dimensions:', error);
    res.status(500).json({ error: 'Failed to update dimensions' });
  }
});

// Add product to project
router.post('/production', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { project_id, product_id, target_quantity, quantity_produced, assigned_workers, dimensions } = req.body;

  try {
    // Validate dimensions if provided
    if (dimensions && typeof dimensions !== 'object') {
      return res.status(400).json({ error: 'Dimensions must be an object' });
    }

    const result = await pool.query(
      `INSERT INTO product_production 
       (project_id, product_id, target_quantity, quantity_produced, assigned_workers, dimensions) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        project_id, 
        product_id, 
        target_quantity, 
        quantity_produced || 0, 
        assigned_workers || 0,
        dimensions ? JSON.stringify(dimensions) : null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding product to project:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Product already added to this project' });
    }
    res.status(500).json({ error: 'Failed to add product to project' });
  }
});

// Delete product from project
router.delete('/production/:id', authenticateToken, authorizeRole('owner'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM product_production WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Production record not found' });
    }

    // Also delete any worker assignments for this product
    await pool.query(
      'DELETE FROM worker_product_assignments WHERE product_production_id = $1',
      [id]
    );

    res.json({ message: 'Product removed from project' });
  } catch (error) {
    console.error('Error deleting production:', error);
    res.status(500).json({ error: 'Failed to delete production' });
  }
});

// Create new product (owner only)
router.post('/', authenticateToken, authorizeRole('owner'), async (req, res) => {
  const { name, type, unit } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO products (name, type, unit) VALUES ($1, $2, $3) RETURNING *',
      [name, type, unit || 'pieces']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

module.exports = router;