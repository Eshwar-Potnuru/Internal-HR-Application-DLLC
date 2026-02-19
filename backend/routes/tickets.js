const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Create ticket
router.post('/', authenticate, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const { subject, description } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const result = await pool.query(
      'INSERT INTO tickets (employee_id, subject, description) VALUES ($1, $2, $3) RETURNING *',
      [employee_id, subject, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get tickets
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, employee_id } = req.user;
    const { status } = req.query;

    let query = `
      SELECT t.*, e.full_name, e.employee_id as emp_code, u.email as resolver_email
      FROM tickets t
      LEFT JOIN employees e ON t.employee_id = e.id
      LEFT JOIN users u ON t.resolved_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Employee can only see their own tickets
    if (role === 'Employee') {
      params.push(employee_id);
      query += ` AND t.employee_id = $${params.length}`;
    }

    // Filter by status
    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Update ticket status
router.patch('/:id/status', authenticate, authorize('Admin', 'Director', 'HR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Open', 'In Progress', 'Closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE tickets SET status = $1, resolved_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

module.exports = router;