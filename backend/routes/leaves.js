const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { sendLeaveApprovalEmail } = require('../utils/email');

const router = express.Router();

// Apply for leave
router.post('/', authenticate, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const { leave_type, start_date, end_date, reason, document_url } = req.body;

    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Medical leave requires document
    if (leave_type === 'Medical' && !document_url) {
      return res.status(400).json({ error: 'Medical certificate required for medical leave' });
    }

    const result = await pool.query(
      'INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, document_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employee_id, leave_type, start_date, end_date, reason, document_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ error: 'Failed to apply for leave' });
  }
});

// Get leave records (with pagination)
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, employee_id } = req.user;
    const { status, employee_id: queryEmployeeId, page = 1, limit = 10 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT l.*, e.full_name, e.employee_id as emp_code, u.email as approver_email
      FROM leaves l
      LEFT JOIN employees e ON l.employee_id = e.id
      LEFT JOIN users u ON l.approved_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Employee can only see their own leaves
    if (role === 'Employee') {
      params.push(employee_id);
      query += ` AND l.employee_id = $${params.length}`;
    } else if (queryEmployeeId) {
      params.push(queryEmployeeId);
      query += ` AND l.employee_id = $${params.length}`;
    }

    // Filter by status
    if (status) {
      params.push(status);
      query += ` AND l.status = $${params.length}`;
    }

    // Get total count
    const countQuery = query.replace('SELECT l.*, e.full_name, e.employee_id as emp_code, u.email as approver_email', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Add pagination
    params.push(parseInt(limit));
    query += ` ORDER BY l.created_at DESC LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    
    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ error: 'Failed to get leave records' });
  }
});

// Approve leave
router.patch('/:id/approve', authenticate, authorize('Admin', 'Director', 'HR'), auditLog('APPROVE', 'leave'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const result = await pool.query(
      'UPDATE leaves SET status = $1, approved_by = $2, comments = $3 WHERE id = $4 RETURNING *',
      ['Approved', req.user.id, comments, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    // Get employee email
    const empResult = await pool.query(
      'SELECT u.email FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = $1',
      [result.rows[0].employee_id]
    );

    if (empResult.rows.length > 0) {
      await sendLeaveApprovalEmail(
        empResult.rows[0].email,
        result.rows[0].leave_type,
        'Approved',
        comments
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ error: 'Failed to approve leave' });
  }
});

// Reject leave
router.patch('/:id/reject', authenticate, authorize('Admin', 'Director', 'HR'), auditLog('REJECT', 'leave'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const result = await pool.query(
      'UPDATE leaves SET status = $1, approved_by = $2, comments = $3 WHERE id = $4 RETURNING *',
      ['Rejected', req.user.id, comments, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    // Get employee email
    const empResult = await pool.query(
      'SELECT u.email FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = $1',
      [result.rows[0].employee_id]
    );

    if (empResult.rows.length > 0) {
      await sendLeaveApprovalEmail(
        empResult.rows[0].email,
        result.rows[0].leave_type,
        'Rejected',
        comments
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ error: 'Failed to reject leave' });
  }
});

module.exports = router;