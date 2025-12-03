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
        p.project_value,
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

// Get payments for a specific project with enhanced financial data
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const paymentsResult = await pool.query(`
      SELECT 
        pay.*,
        u.username as created_by_name
      FROM payments pay
      LEFT JOIN users u ON pay.created_by = u.id
      WHERE pay.project_id = $1
      ORDER BY pay.payment_date DESC
    `, [projectId]);

    // Calculate enhanced totals including project value and pending amount
    const totals = await pool.query(`
      SELECT 
        p.project_value,
        COALESCE(SUM(pay.amount), 0) as total_paid,
        COALESCE(SUM(CASE WHEN payment_type = 'advance' THEN amount ELSE 0 END), 0) as advance_paid,
        COALESCE(SUM(CASE WHEN payment_type = 'partial' THEN amount ELSE 0 END), 0) as partial_paid,
        COALESCE(SUM(CASE WHEN payment_type = 'final' THEN amount ELSE 0 END), 0) as final_paid,
        COALESCE(p.project_value, 0) - COALESCE(SUM(pay.amount), 0) as pending_amount
      FROM projects p
      LEFT JOIN payments pay ON p.id = pay.project_id
      WHERE p.id = $1
      GROUP BY p.id, p.project_value
    `, [projectId]);

    res.json({
      payments: paymentsResult.rows,
      totals: totals.rows[0] || {
        project_value: 0,
        total_paid: 0,
        advance_paid: 0,
        partial_paid: 0,
        final_paid: 0,
        pending_amount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching project payments:', error);
    res.status(500).json({ error: 'Failed to fetch project payments' });
  }
});

