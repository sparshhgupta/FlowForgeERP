const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all machines
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        COUNT(DISTINCT wa.worker_id) FILTER (WHERE wa.date = CURRENT_DATE) as workers_assigned_today
      FROM machines m
      LEFT JOIN worker_assignments wa ON m.id = wa.machine_id
      GROUP BY m.id
      ORDER BY m.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
});

// Get single machine
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const machineResult = await pool.query(
      'SELECT * FROM machines WHERE id = $1',
      [id]
    );

    if (machineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    // Get current assignments
    const assignmentsResult = await pool.query(`
      SELECT 
        wa.*,
        w.name as worker_name,
        p.name as project_name
      FROM worker_assignments wa
      JOIN workers w ON wa.worker_id = w.id
      JOIN projects p ON wa.project_id = p.id
      WHERE wa.machine_id = $1 AND wa.date = CURRENT_DATE
    `, [id]);

    res.json({
      machine: machineResult.rows[0],
      current_assignments: assignmentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching machine details:', error);
    res.status(500).json({ error: 'Failed to fetch machine details' });
  }
});

// Create new machine
router.post('/', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { name, type, model, status } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO machines (name, type, model, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, model, status || 'active']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating machine:', error);
    res.status(500).json({ error: 'Failed to create machine' });
  }
});

// Update machine
router.put('/:id', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { name, type, model, status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE machines SET name = $1, type = $2, model = $3, status = $4 WHERE id = $5 RETURNING *',
      [name, type, model, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating machine:', error);
    res.status(500).json({ error: 'Failed to update machine' });
  }
});

// Delete machine
router.delete('/:id', authenticateToken, authorizeRole('owner'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM machines WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    console.error('Error deleting machine:', error);
    res.status(500).json({ error: 'Failed to delete machine' });
  }
});

module.exports = router;