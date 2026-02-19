const express = require('express');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const pool = require('../db');

dotenv.config();

const router = express.Router();

const DEMO_USERS = [
  {
    email: 'director@dllc.com',
    password: 'demo123',
    role: 'Director',
    full_name: 'Anil Lalwani',
    employee_id: 'DLLC001',
    department: 'Executive',
    phone: '+65 6535 0959',
    join_date: '2010-01-15'
  },
  {
    email: 'admin@dllc.com',
    password: 'demo123',
    role: 'Admin',
    full_name: 'Sarah Chen',
    employee_id: 'DLLC002',
    department: 'Administration',
    phone: '+65 6557 0215',
    join_date: '2015-03-20'
  },
  {
    email: 'hr@dllc.com',
    password: 'demo123',
    role: 'HR',
    full_name: 'Priya Kumar',
    employee_id: 'DLLC003',
    department: 'Human Resources',
    phone: '+65 6557 0216',
    join_date: '2018-06-10'
  },
  {
    email: 'finance@dllc.com',
    password: 'demo123',
    role: 'Finance',
    full_name: 'David Tan',
    employee_id: 'DLLC004',
    department: 'Finance',
    phone: '+65 6557 0217',
    join_date: '2017-09-05'
  },
  {
    email: 'john.doe@dllc.com',
    password: 'demo123',
    role: 'Employee',
    full_name: 'John Doe',
    employee_id: 'DLLC101',
    department: 'Legal',
    phone: '+65 6557 0220',
    join_date: '2020-01-15'
  },
  {
    email: 'jane.smith@dllc.com',
    password: 'demo123',
    role: 'Employee',
    full_name: 'Jane Smith',
    employee_id: 'DLLC102',
    department: 'Legal',
    phone: '+65 6557 0221',
    join_date: '2020-03-20'
  },
  {
    email: 'michael.wong@dllc.com',
    password: 'demo123',
    role: 'Employee',
    full_name: 'Michael Wong',
    employee_id: 'DLLC103',
    department: 'Corporate',
    phone: '+65 6557 0222',
    join_date: '2021-05-10'
  },
  {
    email: 'emily.lim@dllc.com',
    password: 'demo123',
    role: 'Employee',
    full_name: 'Emily Lim',
    employee_id: 'DLLC104',
    department: 'Litigation',
    phone: '+65 6557 0223',
    join_date: '2021-08-15'
  },
  {
    email: 'ryan.ng@dllc.com',
    password: 'demo123',
    role: 'Employee',
    full_name: 'Ryan Ng',
    employee_id: 'DLLC105',
    department: 'Corporate',
    phone: '+65 6557 0224',
    join_date: '2022-02-01'
  },
  {
    email: 'sophia.tan@dllc.com',
    password: 'demo123',
    role: 'Employee',
    full_name: 'Sophia Tan',
    employee_id: 'DLLC106',
    department: 'Legal',
    phone: '+65 6557 0225',
    join_date: '2022-06-20'
  }
];

// Load demo users
router.post('/load-users', async (req, res) => {
  try {
    const createdUsers = [];
    const updatedUsers = [];

    for (const demoUser of DEMO_USERS) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Check if user already exists
        const existing = await client.query('SELECT id FROM users WHERE email = $1', [demoUser.email]);
        const password_hash = await bcrypt.hash(demoUser.password, 10);
        
        if (existing.rows.length > 0) {
          const userId = existing.rows[0].id;

          await client.query(
            'UPDATE users SET password_hash = $1, role = $2 WHERE id = $3',
            [password_hash, demoUser.role, userId]
          );

          const existingEmployee = await client.query(
            'SELECT id FROM employees WHERE user_id = $1',
            [userId]
          );

          if (existingEmployee.rows.length > 0) {
            await client.query(
              'UPDATE employees SET full_name = $1, employee_id = $2, department = $3, phone = $4, join_date = $5 WHERE user_id = $6',
              [demoUser.full_name, demoUser.employee_id, demoUser.department, demoUser.phone, demoUser.join_date, userId]
            );
          } else {
            await client.query(
              'INSERT INTO employees (user_id, full_name, employee_id, department, phone, join_date) VALUES ($1, $2, $3, $4, $5, $6)',
              [userId, demoUser.full_name, demoUser.employee_id, demoUser.department, demoUser.phone, demoUser.join_date]
            );
          }

          updatedUsers.push({
            email: demoUser.email,
            role: demoUser.role,
            full_name: demoUser.full_name
          });
        } else {
          const userResult = await client.query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [demoUser.email, password_hash, demoUser.role]
          );

          const user = userResult.rows[0];

          await client.query(
            'INSERT INTO employees (user_id, full_name, employee_id, department, phone, join_date) VALUES ($1, $2, $3, $4, $5, $6)',
            [user.id, demoUser.full_name, demoUser.employee_id, demoUser.department, demoUser.phone, demoUser.join_date]
          );

          createdUsers.push({
            email: demoUser.email,
            role: demoUser.role,
            full_name: demoUser.full_name
          });
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    res.json({
      success: true,
      created_count: createdUsers.length,
      updated_count: updatedUsers.length,
      created_users: createdUsers,
      updated_users: updatedUsers,
      message: `Demo users are ready. Use password: demo123 for all accounts.`
    });
  } catch (error) {
    console.error('Load demo users error:', error);
    res.status(500).json({ error: 'Failed to load demo users' });
  }
});

// Get demo user list
router.get('/users', async (req, res) => {
  res.json({
    demo_users: DEMO_USERS.map(u => ({
      email: u.email,
      role: u.role,
      full_name: u.full_name,
      password: 'demo123'
    }))
  });
});

module.exports = router;