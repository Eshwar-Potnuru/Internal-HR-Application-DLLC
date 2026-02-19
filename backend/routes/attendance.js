const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Check-in
router.post('/checkin', authenticate, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employee_id, today]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const result = await pool.query(
      'INSERT INTO attendance (employee_id, check_in, date) VALUES ($1, CURRENT_TIMESTAMP, $2) RETURNING *',
      [employee_id, today]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// Check-out
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      'UPDATE attendance SET check_out = CURRENT_TIMESTAMP WHERE employee_id = $1 AND date = $2 AND check_out IS NULL RETURNING *',
      [employee_id, today]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No active check-in found for today' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Check-out failed' });
  }
});

// Get attendance records
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, employee_id } = req.user;
    const { start_date, end_date, employee_id: queryEmployeeId } = req.query;

    let query = `
      SELECT a.*, e.full_name, e.employee_id as emp_code
      FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    // Employee can only see their own records
    if (role === 'Employee') {
      params.push(employee_id);
      query += ` AND a.employee_id = $${params.length}`;
    } else if (queryEmployeeId) {
      params.push(queryEmployeeId);
      query += ` AND a.employee_id = $${params.length}`;
    }

    // Date filters
    if (start_date) {
      params.push(start_date);
      query += ` AND a.date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND a.date <= $${params.length}`;
    }

    query += ' ORDER BY a.date DESC, a.check_in DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to get attendance records' });
  }
});

// Get today's attendance status
router.get('/today', authenticate, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employee_id, today]
    );

    if (result.rows.length === 0) {
      return res.json({ checked_in: false });
    }

    const record = result.rows[0];
    res.json({
      checked_in: true,
      checked_out: !!record.check_out,
      check_in: record.check_in,
      check_out: record.check_out
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ error: 'Failed to get attendance status' });
  }
});

module.exports = router;