const express = require('express');
const router = express.Router();
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
        COUNT(DISTINCT wa.worker_id) FILTER (WHERE wa.date = CURRENT_DATE) as workers_today
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN project_workers pw ON p.id = pw.project_id
      LEFT JOIN worker_assignments wa ON p.id = wa.project_id
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
        ROUND((pp.quantity_produced::decimal / pp.target_quantity::decimal) * 100, 2) as completion_percentage
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

    res.json({
      project: projectResult.rows[0],
      production: productionResult.rows,
      workers: workersResult.rows
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// Create new project
router.post('/', authenticateToken, authorizeRole('owner'), async (req, res) => {
  const { name, description, start_date, target_completion_date } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, start_date, target_completion_date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, start_date, target_completion_date, req.user.id]
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
  const { name, description, status, target_completion_date } = req.body;

  try {
    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2, status = $3, target_completion_date = $4 WHERE id = $5 RETURNING *',
      [name, description, status, target_completion_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
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