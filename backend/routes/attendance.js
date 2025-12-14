const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all attendance with filters
router.get('/', authenticateToken, async (req, res) => {
  const { worker_id, start_date, end_date, status } = req.query;

  try {
    let query = `
      SELECT 
        a.*,
        w.name as worker_name,
        w.phone
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (worker_id) {
      query += ` AND a.worker_id = $${paramCount}`;
      params.push(worker_id);
      paramCount++;
    }

    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (start_date) {
      query += ` AND a.date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND a.date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY a.date DESC, w.name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get today's attendance summary
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_workers,
        COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
        COUNT(*) FILTER (WHERE a.status = 'absent') as absent_count,
        COUNT(*) FILTER (WHERE a.status = 'half-day') as half_day_count,
        COUNT(*) FILTER (WHERE a.status IS NULL) as not_marked_count
      FROM workers w
      LEFT JOIN attendance a ON w.id = a.worker_id AND a.date = CURRENT_DATE
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

// Get today's detailed attendance (all workers)
router.get('/today/details', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.*,
        a.id as attendance_id,
        a.status,
        a.check_in_time,
        a.check_out_time,
        a.notes as attendance_notes,
        COALESCE(
          json_agg(
            json_build_object(
              'project_id', wa.project_id,
              'project_name', p.name,
              'machine_assigned', wa.machine_assigned,
              'assignment_notes', wa.notes
            )
          ) FILTER (WHERE wa.id IS NOT NULL), 
          '[]'
        ) as assignments,
        COALESCE(
          json_agg(
            json_build_object(
              'product_id', pp.product_id,
              'product_name', prod.name,
              'production_id', pp.id
            )
          ) FILTER (WHERE wpa.id IS NOT NULL), 
          '[]'
        ) as product_assignments
      FROM workers w
      LEFT JOIN attendance a ON w.id = a.worker_id AND a.date = CURRENT_DATE
      LEFT JOIN worker_assignments wa ON w.id = wa.worker_id AND wa.date = CURRENT_DATE
      LEFT JOIN projects p ON wa.project_id = p.id
      LEFT JOIN worker_product_assignments wpa ON w.id = wpa.worker_id AND wpa.date = CURRENT_DATE
      LEFT JOIN product_production pp ON wpa.product_production_id = pp.id
      LEFT JOIN products prod ON pp.product_id = prod.id
      GROUP BY w.id, a.id, a.status, a.check_in_time, a.check_out_time, a.notes
      ORDER BY w.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching today attendance details:', error);
    res.status(500).json({ error: 'Failed to fetch attendance details' });
  }
});

// Get workers available for assignment (present today and not fully assigned)
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.*,
        a.status,
        a.check_in_time,
        COUNT(DISTINCT wa.id) as current_project_assignments,
        COUNT(DISTINCT wpa.id) as current_product_assignments,
        (
          SELECT json_agg(DISTINCT p.name)
          FROM worker_assignments wa2
          JOIN projects p ON wa2.project_id = p.id
          WHERE wa2.worker_id = w.id AND wa2.date = CURRENT_DATE
        ) as assigned_project_names,
        (
          SELECT json_agg(DISTINCT prod.name)
          FROM worker_product_assignments wpa2
          JOIN product_production pp ON wpa2.product_production_id = pp.id
          JOIN products prod ON pp.product_id = prod.id
          WHERE wpa2.worker_id = w.id AND wpa2.date = CURRENT_DATE
        ) as assigned_product_names
      FROM workers w
      LEFT JOIN attendance a ON w.id = a.worker_id AND a.date = CURRENT_DATE
      LEFT JOIN worker_assignments wa ON w.id = wa.worker_id AND wa.date = CURRENT_DATE
      LEFT JOIN worker_product_assignments wpa ON w.id = wpa.worker_id AND wpa.date = CURRENT_DATE
      WHERE (a.status = 'present' OR a.status = 'half-day')
      GROUP BY w.id, a.status, a.check_in_time
      ORDER BY w.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available workers:', error);
    res.status(500).json({ error: 'Failed to fetch available workers' });
  }
});