// Get pending payments with enhanced financial data
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.client_name,
        p.client_phone,
        p.status,
        p.expected_delivery_date,
        p.actual_delivery_date,
        p.project_value,
        COALESCE(SUM(pay.amount), 0) as total_paid,
        COALESCE(SUM(CASE WHEN pay.payment_type = 'advance' THEN pay.amount ELSE 0 END), 0) as advance_paid,
        COALESCE(SUM(CASE WHEN pay.payment_type = 'partial' THEN pay.amount ELSE 0 END), 0) as partial_paid,
        COALESCE(SUM(CASE WHEN pay.payment_type = 'final' THEN pay.amount ELSE 0 END), 0) as final_paid,
        COALESCE(p.project_value, 0) - COALESCE(SUM(pay.amount), 0) as pending_amount,
        p.created_at as project_created_at
      FROM projects p
      LEFT JOIN payments pay ON p.id = pay.project_id
      WHERE p.status IN ('payment-pending', 'finished-production', 'started', 'received')
        AND (p.project_value > 0 OR p.status = 'payment-pending')
      GROUP BY p.id, p.name, p.client_name, p.client_phone, p.status, 
               p.expected_delivery_date, p.actual_delivery_date, p.project_value, p.created_at
      HAVING COALESCE(p.project_value, 0) - COALESCE(SUM(pay.amount), 0) > 0
         OR p.status = 'payment-pending'
      ORDER BY p.expected_delivery_date ASC, pending_amount DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// Get payment statistics and overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const overview = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(DISTINCT CASE WHEN p.status IN ('payment-pending', 'finished-production', 'started', 'received') 
              AND (COALESCE(p.project_value, 0) - COALESCE((
                SELECT SUM(amount) FROM payments WHERE project_id = p.id
              ), 0)) > 0 THEN p.id END) as pending_payment_projects,
        COALESCE(SUM(p.project_value), 0) as total_project_value,
        COALESCE(SUM(pay.total_paid), 0) as total_received,
        COALESCE(SUM(p.project_value), 0) - COALESCE(SUM(pay.total_paid), 0) as total_pending
      FROM projects p
      LEFT JOIN (
        SELECT project_id, SUM(amount) as total_paid
        FROM payments
        GROUP BY project_id
      ) pay ON p.id = pay.project_id
    `);

    // Monthly payment breakdown
    const monthlyBreakdown = await pool.query(`
      SELECT 
        DATE_TRUNC('month', payment_date) as month,
        COUNT(*) as payment_count,
        SUM(amount) as total_amount,
        SUM(CASE WHEN payment_type = 'advance' THEN amount ELSE 0 END) as advance_amount,
        SUM(CASE WHEN payment_type = 'partial' THEN amount ELSE 0 END) as partial_amount,
        SUM(CASE WHEN payment_type = 'final' THEN amount ELSE 0 END) as final_amount
      FROM payments
      WHERE payment_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', payment_date)
      ORDER BY month DESC
    `);

    res.json({
      overview: overview.rows[0],
      monthlyBreakdown: monthlyBreakdown.rows
    });
  } catch (error) {
    console.error('Error fetching payment overview:', error);
    res.status(500).json({ error: 'Failed to fetch payment overview' });
  }
});

// Create new payment
router.post('/', authenticateToken, authorizeRole('owner', 'supervisor'), async (req, res) => {
  const { project_id, amount, payment_type, payment_method, payment_date, transaction_reference, notes } = req.body;

  try {
    // Validate that project exists
    const projectCheck = await pool.query(
      'SELECT id, project_value FROM projects WHERE id = $1',
      [project_id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await pool.query(
      `INSERT INTO payments (project_id, amount, payment_type, payment_method, payment_date, transaction_reference, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [project_id, amount, payment_type, payment_method, payment_date, transaction_reference, notes, req.user.id]
    );

    // Update project status if needed
    await updateProjectPaymentStatus(project_id, req.user.id);

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
    // Get the original payment to check project_id
    const originalPayment = await pool.query(
      'SELECT project_id FROM payments WHERE id = $1',
      [id]
    );

    if (originalPayment.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const result = await pool.query(
      `UPDATE payments 
       SET amount = $1, payment_type = $2, payment_method = $3, payment_date = $4, transaction_reference = $5, notes = $6
       WHERE id = $7 RETURNING *`,
      [amount, payment_type, payment_method, payment_date, transaction_reference, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update project status based on new payment data
    await updateProjectPaymentStatus(originalPayment.rows[0].project_id, req.user.id);

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
    // Get the payment details before deletion
    const payment = await pool.query(
      'SELECT project_id FROM payments WHERE id = $1',
      [id]
    );

    if (payment.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const projectId = payment.rows[0].project_id;

    const result = await pool.query(
      'DELETE FROM payments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update project status after payment deletion
    await updateProjectPaymentStatus(projectId, req.user.id);

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// Helper function to update project payment status
async function updateProjectPaymentStatus(projectId, userId) {
  try {
    const projectData = await pool.query(
      `SELECT p.project_value, COALESCE(SUM(pay.amount), 0) as total_paid
       FROM projects p
       LEFT JOIN payments pay ON p.id = pay.project_id
       WHERE p.id = $1
       GROUP BY p.id, p.project_value`,
      [projectId]
    );

    if (projectData.rows.length === 0) return;

    const projectValue = parseFloat(projectData.rows[0].project_value || 0);
    const totalPaid = parseFloat(projectData.rows[0].total_paid || 0);

    let newStatus = 'started'; // default status

    if (projectValue > 0) {
      const paymentPercentage = (totalPaid / projectValue) * 100;

      if (paymentPercentage >= 95) {
        newStatus = 'closed';
      } else if (paymentPercentage >= 50) {
        newStatus = 'finished-production';
      } else if (paymentPercentage > 0) {
        newStatus = 'started';
      }
    }

    // Update project status
    await pool.query(
      'UPDATE projects SET status = $1 WHERE id = $2',
      [newStatus, projectId]
    );

    // Add timeline entry if status changed
    const currentStatus = await pool.query(
      'SELECT status FROM projects WHERE id = $1',
      [projectId]
    );

    if (currentStatus.rows.length > 0 && currentStatus.rows[0].status !== newStatus) {
      await pool.query(
        'INSERT INTO project_timeline (project_id, status, notes, changed_by) VALUES ($1, $2, $3, $4)',
        [projectId, newStatus, `Payment status updated - ${paymentPercentage.toFixed(1)}% paid`, userId]
      );
    }
  } catch (error) {
    console.error('Error updating project payment status:', error);
  }
}

module.exports = router;