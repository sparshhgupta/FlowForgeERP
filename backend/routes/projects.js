const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        u.username as created_by_name,
        COUNT(DISTINCT pw.worker_id) FILTER (WHERE pw.is_active = true) as total_workers,
        COUNT(DISTINCT wa.worker_id) FILTER (WHERE wa.date = CURRENT_DATE) as workers_today,
        COALESCE(SUM(pay.amount), 0) as total_paid,
        COALESCE(
          ROUND(
            AVG(
              CASE 
                WHEN pp.target_quantity > 0 
                THEN (pp.quantity_produced::decimal / pp.target_quantity::decimal) * 100 
                ELSE 0 
              END
            ), 2
          ), 0
        ) as overall_completion
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN project_workers pw ON p.id = pw.project_id
      LEFT JOIN worker_assignments wa ON p.id = wa.project_id
      LEFT JOIN payments pay ON p.id = pay.project_id
      LEFT JOIN product_production pp ON p.id = pp.project_id
      GROUP BY p.id, u.username
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project with details
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Get project details
    const projectResult = await pool.query(
      'SELECT p.*, u.username as created_by_name FROM projects p LEFT JOIN users u ON p.created_by = u.id WHERE p.id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get production details
    const productionResult = await pool.query(`
      SELECT 
        pp.*,
        prod.name as product_name,
        prod.type as product_type,
        prod.unit as product_unit,
        ROUND((pp.quantity_produced::decimal / pp.target_quantity::decimal) * 100, 2) as completion_percentage,
        COALESCE(pp.display_quantity_produced, pp.quantity_produced) as display_quantity,
        COALESCE(pp.display_target_quantity, pp.target_quantity) as display_target,
        ROUND((COALESCE(pp.display_quantity_produced, pp.quantity_produced)::decimal / 
               COALESCE(pp.display_target_quantity, pp.target_quantity)::decimal) * 100, 2) as display_completion_percentage
      FROM product_production pp
      JOIN products prod ON pp.product_id = prod.id
      WHERE pp.project_id = $1
      ORDER BY prod.type, prod.name
    `, [id]);

    // Get permanently assigned workers
    const workersResult = await pool.query(`
      SELECT 
        w.*,
        pw.assigned_date
      FROM project_workers pw
      JOIN workers w ON pw.worker_id = w.id
      WHERE pw.project_id = $1 AND pw.is_active = true
      ORDER BY w.name
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

    // Calculate overall completion (actual)
    const actualCompletion = productionResult.rows.length > 0
      ? productionResult.rows.reduce((sum, item) => sum + parseFloat(item.completion_percentage || 0), 0) / productionResult.rows.length
      : 0;

    // Calculate display completion
    const displayCompletion = productionResult.rows.length > 0
      ? productionResult.rows.reduce((sum, item) => sum + parseFloat(item.display_completion_percentage || 0), 0) / productionResult.rows.length
      : 0;

    res.json({
      project: {
        ...projectResult.rows[0],
        overall_completion: actualCompletion.toFixed(2),
        display_overall_completion: displayCompletion.toFixed(2)
      },
      production: productionResult.rows,
      workers: workersResult.rows,
      timeline: timelineResult.rows
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// Create new project
router.post('/', authenticateToken, authorizeRole('owner'), async (req, res) => {
  const { 
    name, description, status, start_date, target_completion_date, expected_delivery_date,
    client_name, client_email, client_phone 
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO projects 
       (name, description, status, start_date, target_completion_date, expected_delivery_date, 
        client_name, client_email, client_phone, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [name, description, status || 'pitching', start_date, target_completion_date, expected_delivery_date,
       client_name, client_email, client_phone, req.user.id]
    );

    // Add timeline entry
    await pool.query(
      'INSERT INTO project_timeline (project_id, status, notes, changed_by) VALUES ($1, $2, $3, $4)',
      [result.rows[0].id, status || 'pitching', 'Project created', req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { 
    name, description, status, target_completion_date, expected_delivery_date, actual_delivery_date,
    client_name, client_email, client_phone 
  } = req.body;

  try {
    // Get old status for timeline
    const oldProject = await pool.query('SELECT status FROM projects WHERE id = $1', [id]);
    const oldStatus = oldProject.rows[0]?.status;

    // Handle empty date strings
    const expectedDelivery = expected_delivery_date === '' || expected_delivery_date === undefined ? null : expected_delivery_date;
    const actualDelivery = actual_delivery_date === '' || actual_delivery_date === undefined ? null : actual_delivery_date;
    const targetCompletion = target_completion_date === '' || target_completion_date === undefined ? null : target_completion_date;

    const result = await pool.query(
      `UPDATE projects 
       SET name = $1, description = $2, status = $3, target_completion_date = $4, 
           expected_delivery_date = $5, actual_delivery_date = $6,
           client_name = $7, client_email = $8, client_phone = $9
       WHERE id = $10 
       RETURNING *`,
      [name, description, status, targetCompletion, expectedDelivery, actualDelivery,
       client_name, client_email, client_phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Add timeline entry if status changed
    if (oldStatus !== status) {
      await pool.query(
        'INSERT INTO project_timeline (project_id, status, notes, changed_by) VALUES ($1, $2, $3, $4)',
        [id, status, `Status changed from ${oldStatus} to ${status}`, req.user.id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Set client password
router.post('/:id/client-password', authenticateToken, authorizeRole('owner'), async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'UPDATE projects SET client_password = $1 WHERE id = $2 RETURNING id, name, client_name',
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Client password set successfully', project: result.rows[0] });
  } catch (error) {
    console.error('Error setting client password:', error);
    res.status(500).json({ error: 'Failed to set client password' });
  }
});

// Add product to project
router.post('/:id/products', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { product_id, target_quantity } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO product_production (project_id, product_id, target_quantity, quantity_produced, assigned_workers) 
       VALUES ($1, $2, $3, 0, 0) 
       RETURNING *`,
      [id, product_id, target_quantity]
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

// Add permanent worker to project
router.post('/:id/workers', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { worker_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO project_workers (project_id, worker_id, is_active) 
       VALUES ($1, $2, true) 
       ON CONFLICT (project_id, worker_id) DO UPDATE SET is_active = true
       RETURNING *`,
      [id, worker_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding worker to project:', error);
    res.status(500).json({ error: 'Failed to add worker to project' });
  }
});

// Remove permanent worker from project
router.delete('/:id/workers/:workerId', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id, workerId } = req.params;

  try {
    const result = await pool.query(
      'UPDATE project_workers SET is_active = false WHERE project_id = $1 AND worker_id = $2 RETURNING *',
      [id, workerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Worker assignment not found' });
    }

    res.json({ message: 'Worker removed from project' });
  } catch (error) {
    console.error('Error removing worker from project:', error);
    res.status(500).json({ error: 'Failed to remove worker from project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, authorizeRole('owner'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;