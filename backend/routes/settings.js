const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

// Get all settings
router.get('/', authenticate, async (req, res) => {
  try {
    // Only Admin/Director can access settings
    if (!['Admin', 'Director'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await pool.query('SELECT * FROM company_settings ORDER BY category, setting_key');
    
    // Group settings by category
    const settings = result.rows.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = {};
      }
      acc[row.category][row.setting_key] = {
        value: row.setting_value,
        type: row.value_type,
        updated_at: row.updated_at
      };
      return acc;
    }, {});

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update settings
router.put('/', authenticate, async (req, res) => {
  try {
    // Only Admin/Director can update settings
    if (!['Admin', 'Director'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { category, settings } = req.body;

    if (!category || !settings) {
      return res.status(400).json({ error: 'Category and settings are required' });
    }

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO company_settings (category, setting_key, setting_value, value_type, updated_at, updated_by)
         VALUES ($1, $2, $3, $4, NOW(), $5)
         ON CONFLICT (category, setting_key) 
         DO UPDATE SET setting_value = $3, updated_at = NOW(), updated_by = $5`,
        [category, key, JSON.stringify(value), typeof value, req.user.userId]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get specific category settings
router.get('/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM company_settings WHERE category = $1',
      [category]
    );

    const settings = result.rows.reduce((acc, row) => {
      try {
        acc[row.setting_key] = JSON.parse(row.setting_value);
      } catch {
        acc[row.setting_key] = row.setting_value;
      }
      return acc;
    }, {});

    res.json(settings);
  } catch (error) {
    console.error('Get category settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Initialize default settings
router.post('/initialize', authenticate, async (req, res) => {
  try {
    if (!['Admin', 'Director'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const defaultSettings = [
      // Branding
      { category: 'branding', key: 'company_name', value: 'DL Law Corporation', type: 'string' },
      { category: 'branding', key: 'company_short_name', value: 'DLLC', type: 'string' },
      { category: 'branding', key: 'company_address', value: '10 Anson Road, #20-08 International Plaza, Singapore 079903', type: 'string' },
      { category: 'branding', key: 'company_phone', value: '+65 6222 8988', type: 'string' },
      { category: 'branding', key: 'company_email', value: 'info@dllc.com', type: 'string' },
      { category: 'branding', key: 'primary_color', value: '#1c2a49', type: 'string' },
      { category: 'branding', key: 'secondary_color', value: '#f0a500', type: 'string' },
      
      // Leave Policies
      { category: 'leave_policies', key: 'annual_leave_days', value: 14, type: 'number' },
      { category: 'leave_policies', key: 'sick_leave_days', value: 14, type: 'number' },
      { category: 'leave_policies', key: 'medical_leave_days', value: 60, type: 'number' },
      { category: 'leave_policies', key: 'maternity_leave_days', value: 112, type: 'number' },
      { category: 'leave_policies', key: 'paternity_leave_days', value: 14, type: 'number' },
      { category: 'leave_policies', key: 'compassionate_leave_days', value: 3, type: 'number' },
      { category: 'leave_policies', key: 'unpaid_leave_days', value: 30, type: 'number' },
      { category: 'leave_policies', key: 'carry_forward_enabled', value: true, type: 'boolean' },
      { category: 'leave_policies', key: 'max_carry_forward_days', value: 5, type: 'number' },
      { category: 'leave_policies', key: 'probation_leave_enabled', value: false, type: 'boolean' },
      
      // Payroll Settings
      { category: 'payroll', key: 'pay_cycle', value: 'monthly', type: 'string' },
      { category: 'payroll', key: 'pay_day', value: 28, type: 'number' },
      { category: 'payroll', key: 'currency', value: 'SGD', type: 'string' },
      { category: 'payroll', key: 'currency_symbol', value: 'S$', type: 'string' },
      { category: 'payroll', key: 'cpf_enabled', value: true, type: 'boolean' },
      { category: 'payroll', key: 'cpf_employee_rate', value: 20, type: 'number' },
      { category: 'payroll', key: 'cpf_employer_rate', value: 17, type: 'number' },
      { category: 'payroll', key: 'overtime_rate', value: 1.5, type: 'number' },
      { category: 'payroll', key: 'tax_enabled', value: true, type: 'boolean' },
      
      // Working Hours
      { category: 'working_hours', key: 'work_days', value: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], type: 'array' },
      { category: 'working_hours', key: 'start_time', value: '09:00', type: 'string' },
      { category: 'working_hours', key: 'end_time', value: '18:00', type: 'string' },
      { category: 'working_hours', key: 'lunch_start', value: '12:00', type: 'string' },
      { category: 'working_hours', key: 'lunch_duration', value: 60, type: 'number' },
      { category: 'working_hours', key: 'flexible_hours', value: false, type: 'boolean' },
      { category: 'working_hours', key: 'core_hours_start', value: '10:00', type: 'string' },
      { category: 'working_hours', key: 'core_hours_end', value: '16:00', type: 'string' },
      { category: 'working_hours', key: 'overtime_threshold', value: 44, type: 'number' },
    ];

    for (const setting of defaultSettings) {
      await pool.query(
        `INSERT INTO company_settings (category, setting_key, setting_value, value_type, updated_at, updated_by)
         VALUES ($1, $2, $3, $4, NOW(), $5)
         ON CONFLICT (category, setting_key) DO NOTHING`,
        [setting.category, setting.key, JSON.stringify(setting.value), setting.type, req.user.userId]
      );
    }

    res.json({ message: 'Default settings initialized successfully' });
  } catch (error) {
    console.error('Initialize settings error:', error);
    res.status(500).json({ error: 'Failed to initialize settings' });
  }
});

module.exports = router;
