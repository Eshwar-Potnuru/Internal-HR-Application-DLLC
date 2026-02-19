const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Generate ID card data
router.get('/id-card/:employee_id', authenticate, async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { role, employee_id: userEmployeeId } = req.user;

    // Employee can only generate their own card
    if (role === 'Employee' && employee_id !== userEmployeeId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT e.*, u.email FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE e.id = $1',
      [employee_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = result.rows[0];
    
    res.json({
      full_name: employee.full_name,
      employee_id: employee.employee_id,
      department: employee.department,
      email: employee.email,
      phone: employee.phone,
      join_date: employee.join_date,
      company: 'DL Law Corporation',
      company_address: '8 Eu Tong Sen Street #20-98, Clarke Quay Central, Singapore 059818'
    });
  } catch (error) {
    console.error('Get ID card error:', error);
    res.status(500).json({ error: 'Failed to generate ID card data' });
  }
});

// Generate business card data
router.get('/business-card/:employee_id', authenticate, async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { role, employee_id: userEmployeeId } = req.user;

    // Employee can only generate their own card
    if (role === 'Employee' && employee_id !== userEmployeeId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT e.*, u.email, u.role FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE e.id = $1',
      [employee_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = result.rows[0];
    
    // Generate vCard data for QR code
    const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${employee.full_name}
ORG:DL Law Corporation
TITLE:${employee.role || employee.department}
TEL:${employee.phone || ''}
EMAIL:${employee.email || ''}
ADR:;;8 Eu Tong Sen Street #20-98;Singapore;;059818;Singapore
URL:www.dllclegal.com
END:VCARD`;

    res.json({
      full_name: employee.full_name,
      role: employee.role || employee.department,
      department: employee.department,
      email: employee.email,
      phone: employee.phone,
      company: 'DL Law Corporation',
      company_address: '8 Eu Tong Sen Street #20-98, Clarke Quay Central, Singapore 059818',
      company_website: 'www.dllclegal.com',
      company_phone: 'Tel: 6557 0215',
      company_fax: 'Fax: 6557 0206',
      vcard: vCardData
    });
  } catch (error) {
    console.error('Get business card error:', error);
    res.status(500).json({ error: 'Failed to generate business card data' });
  }
});

module.exports = router;