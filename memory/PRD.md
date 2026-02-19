# DLLC HR & Payroll Management System - PRD

## Original Problem Statement
Build a production-ready HR & Payroll web application for DL Law Corporation (DLLC). The system must be role-based, secure, multi-user, and demoable. Use a modern UI (clean, smooth, app-like), responsive, and fast.

## Tech Stack
- **Frontend**: React.js with TailwindCSS
- **Backend**: Node.js/Express
- **Database**: PostgreSQL
- **Authentication**: JWT (stateless)
- **File Storage**: Local storage (base64) with AWS S3 ready
- **Charts**: Recharts
- **PDF Generation**: jspdf, html2canvas

## Roles & Access Control
1. **Director** - Full access to all features
2. **Admin** - User management, settings, reports
3. **HR Manager** - Employee management, leaves, attendance
4. **Finance** - Payroll, salary management
5. **Employee** - Self-service portal

## Core Modules
1. ✅ Authentication (JWT-based login)
2. ✅ Advanced Analytics Dashboard (with 5 chart types)
3. ✅ Employee Management (full CRUD, search, filter, pagination)
4. ✅ Attendance Tracking (check-in/out, filters, stats)
5. ✅ Leave Management (with pagination and filtering)
6. ✅ Salary/Payroll (with PDF generation)
7. ✅ Documents (upload, categories, download)
8. ✅ Announcements
9. ✅ Support/Tickets
10. ✅ Reports
11. ✅ Audit Logs
12. ✅ ID Card & Business Card Generation

## What's Been Implemented (as of Feb 2026)

### Completed Features
- ✅ Full tech stack: React frontend + Node.js/Express backend + PostgreSQL
- ✅ Role-based authentication with JWT tokens
- ✅ **Enhanced Analytics Dashboard**:
  - 5 KPI metric cards (Employees, Leaves, Departments, Payroll, Announcements)
  - Department Distribution (donut chart)
  - Employee Status (bar chart)
  - Role Distribution (pie chart)
  - Leave Status (bar chart)
  - Leave Types (pie chart)
  - 6-Month Growth Trend (area chart)
- ✅ **Admin User Management**:
  - Create new employees with role assignment
  - Search by name, email, or employee ID
  - Filter by Status, Department, and Role
  - Password reset functionality
  - Status change (Active/Suspended/Terminated)
  - Pagination
- ✅ **Attendance Management**:
  - Check-in/Check-out functionality
  - Stats cards (Total, Checked In Today, Completed, Avg Hours)
  - Filter by date and employee
  - Pagination
- ✅ **Document Management**:
  - File upload with category selection
  - Categories: General, Contract, Payslip, Certificate, Policy, Personal, Other
  - Search and filter
  - Download and delete functionality
  - Stats by document type
  - Local storage fallback (S3 ready when credentials provided)
- ✅ **Payslip PDF Generation**:
  - Company letterhead header
  - Employee details section
  - Earnings and deductions breakdown
  - Net pay calculation
  - Download as PDF
- ✅ **Login Page**: Clean design with logo only (removed duplicate text)
- ✅ ID Card generation with user photos and company logo
- ✅ Business Card generation with QR code
- ✅ 10 demo users with different roles

### Logo Locations
- `/app/frontend/public/assets/dllc-logo-v2.png` - Main company logo
- `/app/frontend/public/assets/director-photo.png` - Director's photo
- `/app/frontend/public/assets/employee-photo.jpg` - Employee photo

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Director | director@dllc.com | demo123 |
| Admin | admin@dllc.com | demo123 |
| HR | hr@dllc.com | demo123 |
| Finance | finance@dllc.com | demo123 |
| Employee | john.doe@dllc.com | demo123 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (Admin/Director only)
- `POST /api/auth/reset-password` - Reset user password (Admin/Director only)
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - Get all employees (with filters)
- `GET /api/employees/:id` - Get single employee
- `PUT /api/employees/:id` - Update employee
- `PATCH /api/employees/:id/status` - Change employee status

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/today` - Get today's attendance

### Leaves
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves` - Get leave requests (with pagination)
- `PATCH /api/leaves/:id/approve` - Approve leave
- `PATCH /api/leaves/:id/reject` - Reject leave

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get documents
- `DELETE /api/documents/:id` - Delete document

### Salary
- `POST /api/salary` - Create salary entry
- `GET /api/salary` - Get salary records
- `GET /api/salary/:id` - Get payslip
- `PATCH /api/salary/:id/status` - Update salary status

## Future/Backlog
- Email Notifications & Password Reset via email (SMTP integration - deferred)
- CSV Export for Reports
- AWS S3 integration (credentials needed)

## Known Technical Notes
- PostgreSQL service may become unstable - verify with `service postgresql status`
- AWS S3 keys in `.env` are placeholders - documents use local storage fallback
- Email/SMTP is disabled - user deferred this feature

## File Structure
```
/app/
├── backend/          # Node.js/Express backend
│   ├── routes/       # API routes for each module
│   ├── middleware/   # auth.js, audit.js
│   ├── db.js         # PostgreSQL connection pool
│   ├── init-db.js    # Database schema initialization
│   └── server.js     # Main Express server
└── frontend/         # React frontend
    ├── public/assets/ # Logo, photos
    ├── src/components/ # React components
    └── src/services/   # API service layer
```

## Testing Status
- Backend: 26/26 tests passed (100%)
- Frontend: All major features verified (100%)
- Test report: `/app/test_reports/iteration_1.json`

## Recent Updates (Feb 2026)
- Fixed Quick Actions buttons on Employee dashboard (Apply Leave, View Payslips, Get ID Card now navigate correctly)
- Implemented full Settings page with 4 functional tabs:
  - Company Branding (company info, theme colors with preview)
  - Leave Policies (7 leave types, carry forward settings)
  - Payroll Settings (pay cycle, CPF rates, overtime)
  - Working Hours (work days, office hours, flexible hours)

## Preview URL
https://payroll-platform-3.preview.emergentagent.com
