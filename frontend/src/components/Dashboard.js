import React, { useState, useEffect } from 'react';
import { employeesService, attendanceService, leavesService, announcementsService } from '../services/api';
import { toast } from 'sonner';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
    announcements: []
  });
  const [loading, setLoading] = useState(true);
  const [attendanceToday, setAttendanceToday] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user.role === 'Employee') {
        // Employee dashboard
        const [attendanceRes, announcementsRes] = await Promise.all([
          attendanceService.getToday(),
          announcementsService.getAll()
        ]);
        
        setAttendanceToday(attendanceRes.data);
        setStats(prev => ({
          ...prev,
          announcements: announcementsRes.data.slice(0, 3)
        }));
      } else {
        // Admin/HR/Director dashboard
        const [employeesRes, leavesRes, announcementsRes] = await Promise.all([
          employeesService.getAll(),
          leavesService.getAll({ status: 'Pending' }),
          announcementsService.getAll()
        ]);
        
        setStats({
          totalEmployees: employeesRes.data.length,
          pendingLeaves: leavesRes.data.length,
          todayAttendance: 0,
          announcements: announcementsRes.data.slice(0, 3)
        });
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await attendanceService.checkIn();
      toast.success('Checked in successfully!');
      loadDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceService.checkOut();
      toast.success('Checked out successfully!');
      loadDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-out failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in" data-testid="dashboard">
      <h2 className="text-3xl font-heading font-bold text-foreground">Dashboard</h2>

      {user.role === 'Employee' ? (
        // Employee Dashboard
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Attendance Today</h3>
            {attendanceToday?.checked_in ? (
              <div>
                <p className="text-2xl font-bold text-green-600 mb-2">✅ Checked In</p>
                <p className="text-sm text-muted-foreground mb-3">
                  {new Date(attendanceToday.check_in).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {!attendanceToday.checked_out && (
                  <button
                    onClick={handleCheckOut}
                    data-testid="checkout-btn"
                    className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm hover:bg-destructive/90"
                  >
                    Check Out
                  </button>
                )}
                {attendanceToday.checked_out && (
                  <p className="text-sm text-green-600">
                    ✅ Checked out at {new Date(attendanceToday.check_out).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-muted-foreground mb-3">Not Checked In</p>
                <button
                  onClick={handleCheckIn}
                  data-testid="checkin-btn"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90"
                >
                  Check In Now
                </button>
              </div>
            )}
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-md bg-muted hover:bg-accent text-sm">
                📅 Apply Leave
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md bg-muted hover:bg-accent text-sm">
                💰 View Salary
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md bg-muted hover:bg-accent text-sm">
                📄 My Documents
              </button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Announcements</h3>
            {stats.announcements.length > 0 ? (
              <ul className="space-y-2">
                {stats.announcements.map((ann, idx) => (
                  <li key={idx} className="text-sm text-foreground">
                    📢 {ann.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements</p>
            )}
          </div>
        </div>
      ) : (
        // Admin/HR Dashboard
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon="👥"
            color="bg-blue-100 text-blue-800"
          />
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
            icon="📅"
            color="bg-yellow-100 text-yellow-800"
          />
          <StatCard
            title="Today's Attendance"
            value={stats.todayAttendance}
            icon="⏰"
            color="bg-green-100 text-green-800"
          />
          <StatCard
            title="Announcements"
            value={stats.announcements.length}
            icon="📢"
            color="bg-purple-100 text-purple-800"
          />
        </div>
      )}

      {/* Recent Announcements */}
      {stats.announcements.length > 0 && (
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-xl font-heading font-semibold mb-4">Recent Announcements</h3>
          <div className="space-y-4">
            {stats.announcements.map((announcement, idx) => (
              <div key={idx} className="border-l-4 border-secondary pl-4">
                <h4 className="font-semibold text-foreground">{announcement.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div className={`text-4xl ${color} w-16 h-16 rounded-full flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

export default Dashboard;