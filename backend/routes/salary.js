const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// Create salary entry
router.post('/', authenticate, authorize('Admin', 'Director', 'HR', 'Finance'), auditLog('CREATE', 'salary'), async (req, res) => {
  try {
    const { employee_id, basic, allowances, deductions, net, period } = req.body;

    if (!employee_id || !basic || !net || !period) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO salary_payroll (employee_id, basic, allowances, deductions, net, period) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employee_id, basic, JSON.stringify(allowances || {}), JSON.stringify(deductions || {}), net, period]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({ error: 'Failed to create salary entry' });
  }
});

// Get salary records
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, employee_id } = req.user;
    const { employee_id: queryEmployeeId, period, status } = req.query;

    let query = `
      SELECT s.*, e.full_name, e.employee_id as emp_code, e.department
      FROM salary_payroll s
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    // Employee can only see their own salary
    if (role === 'Employee') {
      params.push(employee_id);
      query += ` AND s.employee_id = $${params.length}`;
    } else if (queryEmployeeId) {
      params.push(queryEmployeeId);
      query += ` AND s.employee_id = $${params.length}`;
    }

    // Filter by period
    if (period) {
      params.push(period);
      query += ` AND s.period = $${params.length}`;
    }

    // Filter by status
    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ error: 'Failed to get salary records' });
  }
});

// Get single payslip
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employee_id } = req.user;

    let query = `
      SELECT s.*, e.full_name, e.employee_id as emp_code, e.department, e.phone
      FROM salary_payroll s
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE s.id = $1
    `;
    const params = [id];

    // Employee can only see their own payslip
    if (role === 'Employee') {
      params.push(employee_id);
      query += ` AND s.employee_id = $${params.length}`;
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payslip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({ error: 'Failed to get payslip' });
  }
});

// Update salary status
router.patch('/:id/status', authenticate, authorize('Admin', 'Director', 'Finance'), auditLog('STATUS_CHANGE', 'salary'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Paid', 'On-hold'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE salary_payroll SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update salary status error:', error);
    res.status(500).json({ error: 'Failed to update salary status' });
  }
});

module.exports = router;