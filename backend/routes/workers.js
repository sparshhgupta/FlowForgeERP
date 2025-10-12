const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all workers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.*,
        u.username as created_by_name,
        COUNT(DISTINCT pw.project_id) FILTER (WHERE pw.is_active = true) as active_projects,
        CASE 
          WHEN a.status = 'present' OR a.status = 'half-day' THEN 1 
          ELSE 0 
        END as present_today
      FROM workers w
      LEFT JOIN users u ON w.created_by = u.id
      LEFT JOIN project_workers pw ON w.id = pw.worker_id
      LEFT JOIN attendance a ON w.id = a.worker_id AND a.date = CURRENT_DATE
      GROUP BY w.id, u.username, a.status
      ORDER BY w.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// Get single worker with attendance history
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const workerResult = await pool.query(
      'SELECT w.*, u.username as created_by_name FROM workers w LEFT JOIN users u ON w.created_by = u.id WHERE w.id = $1',
      [id]
    );

    if (workerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const attendanceResult = await pool.query(`
      SELECT *
      FROM attendance
      WHERE worker_id = $1
      ORDER BY date DESC
      LIMIT 30
    `, [id]);

    const projectsResult = await pool.query(`
      SELECT 
        p.*,
        pw.assigned_date,
        pw.is_active
      FROM project_workers pw
      JOIN projects p ON pw.project_id = p.id
      WHERE pw.worker_id = $1
      ORDER BY pw.assigned_date DESC
    `, [id]);

    res.json({
      worker: workerResult.rows[0],
      attendance: attendanceResult.rows,
      projects: projectsResult.rows
    });
  } catch (error) {
    console.error('Error fetching worker details:', error);
    res.status(500).json({ error: 'Failed to fetch worker details' });
  }
});

// Create new worker
router.post('/', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { name, phone, address } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO workers (name, phone, address, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone, address, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating worker:', error);
    res.status(500).json({ error: 'Failed to create worker' });
  }
});

// Update worker
router.put('/:id', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { name, phone, address } = req.body;

  try {
    const result = await pool.query(
      'UPDATE workers SET name = $1, phone = $2, address = $3 WHERE id = $4 RETURNING *',
      [name, phone, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

// Delete worker
router.delete('/:id', authenticateToken, authorizeRole('owner'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM workers WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

// Assign worker to project (permanent assignment)
router.post('/assign', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { worker_id, project_id } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO project_workers (project_id, worker_id) VALUES ($1, $2) ON CONFLICT (project_id, worker_id) DO UPDATE SET is_active = true RETURNING *',
      [project_id, worker_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning worker:', error);
    res.status(500).json({ error: 'Failed to assign worker' });
  }
});

// Remove worker from project (permanent assignment)
router.delete('/assign/:projectId/:workerId', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { projectId, workerId } = req.params;

  try {
    const result = await pool.query(
      'UPDATE project_workers SET is_active = false WHERE project_id = $1 AND worker_id = $2 RETURNING *',
      [projectId, workerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Worker removed from project' });
  } catch (error) {
    console.error('Error removing worker:', error);
    res.status(500).json({ error: 'Failed to remove worker' });
  }
});

module.exports = router;