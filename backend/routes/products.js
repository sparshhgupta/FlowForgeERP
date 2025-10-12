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
router.get('/production/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        pp.*,
        p.name as product_name,
        p.type as product_type,
        p.unit,
        ROUND((pp.quantity_produced::decimal / pp.target_quantity::decimal) * 100, 2) as completion_percentage
      FROM product_production pp
      JOIN products p ON pp.product_id = p.id
      WHERE pp.project_id = $1
      ORDER BY p.type, p.name
    `, [projectId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching production:', error);
    res.status(500).json({ error: 'Failed to fetch production data' });
  }
});

// Update production quantity
router.put('/production/:id', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { quantity_produced, assigned_workers } = req.body;

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

// Add product to project
router.post('/production', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { project_id, product_id, target_quantity, quantity_produced, assigned_workers } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO product_production (project_id, product_id, target_quantity, quantity_produced, assigned_workers) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [project_id, product_id, target_quantity, quantity_produced || 0, assigned_workers || 0]
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