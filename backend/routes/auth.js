const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const result = await pool.query(
      'SELECT u.*, e.id as employee_id, e.full_name FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee_id: user.employee_id,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register (Admin only)
router.post('/register', authenticate, async (req, res) => {
  try {
    const { email, password, role, full_name, employee_id, department, phone, join_date } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Only Admin or Director can create users
    if (!['Admin', 'Director'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (!normalizedEmail || !password || !role || !full_name || !employee_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [normalizedEmail, password_hash, role]
    );

    const user = userResult.rows[0];

    // Create employee record
    const empResult = await pool.query(
      'INSERT INTO employees (user_id, full_name, employee_id, department, phone, join_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user.id, full_name, employee_id, department, phone, join_date]
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      employee: empResult.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email or Employee ID already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Reset password (Admin only)
router.post('/reset-password', authenticate, async (req, res) => {
  try {
    const { user_id, new_password } = req.body;

    // Only Admin or Director can reset passwords
    if (!['Admin', 'Director'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (!user_id || !new_password) {
      return res.status(400).json({ error: 'User ID and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 10);

    // Update password
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email',
      [password_hash, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Password reset successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.id, u.email, u.role, e.id as employee_id, e.full_name, e.employee_id as emp_code, e.department, e.phone, e.status FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;