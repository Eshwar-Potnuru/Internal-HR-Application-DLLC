import React, { useState, useEffect } from 'react';
import { leavesService } from '../services/api';
import { toast } from 'sonner';
import { formatDate, getStatusColor } from '../utils/helpers';

const Leaves = ({ user }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ status: '' });
  const [formData, setFormData] = useState({
    leave_type: 'Annual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadLeaves();
  }, [pagination.page, filters]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await leavesService.getAll(params);
      
      if (response.data.data) {
        setLeaves(response.data.data);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      } else {
        setLeaves(response.data);
      }
    } catch (error) {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await leavesService.create(formData);
      toast.success('Leave application submitted!');
      setShowForm(false);
      setFormData({ leave_type: 'Annual', start_date: '', end_date: '', reason: '' });
      loadLeaves();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to apply for leave');
    }
  };

  const handleApprove = async (id) => {
    try {
      await leavesService.approve(id, 'Approved by ' + user.role);
      toast.success('Leave approved!');
      loadLeaves();
    } catch (error) {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async (id) => {
    try {
      await leavesService.reject(id, 'Rejected by ' + user.role);
      toast.success('Leave rejected');
      loadLeaves();
    } catch (error) {
      toast.error('Failed to reject leave');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading) {
    return <div className="skeleton h-64"></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="leaves-page">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-heading font-bold">Leave Management</h2>
        <button
          onClick={() => setShowForm(true)}
          data-testid="apply-leave-btn"
          className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <span>➕</span>
          Apply for Leave
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <div className="flex gap-4 items-center">
          <div>
            <label className="text-sm font-semibold mb-1 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <button
            onClick={() => { setFilters({ status: '' }); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="mt-6 px-4 py-2 bg-muted rounded-md text-sm hover:bg-muted/80"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Apply Leave Form */}
      {showForm && (
        <div className="bg-card p-6 rounded-lg border border-border shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Apply for Leave</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Leave Type</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                >
                  <option>Annual</option>
                  <option>Medical</option>
                  <option>Casual</option>
                  <option>Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                className="w-full px-4 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full px-4 py-2 border border-input rounded-md bg-background"
                rows="3"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90">
                Submit Application
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted px-6 py-2 rounded-md hover:bg-muted/80">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave History */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xl font-semibold">Leave Requests</h3>
        </div>
        {leaves.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Employee</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Start Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">End Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Days</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    {['Admin', 'Director', 'HR'].includes(user.role) && (
                      <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave, idx) => {
                    const days = Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50">
                        <td className="px-6 py-4">{leave.full_name}</td>
                        <td className="px-6 py-4">{leave.leave_type}</td>
                        <td className="px-6 py-4">{formatDate(leave.start_date)}</td>
                        <td className="px-6 py-4">{formatDate(leave.end_date)}</td>
                        <td className="px-6 py-4">{days} day{days > 1 ? 's' : ''}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                        {['Admin', 'Director', 'HR'].includes(user.role) && leave.status === 'Pending' && (
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(leave.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleReject(leave.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-muted rounded-md text-sm hover:bg-muted/80 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
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
            <p>No leave requests found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaves;