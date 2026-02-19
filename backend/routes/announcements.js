const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// Create announcement
router.post('/', authenticate, authorize('Admin', 'Director', 'HR'), auditLog('CREATE', 'announcement'), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await pool.query(
      'INSERT INTO announcements (title, content, created_by) VALUES ($1, $2, $3) RETURNING *',
      [title, content, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Get announcements
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.email as creator_email, e.full_name as creator_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN employees e ON u.id = e.user_id
      ORDER BY a.created_at DESC
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
});

// Delete announcement
router.delete('/:id', authenticate, authorize('Admin', 'Director'), auditLog('DELETE', 'announcement'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;