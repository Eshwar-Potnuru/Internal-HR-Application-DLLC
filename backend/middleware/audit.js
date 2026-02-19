const pool = require('../db');

// Audit log middleware
const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log audit if request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const targetId = req.params.id || req.params.employee_id || data?.id || null;
        const details = {
          method: req.method,
          path: req.path,
          body: req.body,
          params: req.params
        };
        
        pool.query(
          'INSERT INTO audit_logs (user_id, action, resource, target_id, details) VALUES ($1, $2, $3, $4, $5)',
          [req.user.id, action, resource, targetId, JSON.stringify(details)]
        ).catch(err => console.error('Audit log error:', err));
      }
      
      originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = { auditLog };