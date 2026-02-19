const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dllc-hr-secret-key-change-in-production';

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const result = await pool.query(
      'SELECT u.id, u.email, u.role, e.id as employee_id FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      employee_id: result.rows[0].employee_id
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Role-based authorization
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Check if user owns the resource or is admin/HR
const checkOwnership = (resourceEmployeeIdParam = 'employee_id') => {
  return (req, res, next) => {
    const { role, employee_id } = req.user;
    
    // Admin, Director, and HR can access all
    if (['Admin', 'Director', 'HR'].includes(role)) {
      return next();
    }
    
    // Employee can only access their own data
    const resourceEmployeeId = req.params[resourceEmployeeIdParam] || req.body[resourceEmployeeIdParam] || req.query[resourceEmployeeIdParam];
    
    if (!resourceEmployeeId || resourceEmployeeId !== employee_id) {
      return res.status(403).json({ error: 'Access denied to this resource' });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  checkOwnership,
  JWT_SECRET
};