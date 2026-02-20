import React, { useState, useEffect } from 'react';
import { attendanceService, employeesService } from '../services/api';
import { toast } from 'sonner';
import { formatDateTime } from '../utils/helpers';

const Attendance = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState(null);
  
  // Filters & Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [filterDate, setFilterDate] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [employees, setEmployees] = useState([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsRes, todayRes] = await Promise.all([
        attendanceService.getAll(),
        attendanceService.getToday()
      ]);
      setRecords(recordsRes.data);
      setAllRecords(recordsRes.data);
      setTodayStatus(todayRes.data);

      // Load employees for filter (admin/HR only)
      if (['Admin', 'Director', 'HR'].includes(user.role)) {
        const empRes = await employeesService.getAll();
        setEmployees(empRes.data);
      }
    } catch (error) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await attendanceService.checkIn();
      toast.success('Checked in successfully!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceService.checkOut();
      toast.success('Checked out successfully!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-out failed');
    }
  };

  // Filtering logic
  const filteredRecords = allRecords.filter(record => {
    const matchesDate = filterDate === '' || 
      new Date(record.date).toISOString().split('T')[0] === filterDate;
    const matchesEmployee = filterEmployee === '' || 
      record.employee_id === filterEmployee ||
      record.full_name?.toLowerCase().includes(filterEmployee.toLowerCase());
    return matchesDate && matchesEmployee;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = allRecords.filter(r => new Date(r.date).toISOString().split('T')[0] === today);
  const checkedInToday = todayRecords.filter(r => r.check_in && !r.check_out).length;
  const completedToday = todayRecords.filter(r => r.check_in && r.check_out).length;

  const clearFilters = () => {
    setFilterDate('');
    setFilterEmployee('');
    setCurrentPage(1);
  };

  if (loading) {
    return <div className="skeleton h-64"></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="attendance-page">
      <h2 className="text-3xl font-heading font-bold">Attendance Management</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <p className="text-sm opacity-90">Total Records</p>
          <p className="text-3xl font-bold">{allRecords.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white">
          <p className="text-sm opacity-90">Checked In Today</p>
          <p className="text-3xl font-bold">{checkedInToday}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white">
          <p className="text-sm opacity-90">Completed Today</p>
          <p className="text-3xl font-bold">{completedToday}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-lg text-white">
          <p className="text-sm opacity-90">Avg Hours (This Month)</p>
          <p className="text-3xl font-bold">
            {allRecords.length > 0 
              ? (allRecords.filter(r => r.check_out).reduce((sum, r) => {
                  return sum + (new Date(r.check_out) - new Date(r.check_in)) / (1000 * 60 * 60);
                }, 0) / allRecords.filter(r => r.check_out).length || 0).toFixed(1)
              : '0'}h
          </p>
        </div>
      </div>

      {/* Today's Status */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">⏰</span>
          Today's Status
        </h3>
        {todayStatus?.checked_in ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Check-in Time</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Date(todayStatus.check_in).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {todayStatus.checked_out && (
                <div>
                  <p className="text-sm text-muted-foreground">Check-out Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {new Date(todayStatus.check_out).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              {todayStatus.check_out && (
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">
                    {((new Date(todayStatus.check_out) - new Date(todayStatus.check_in)) / (1000 * 60 * 60)).toFixed(2)}h
                  </p>
                </div>
              )}
            </div>
            {!todayStatus.checked_out && (
              <button
                onClick={handleCheckOut}
                data-testid="checkout-btn"
                className="bg-destructive text-destructive-foreground px-8 py-3 rounded-md hover:bg-destructive/90 font-semibold"
              >
                🚪 Check Out Now
              </button>
            )}
            {todayStatus.checked_out && (
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
                ✅ Day Complete
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-muted-foreground">You haven't checked in today</p>
              <p className="text-sm text-muted-foreground">Click the button to start your workday</p>
            </div>
            <button
              onClick={handleCheckIn}
              data-testid="checkin-btn"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-md hover:bg-primary/90 font-semibold"
            >
              🚀 Check In Now
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-semibold mb-1 block">Filter by Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-input rounded-md bg-background"
            />
          </div>
          {['Admin', 'Director', 'HR'].includes(user.role) && (
            <div>
              <label className="text-sm font-semibold mb-1 block">Filter by Employee</label>
              <select
                value={filterEmployee}
                onChange={(e) => { setFilterEmployee(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2 border border-input rounded-md bg-background"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-muted rounded-md text-sm hover:bg-muted/80"
            >
              Clear Filters
            </button>
          </div>
          <div className="flex items-end justify-end">
            <p className="text-sm text-muted-foreground">
              {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xl font-semibold">Attendance History</h3>
        </div>
        {paginatedRecords.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {['Admin', 'Director', 'HR'].includes(user.role) && (
                      <th className="px-6 py-3 text-left text-sm font-semibold">Employee</th>
                    )}
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Check In</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Check Out</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Duration</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record, idx) => {
                    const duration = record.check_out 
                      ? ((new Date(record.check_out) - new Date(record.check_in)) / (1000 * 60 * 60)).toFixed(2)
                      : null;
                    const isLongDay = duration && parseFloat(duration) > 8;
                    const isShortDay = duration && parseFloat(duration) < 4;
                    
                    return (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50">
                        {['Admin', 'Director', 'HR'].includes(user.role) && (
                          <td className="px-6 py-4 font-semibold">{record.full_name || 'N/A'}</td>
                        )}
                        <td className="px-6 py-4">{new Date(record.date).toLocaleDateString('en-SG', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4 font-mono text-green-600">{new Date(record.check_in).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-4 font-mono text-blue-600">{record.check_out ? new Date(record.check_out).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td className="px-6 py-4">
                          {duration ? (
                            <span className={`font-semibold ${isLongDay ? 'text-purple-600' : isShortDay ? 'text-orange-600' : 'text-foreground'}`}>
                              {duration}h
                            </span>
                          ) : (
                            <span className="text-muted-foreground">In Progress...</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {record.check_out ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              Complete
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold animate-pulse">
                              Working
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-muted rounded-md text-sm hover:bg-muted/80 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-muted rounded-md text-sm hover:bg-muted/80 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg font-medium">No attendance records found</p>
            <p className="text-sm mt-2">Check in to start tracking your attendance</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
