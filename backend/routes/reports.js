const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Attendance report
router.get('/attendance', authenticate, authorize('Admin', 'Director', 'HR'), async (req, res) => {
  try {
    const { start_date, end_date, employee_id, department } = req.query;

    let query = `
      SELECT 
        a.id,
        a.date,
        a.check_in,
        a.check_out,
        e.full_name,
        e.employee_id as emp_code,
        e.department,
        EXTRACT(EPOCH FROM (a.check_out - a.check_in))/3600 as hours_worked
      FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND a.date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND a.date <= $${params.length}`;
    }
    if (employee_id) {
      params.push(employee_id);
      query += ` AND a.employee_id = $${params.length}`;
    }
    if (department) {
      params.push(department);
      query += ` AND e.department = $${params.length}`;
    }

    query += ' ORDER BY a.date DESC, e.full_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ error: 'Failed to generate attendance report' });
  }
});

// Leave report
router.get('/leaves', authenticate, authorize('Admin', 'Director', 'HR'), async (req, res) => {
  try {
    const { start_date, end_date, status, leave_type, department } = req.query;

    let query = `
      SELECT 
        l.id,
        l.leave_type,
        l.start_date,
        l.end_date,
        l.reason,
        l.status,
        l.created_at,
        e.full_name,
        e.employee_id as emp_code,
        e.department,
        DATE_PART('day', l.end_date - l.start_date) + 1 as days_count
      FROM leaves l
      LEFT JOIN employees e ON l.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND l.start_date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND l.end_date <= $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND l.status = $${params.length}`;
    }
    if (leave_type) {
      params.push(leave_type);
      query += ` AND l.leave_type = $${params.length}`;
    }
    if (department) {
      params.push(department);
      query += ` AND e.department = $${params.length}`;
    }

    query += ' ORDER BY l.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Leave report error:', error);
    res.status(500).json({ error: 'Failed to generate leave report' });
  }
});

// Employee report
router.get('/employees', authenticate, authorize('Admin', 'Director', 'HR'), async (req, res) => {
  try {
    const { department, status } = req.query;

    let query = `
      SELECT 
        e.id,
        e.full_name,
        e.employee_id as emp_code,
        e.department,
        e.phone,
        e.join_date,
        e.status,
        e.notes,
        u.email,
        u.role,
        COUNT(DISTINCT d.id) as document_count,
        COUNT(DISTINCT l.id) as leave_count
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN documents d ON e.id = d.employee_id
      LEFT JOIN leaves l ON e.id = l.employee_id
      WHERE 1=1
    `;
    const params = [];

    if (department) {
      params.push(department);
      query += ` AND e.department = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND e.status = $${params.length}`;
    }

    query += ' GROUP BY e.id, u.email, u.role ORDER BY e.full_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Employee report error:', error);
    res.status(500).json({ error: 'Failed to generate employee report' });
  }
});

module.exports = router;