// Mark attendance for a worker
router.post('/', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { worker_id, status, check_in_time, check_out_time, notes, date } = req.body;
  const attendanceDate = date || new Date().toISOString().split('T')[0];

  try {
    // Check if attendance already exists for today
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE worker_id = $1 AND date = $2',
      [worker_id, attendanceDate]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing attendance
      result = await pool.query(
        `UPDATE attendance 
         SET status = $1, check_in_time = $2, check_out_time = $3, notes = $4 
         WHERE worker_id = $5 AND date = $6 
         RETURNING *`,
        [status, check_in_time, check_out_time, notes, worker_id, attendanceDate]
      );
    } else {
      // Insert new attendance
      result = await pool.query(
        `INSERT INTO attendance (worker_id, status, check_in_time, check_out_time, notes, date) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [worker_id, status, check_in_time, check_out_time, notes, attendanceDate]
      );
    }

    // Get worker details
    const workerResult = await pool.query('SELECT name FROM workers WHERE id = $1', [worker_id]);
    
    res.status(201).json({
      ...result.rows[0],
      worker_name: workerResult.rows[0].name
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Bulk mark attendance
router.post('/bulk', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { attendance_records } = req.body; // Array of {worker_id, status, check_in_time, notes}
  const date = new Date().toISOString().split('T')[0];

  try {
    const results = [];
    
    for (const record of attendance_records) {
      const { worker_id, status, check_in_time, notes } = record;
      
      const result = await pool.query(
        `INSERT INTO attendance (worker_id, status, check_in_time, notes, date) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (worker_id, date) 
         DO UPDATE SET status = $2, check_in_time = $3, notes = $4
         RETURNING *`,
        [worker_id, status, check_in_time, notes, date]
      );
      
      results.push(result.rows[0]);
    }

    res.status(201).json({ message: 'Attendance marked successfully', count: results.length });
  } catch (error) {
    console.error('Error bulk marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Update attendance
router.put('/:id', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { status, check_in_time, check_out_time, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE attendance 
       SET status = $1, check_in_time = $2, check_out_time = $3, notes = $4 
       WHERE id = $5 
       RETURNING *`,
      [status, check_in_time, check_out_time, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// Delete attendance
router.delete('/:id', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM attendance WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
});

// Assign worker to project (after attendance is marked)
router.post('/assign', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { worker_id, project_id, machine_id, machine_assigned, notes, date } = req.body;
  const assignmentDate = date || new Date().toISOString().split('T')[0];

  try {
    // Check if worker is present today
    const attendanceCheck = await pool.query(
      `SELECT * FROM attendance 
       WHERE worker_id = $1 AND date = $2 AND (status = 'present' OR status = 'half-day')`,
      [worker_id, assignmentDate]
    );

    if (attendanceCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Worker must be marked present before assignment' });
    }

    const result = await pool.query(
      `INSERT INTO worker_assignments (worker_id, project_id, machine_id, machine_assigned, notes, date, assigned_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (worker_id, project_id, date)
       DO UPDATE SET machine_id = $3, machine_assigned = $4, notes = $5
       RETURNING *`,
      [worker_id, project_id, machine_id, machine_assigned, notes, assignmentDate, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning worker:', error);
    res.status(500).json({ error: 'Failed to assign worker' });
  }
});

// Get project assignments for today
router.get('/assignments/today', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.status as project_status,
        json_agg(
          json_build_object(
            'worker_id', w.id,
            'worker_name', w.name,
            'worker_phone', w.phone,
            'machine_assigned', wa.machine_assigned,
            'assignment_notes', wa.notes,
            'attendance_status', a.status
          )
        ) as assigned_workers
      FROM projects p
      LEFT JOIN worker_assignments wa ON p.id = wa.project_id AND wa.date = CURRENT_DATE
      LEFT JOIN workers w ON wa.worker_id = w.id
      LEFT JOIN attendance a ON w.id = a.worker_id AND a.date = CURRENT_DATE
      WHERE p.status = 'active'
      GROUP BY p.id, p.name, p.status
      ORDER BY p.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching project assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get assignments for a specific project (updated to include product assignments)
router.get('/assignments/project/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(`
      SELECT 
        wa.*,
        w.name as worker_name,
        w.phone as worker_phone,
        a.status as attendance_status,
        a.check_in_time,
        a.check_out_time,
        m.name as machine_name,
        m.type as machine_type,
        (
          SELECT json_agg(
            json_build_object(
              'product_id', pp.product_id,
              'product_name', prod.name,
              'product_assignment_id', wpa.id
            )
          )
          FROM worker_product_assignments wpa
          JOIN product_production pp ON wpa.product_production_id = pp.id AND pp.project_id = $1
          JOIN products prod ON pp.product_id = prod.id
          WHERE wpa.worker_id = w.id AND wpa.date = $2
        ) as product_assignments
      FROM worker_assignments wa
      JOIN workers w ON wa.worker_id = w.id
      LEFT JOIN attendance a ON w.id = a.worker_id AND a.date = wa.date
      LEFT JOIN machines m ON wa.machine_id = m.id
      WHERE wa.project_id = $1 AND wa.date = $2
      ORDER BY w.name
    `, [projectId, targetDate]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching project assignments:', error);
    res.status(500).json({ error: 'Failed to fetch project assignments' });
  }
});

// Remove worker assignment
router.delete('/assignments/:id', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM worker_assignments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

module.exports = router;