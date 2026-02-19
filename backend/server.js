const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Import database connection
const pool = require('./db');

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const employeesRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leavesRoutes = require('./routes/leaves');
const salaryRoutes = require('./routes/salary');
const documentsRoutes = require('./routes/documents');
const announcementsRoutes = require('./routes/announcements');
const ticketsRoutes = require('./routes/tickets');
const auditLogsRoutes = require('./routes/auditLogs');
const reportsRoutes = require('./routes/reports');
const cardsRoutes = require('./routes/cards');
const demoRoutes = require('./routes/demo');
const passwordResetRoutes = require('./routes/passwordReset');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = pool;