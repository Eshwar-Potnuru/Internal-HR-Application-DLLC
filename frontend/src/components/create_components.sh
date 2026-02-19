#!/bin/bash

# Create Attendance component
cat > /app/frontend/src/components/Attendance.js << 'EOF'
import React from 'react';

const Attendance = ({ user }) => {
  return (
    <div className="space-y-6" data-testid="attendance-page">
      <h2 className="text-3xl font-heading font-bold">Attendance</h2>
      <div className="bg-card p-6 rounded-lg border">
        <p>Attendance tracking module - View your attendance history here</p>
      </div>
    </div>
  );
};

export default Attendance;
EOF

# Create Leaves component
cat > /app/frontend/src/components/Leaves.js << 'EOF'
import React from 'react';

const Leaves = ({ user }) => {
  return (
    <div className="space-y-6" data-testid="leaves-page">
      <h2 className="text-3xl font-heading font-bold">Leave Management</h2>
      <div className="bg-card p-6 rounded-lg border">
        <p>Apply for leave and track your leave requests</p>
      </div>
    </div>
  );
};

export default Leaves;
EOF

# Create Salary component
cat > /app/frontend/src/components/Salary.js << 'EOF'
import React from 'react';

const Salary = ({ user }) => {
  return (
    <div className="space-y-6" data-testid="salary-page">
      <h2 className="text-3xl font-heading font-bold">Salary & Payroll</h2>
      <div className="bg-card p-6 rounded-lg border">
        <p>View your salary information and download payslips</p>
      </div>
    </div>
  );
};

export default Salary;
EOF

# Create Documents component
cat > /app/frontend/src/components/Documents.js << 'EOF'
import React from 'react';

const Documents = ({ user }) => {
  return (
    <div className="space-y-6" data-testid="documents-page">
      <h2 className="text-3xl font-heading font-bold">Documents</h2>
      <div className="bg-card p-6 rounded-lg border">
        <p>Upload and manage your documents</p>
      </div>
    </div>
  );
};

export default Documents;
EOF

# Create Announcements component
cat > /app/frontend/src/components/Announcements.js << 'EOF'
import React from 'react';

const Announcements = ({ user }) => {
  return (
    <div className="space-y-6" data-testid="announcements-page">
      <h2 className="text-3xl font-heading font-bold">Announcements</h2>
      <div className="bg-card p-6 rounded-lg border">
        <p>Company announcements and updates</p>
      </div>
    </div>
  );
};

export default Announcements;
EOF

# Create Tickets component
cat > /app/frontend/src/components/Tickets.js << 'EOF'
import React from 'react';

const Tickets = ({ user }) => {
  return (
    <div className="space-y-6" data-testid="tickets-page">
      <h2 className="text-3xl font-heading font-bold">Support Tickets</h2>
      <div className="bg-card p-6 rounded-lg border">
        <p>Submit and track support tickets</p>
      </div>
    </div>
  );
};

export default Tickets;
EOF

# Create AuditLogs component
cat > /app/frontend/src/components/AuditLogs.js << 'EOF'
import React from 'react';

const AuditLogs = ({ user }) => {
  return (
    <div className="space-y-6" data-testid="audit-logs-page">
      <h2 className="text-3xl font-heading font-bold">Audit Logs</h2>
      <div className="bg-card p-6 rounded-lg border">
        <p>System audit logs and activity tracking</p>
      </div>
    </div>
  );
};

export default AuditLogs;
EOF

# Create Reports component
cat > /app/frontend/src/components/Reports.js << 'EOF'
import React from 'react';

const Reports = ({ user }) => {
  return (
    <div className="space-y-6" data-testid="reports-page">
      <h2 className="text-3xl font-heading font-bold">Reports</h2>
      <div className="bg-card p-6 rounded-lg border">
        <p>Generate and view HR reports</p>
      </div>
    </div>
  );
};

export default Reports;
EOF

# Create IDCards component
cat > /app/frontend/src/components/IDCards.js << 'EOF'
import React from 'react';

const IDCards = ({ user }) => {
  return (
    <div className="space-y-6" data-testid="id-cards-page">
      <h2 className="text-3xl font-heading font-bold">ID & Business Cards</h2>
      <div className="bg-card p-6 rounded-lg border">
        <p>Generate ID cards and business cards</p>
      </div>
    </div>
  );
};

export default IDCards;
EOF

# Create Settings component
cat > /app/frontend/src/components/Settings.js << 'EOF'
import React from 'react';

const Settings = ({ user }) => {
  return (
    <div className="space-y-6" data-testid="settings-page">
      <h2 className="text-3xl font-heading font-bold">Settings</h2>
      <div className="bg-card p-6 rounded-lg border">
        <p>System settings and configuration</p>
      </div>
    </div>
  );
};

export default Settings;
EOF

echo "All components created successfully"
