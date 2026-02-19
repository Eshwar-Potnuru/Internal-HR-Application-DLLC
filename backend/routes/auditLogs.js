const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get audit logs (Admin/Director only)
router.get('/', authenticate, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const { action, resource, start_date, end_date, user_id } = req.query;

    let query = `
      SELECT a.*, u.email as user_email, e.full_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN employees e ON u.id = e.user_id
      WHERE 1=1
    `;
    const params = [];

    // Filter by action
    if (action) {
      params.push(action);
      query += ` AND a.action = $${params.length}`;
    }

    // Filter by resource
    if (resource) {
      params.push(resource);
      query += ` AND a.resource = $${params.length}`;
    }

    // Filter by date range
    if (start_date) {
      params.push(start_date);
      query += ` AND a.created_at >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND a.created_at <= $${params.length}`;
    }

    // Filter by user
    if (user_id) {
      params.push(user_id);
      query += ` AND a.user_id = $${params.length}`;
    }

    query += ' ORDER BY a.created_at DESC LIMIT 500';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

module.exports = router;