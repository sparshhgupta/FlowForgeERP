const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all payments with project details
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        pay.*,
        p.name as project_name,
        p.status as project_status,
        u.username as created_by_name
      FROM payments pay
      JOIN projects p ON pay.project_id = p.id
      LEFT JOIN users u ON pay.created_by = u.id
      ORDER BY pay.payment_date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payments for a specific project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        pay.*,
        u.username as created_by_name
      FROM payments pay
      LEFT JOIN users u ON pay.created_by = u.id
      WHERE pay.project_id = $1
      ORDER BY pay.payment_date DESC
    `, [projectId]);

    // Calculate totals
    const totals = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_paid,
        COALESCE(SUM(CASE WHEN payment_type = 'advance' THEN amount ELSE 0 END), 0) as advance_paid,
        COALESCE(SUM(CASE WHEN payment_type = 'partial' THEN amount ELSE 0 END), 0) as partial_paid,
        COALESCE(SUM(CASE WHEN payment_type = 'final' THEN amount ELSE 0 END), 0) as final_paid
      FROM payments
      WHERE project_id = $1
    `, [projectId]);

    res.json({
      payments: result.rows,
      totals: totals.rows[0]
    });
  } catch (error) {
    console.error('Error fetching project payments:', error);
    res.status(500).json({ error: 'Failed to fetch project payments' });
  }
});

// Get pending payments (projects with payment-pending status)
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.client_name,
        p.client_phone,
        p.expected_delivery_date,
        p.actual_delivery_date,
        COALESCE(SUM(pay.amount), 0) as total_paid,
        p.created_at as project_created_at
      FROM projects p
      LEFT JOIN payments pay ON p.id = pay.project_id
      WHERE p.status IN ('payment-pending', 'finished-production')
      GROUP BY p.id, p.name, p.client_name, p.client_phone, p.expected_delivery_date, p.actual_delivery_date, p.created_at
      ORDER BY p.expected_delivery_date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// Create new payment
router.post('/', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { project_id, amount, payment_type, payment_method, payment_date, transaction_reference, notes } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO payments (project_id, amount, payment_type, payment_method, payment_date, transaction_reference, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [project_id, amount, payment_type, payment_method, payment_date, transaction_reference, notes, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update payment
router.put('/:id', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { id } = req.params;
  const { amount, payment_type, payment_method, payment_date, transaction_reference, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE payments 
       SET amount = $1, payment_type = $2, payment_method = $3, payment_date = $4, transaction_reference = $5, notes = $6
       WHERE id = $7 RETURNING *`,
      [amount, payment_type, payment_method, payment_date, transaction_reference, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Delete payment
router.delete('/:id', authenticateToken, authorizeRole('owner'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM payments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

module.exports = router;