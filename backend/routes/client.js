const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// Client login (no JWT, just session-based for simplicity)
router.post('/login', async (req, res) => {
  const { project_id, password } = req.body;

  try {
    if (!project_id || !password) {
      return res.status(400).json({ error: 'Project ID and password are required' });
    }

    // Find project
    const result = await pool.query(
      'SELECT id, name, client_name, client_password FROM projects WHERE id = $1',
      [project_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid project ID or password' });
    }

    const project = result.rows[0];

    if (!project.client_password) {
      return res.status(401).json({ error: 'Client access not configured for this project' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, project.client_password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid project ID or password' });
    }

    res.json({
      message: 'Login successful',
      project: {
        id: project.id,
        name: project.name,
        client_name: project.client_name
      }
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get project status for client
router.get('/project/:id/:password', async (req, res) => {
  const { id, password } = req.params;

  try {
    // Verify access
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    if (!project.client_password) {
      return res.status(403).json({ error: 'Client access not configured' });
    }

    const validPassword = await bcrypt.compare(password, project.client_password);

    if (!validPassword) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    // Get production details - use display values if available
    const productionResult = await pool.query(`
      SELECT 
        pp.id,
        pp.product_id,
        pp.target_quantity,
        pp.quantity_produced,
        pp.assigned_workers,
        pp.display_quantity_produced,
        pp.display_target_quantity,
        prod.name as product_name,
        prod.type as product_type,
        prod.unit as product_unit,
        ROUND((pp.quantity_produced::decimal / pp.target_quantity::decimal) * 100, 2) as actual_completion_percentage,
        ROUND((COALESCE(pp.display_quantity_produced, pp.quantity_produced)::decimal / COALESCE(pp.display_target_quantity, pp.target_quantity)::decimal) * 100, 2) as completion_percentage,
        COALESCE(pp.display_quantity_produced, pp.quantity_produced) as display_quantity,
        COALESCE(pp.display_target_quantity, pp.target_quantity) as display_target
      FROM product_production pp
      JOIN products prod ON pp.product_id = prod.id
      WHERE pp.project_id = $1
      ORDER BY prod.type, prod.name
    `, [id]);

    // Get timeline
    const timelineResult = await pool.query(`
      SELECT 
        pt.*,
        u.username as changed_by_name
      FROM project_timeline pt
      LEFT JOIN users u ON pt.changed_by = u.id
      WHERE pt.project_id = $1
      ORDER BY pt.created_at DESC
    `, [id]);

    // Calculate overall completion using display values
    const overallCompletion = productionResult.rows.length > 0
      ? productionResult.rows.reduce((sum, item) => sum + parseFloat(item.completion_percentage), 0) / productionResult.rows.length
      : 0;

    res.json({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        description: project.description,
        start_date: project.start_date,
        expected_delivery_date: project.expected_delivery_date,
        actual_delivery_date: project.actual_delivery_date,
        client_name: project.client_name,
        overall_completion: overallCompletion.toFixed(2)
      },
      production: productionResult.rows,
      timeline: timelineResult.rows
    });
  } catch (error) {
    console.error('Error fetching client project:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

module.exports = router;