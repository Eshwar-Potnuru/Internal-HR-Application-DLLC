const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// Get all employees (role-based filtering)
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, employee_id } = req.user;
    const { status, department } = req.query;

    let query = `
      SELECT e.*, u.email, u.role as user_role
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Employee can only see themselves
    if (role === 'Employee') {
      params.push(employee_id);
      query += ` AND e.id = $${params.length}`;
    }

    // Filter by status
    if (status) {
      params.push(status);
      query += ` AND e.status = $${params.length}`;
    }

    // Filter by department
    if (department) {
      params.push(department);
      query += ` AND e.department = $${params.length}`;
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to get employees' });
  }
});

// Get single employee
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employee_id } = req.user;

    // Employee can only see themselves
    if (role === 'Employee' && id !== employee_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT e.*, u.email, u.role as user_role FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE e.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to get employee' });
  }
});

// Update employee
router.put('/:id', authenticate, authorize('Admin', 'Director', 'HR'), auditLog('UPDATE', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, department, phone, join_date, notes } = req.body;

    const result = await pool.query(
      'UPDATE employees SET full_name = COALESCE($1, full_name), department = COALESCE($2, department), phone = COALESCE($3, phone), join_date = COALESCE($4, join_date), notes = COALESCE($5, notes) WHERE id = $6 RETURNING *',
      [full_name, department, phone, join_date, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Update employee status (suspend/activate)
router.patch('/:id/status', authenticate, authorize('Admin', 'Director'), auditLog('STATUS_CHANGE', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Suspended', 'Terminated'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE employees SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;