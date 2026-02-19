import React, { useState, useEffect } from 'react';
import { employeesService, attendanceService, leavesService, salaryService, announcementsService } from '../services/api';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#1c2a49', '#f0a500', '#4ade80', '#f87171', '#60a5fa', '#a78bfa', '#f472b6', '#34d399'];

const AdvancedDashboard = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employees: [],
    attendance: [],
    leaves: [],
    salary: [],
    announcements: []
  });
  const [attendanceToday, setAttendanceToday] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      if (user.role === 'Employee') {
        const [attendanceRes, announcementsRes] = await Promise.all([
          attendanceService.getToday(),
          announcementsService.getAll()
        ]);
        setAttendanceToday(attendanceRes.data);
        setStats(prev => ({ ...prev, announcements: announcementsRes.data }));
      } else {
        const [employeesRes, leavesRes, announcementsRes, salaryRes] = await Promise.all([
          employeesService.getAll(),
          leavesService.getAll(),
          announcementsService.getAll(),
          salaryService.getAll().catch(() => ({ data: [] }))
        ]);
        
        // Handle pagination response
        const leavesData = leavesRes.data.data || leavesRes.data;
        const salaryData = salaryRes.data.data || salaryRes.data || [];
        
        setStats({
          employees: employeesRes.data,
          leaves: Array.isArray(leavesData) ? leavesData : [],
          announcements: announcementsRes.data,
          salary: Array.isArray(salaryData) ? salaryData : []
        });
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await attendanceService.checkIn();
      toast.success('Checked in successfully!');
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceService.checkOut();
      toast.success('Checked out successfully!');
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-out failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  // Employee Dashboard
  if (user.role === 'Employee') {
    return (
      <div className="space-y-8 fade-in" data-testid="dashboard">
        <div>
          <h2 className="text-3xl font-heading font-bold mb-2">Welcome back, {user.full_name}!</h2>
          <p className="text-muted-foreground">Here's your activity overview for today</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Attendance Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white col-span-2">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              Today's Attendance
            </h3>
            {attendanceToday?.checked_in ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Check-in Time</p>
                    <p className="text-2xl font-bold">{new Date(attendanceToday.check_in).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {attendanceToday.checked_out && (
                    <div>
                      <p className="text-sm opacity-90">Check-out Time</p>
                      <p className="text-2xl font-bold">{new Date(attendanceToday.check_out).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  )}
                </div>
                {!attendanceToday.checked_out && (
                  <button
                    onClick={handleCheckOut}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition w-full"
                  >
                    Check Out
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-lg mb-4 opacity-90">Ready to start your day?</p>
                <button
                  onClick={handleCheckIn}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition w-full"
                >
                  Check In Now
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate && onNavigate('leaves')}
                data-testid="quick-action-leave"
                className="w-full text-left px-4 py-3 rounded-lg bg-muted hover:bg-accent transition flex items-center gap-3"
              >
                <span className="text-xl">📅</span>
                <span className="font-medium">Apply Leave</span>
              </button>
              <button 
                onClick={() => onNavigate && onNavigate('salary')}
                data-testid="quick-action-payslips"
                className="w-full text-left px-4 py-3 rounded-lg bg-muted hover:bg-accent transition flex items-center gap-3"
              >
                <span className="text-xl">💰</span>
                <span className="font-medium">View Payslips</span>
              </button>
              <button 
                onClick={() => onNavigate && onNavigate('idCards')}
                data-testid="quick-action-idcard"
                className="w-full text-left px-4 py-3 rounded-lg bg-muted hover:bg-accent transition flex items-center gap-3"
              >
                <span className="text-xl">🎫</span>
                <span className="font-medium">Get ID Card</span>
              </button>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📢</span>
            Latest Announcements
          </h3>
          {stats.announcements.length > 0 ? (
            <div className="space-y-4">
              {stats.announcements.slice(0, 3).map((ann, idx) => (
                <div key={idx} className="border-l-4 border-secondary pl-4 py-2">
                  <h4 className="font-semibold text-lg">{ann.title}</h4>
                  <p className="text-muted-foreground mt-1">{ann.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No announcements yet</p>
          )}
        </div>
      </div>
    );
  }

  // Admin/HR/Director Dashboard with Analytics
  const departmentData = stats.employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(departmentData).map(dept => ({
    name: dept,
    value: departmentData[dept]
  }));

  const roleData = stats.employees.reduce((acc, emp) => {
    const role = emp.user_role || 'Employee';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const roleChartData = Object.keys(roleData).map(role => ({
    name: role,
    value: roleData[role]
  }));

  const statusData = [
    { name: 'Active', value: stats.employees.filter(e => e.status === 'Active').length, fill: '#4ade80' },
    { name: 'Suspended', value: stats.employees.filter(e => e.status === 'Suspended').length, fill: '#fbbf24' },
    { name: 'Terminated', value: stats.employees.filter(e => e.status === 'Terminated').length, fill: '#f87171' }
  ].filter(d => d.value > 0);

  const leaveStatusData = [
    { name: 'Pending', value: (stats.leaves || []).filter(l => l.status === 'Pending').length, fill: '#fbbf24' },
    { name: 'Approved', value: (stats.leaves || []).filter(l => l.status === 'Approved').length, fill: '#4ade80' },
    { name: 'Rejected', value: (stats.leaves || []).filter(l => l.status === 'Rejected').length, fill: '#f87171' }
  ].filter(d => d.value > 0);

  // Leave type breakdown
  const leaveTypeData = (stats.leaves || []).reduce((acc, leave) => {
    const type = leave.leave_type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const leaveTypeChartData = Object.keys(leaveTypeData).map(type => ({
    name: type,
    value: leaveTypeData[type]
  }));

  // Salary status
  const salaryStatusData = [
    { name: 'Pending', value: (stats.salary || []).filter(s => s.status === 'Pending').length },
    { name: 'Paid', value: (stats.salary || []).filter(s => s.status === 'Paid').length },
    { name: 'On-hold', value: (stats.salary || []).filter(s => s.status === 'On-hold').length }
  ].filter(d => d.value > 0);

  // Monthly trend data (simulated)
  const monthlyTrendData = [
    { month: 'Jan', employees: Math.floor(stats.employees.length * 0.7), leaves: 5 },
    { month: 'Feb', employees: Math.floor(stats.employees.length * 0.75), leaves: 8 },
    { month: 'Mar', employees: Math.floor(stats.employees.length * 0.8), leaves: 12 },
    { month: 'Apr', employees: Math.floor(stats.employees.length * 0.85), leaves: 6 },
    { month: 'May', employees: Math.floor(stats.employees.length * 0.9), leaves: 10 },
    { month: 'Jun', employees: stats.employees.length, leaves: (stats.leaves || []).length }
  ];

  return (
    <div className="space-y-8 fade-in" data-testid="dashboard">
      <div>
        <h2 className="text-3xl font-heading font-bold mb-2">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Comprehensive overview of HR metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl shadow-lg text-white hover-lift">
          <div className="flex items-center justify-between">
            <div className="text-3xl">👥</div>
            <div className="text-right">
              <p className="text-xs opacity-90">Total Employees</p>
              <p className="text-3xl font-bold">{stats.employees.length}</p>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-90">
            <span className="text-green-300">↑ {stats.employees.filter(e => e.status === 'Active').length} Active</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-5 rounded-xl shadow-lg text-white hover-lift">
          <div className="flex items-center justify-between">
            <div className="text-3xl">📅</div>
            <div className="text-right">
              <p className="text-xs opacity-90">Pending Leaves</p>
              <p className="text-3xl font-bold">{stats.leaves.filter(l => l.status === 'Pending').length}</p>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-90">Requires Review</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-xl shadow-lg text-white hover-lift">
          <div className="flex items-center justify-between">
            <div className="text-3xl">🏢</div>
            <div className="text-right">
              <p className="text-xs opacity-90">Departments</p>
              <p className="text-3xl font-bold">{Object.keys(departmentData).length}</p>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-90">Active Departments</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl shadow-lg text-white hover-lift">
          <div className="flex items-center justify-between">
            <div className="text-3xl">💰</div>
            <div className="text-right">
              <p className="text-xs opacity-90">Payroll Pending</p>
              <p className="text-3xl font-bold">{(stats.salary || []).filter(s => s.status === 'Pending').length}</p>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-90">Awaiting Processing</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-5 rounded-xl shadow-lg text-white hover-lift">
          <div className="flex items-center justify-between">
            <div className="text-3xl">📢</div>
            <div className="text-right">
              <p className="text-xs opacity-90">Announcements</p>
              <p className="text-3xl font-bold">{stats.announcements.length}</p>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-90">Total Posted</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} employees`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Status */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Employee Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Role Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={roleChartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {roleChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Analytics */}
        {leaveStatusData.length > 0 && (
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Leave Request Status</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={leaveStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {leaveStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Leave Types */}
        {leaveTypeChartData.length > 0 && (
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Leave Types Breakdown</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={leaveTypeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {leaveTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Trend Chart */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Growth Trend (6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyTrendData}>
            <defs>
              <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1c2a49" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#1c2a49" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLeaves" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f0a500" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f0a500" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="employees" stroke="#1c2a49" fillOpacity={1} fill="url(#colorEmployees)" name="Employees" />
            <Area type="monotone" dataKey="leaves" stroke="#f0a500" fillOpacity={1} fill="url(#colorLeaves)" name="Leaves" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Leave Requests</h3>
          {(stats.leaves || []).length > 0 ? (
            <div className="space-y-3">
              {(stats.leaves || []).slice(0, 5).map((leave, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-lg">📅</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{leave.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {leave.leave_type} • {new Date(leave.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No leave requests yet</p>
          )}
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Latest Announcements</h3>
          {stats.announcements.length > 0 ? (
            <div className="space-y-3">
              {stats.announcements.slice(0, 4).map((ann, idx) => (
                <div key={idx} className="border-l-4 border-secondary pl-4 py-2">
                  <h4 className="font-semibold text-sm">{ann.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No announcements yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;
