import React, { useState, useEffect } from 'react';
import { employeesService, authService } from '../services/api';
import { toast } from 'sonner';
import { formatDate, getStatusColor } from '../utils/helpers';

const Employees = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    employee_id: '',
    role: 'Employee',
    department: '',
    phone: '',
    join_date: new Date().toISOString().split('T')[0]
  });
  
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesService.getAll();
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchTerm === '' || 
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || emp.status === filterStatus;
    const matchesDept = filterDepartment === '' || emp.department === filterDepartment;
    const matchesRole = filterRole === '' || emp.user_role === filterRole;
    return matchesSearch && matchesStatus && matchesDept && matchesRole;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Get unique departments for filter
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const roles = ['Director', 'Admin', 'HR', 'Finance', 'Employee'];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await authService.register(formData);
      toast.success('Employee created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create employee');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await employeesService.update(selectedEmployee.id, formData);
      toast.success('Employee updated successfully!');
      setShowEditModal(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error) {
      toast.error('Failed to update employee');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await employeesService.updateStatus(id, status);
      toast.success(`Employee ${status.toLowerCase()}`);
      loadEmployees();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await authService.resetPassword(selectedEmployee.user_id, newPassword);
      toast.success(`Password reset successfully for ${selectedEmployee.full_name}`);
      setShowResetModal(false);
      setSelectedEmployee(null);
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      employee_id: '',
      role: 'Employee',
      department: '',
      phone: '',
      join_date: new Date().toISOString().split('T')[0]
    });
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      department: employee.department,
      phone: employee.phone,
      join_date: employee.join_date?.split('T')[0] || '',
      notes: employee.notes || ''
    });
    setShowEditModal(true);
  };

  const openResetModal = (employee) => {
    setSelectedEmployee(employee);
    setNewPassword('');
    setShowResetModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterDepartment('');
    setFilterRole('');
    setCurrentPage(1);
  };

  if (loading) {
    return <div className="skeleton h-64"></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="employees-page">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-heading font-bold">Employee Management</h2>
        {['Admin', 'Director'].includes(user.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            data-testid="create-employee-btn"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2"
          >
            <span>➕</span>
            Create Employee
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <p className="text-2xl font-bold">{employees.length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{employees.filter(e => e.status === 'Active').length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Suspended</p>
          <p className="text-2xl font-bold text-yellow-600">{employees.filter(e => e.status === 'Suspended').length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Terminated</p>
          <p className="text-2xl font-bold text-red-600">{employees.filter(e => e.status === 'Terminated').length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Departments</p>
          <p className="text-2xl font-bold">{departments.length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold mb-1 block">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-input rounded-md bg-background"
              data-testid="employee-search"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-input rounded-md bg-background"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-input rounded-md bg-background"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Role</label>
            <select
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-input rounded-md bg-background"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-muted rounded-md text-sm hover:bg-muted/80"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Employee ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                {['Admin', 'Director', 'HR'].includes(user.role) && (
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map((emp, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-muted/50">
                  <td className="px-6 py-4 font-mono text-sm">{emp.employee_id}</td>
                  <td className="px-6 py-4 font-semibold">{emp.full_name}</td>
                  <td className="px-6 py-4 text-sm">{emp.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      emp.user_role === 'Director' ? 'bg-purple-100 text-purple-800' :
                      emp.user_role === 'Admin' ? 'bg-red-100 text-red-800' :
                      emp.user_role === 'HR' ? 'bg-green-100 text-green-800' :
                      emp.user_role === 'Finance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {emp.user_role || emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">{emp.department}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(emp.status)}`}>
                      {emp.status}
                    </span>
                  </td>
                  {['Admin', 'Director', 'HR'].includes(user.role) && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="text-primary hover:underline text-sm"
                          data-testid={`edit-employee-${emp.employee_id}`}
                        >
                          Edit
                        </button>
                        {['Admin', 'Director'].includes(user.role) && (
                          <>
                            <button
                              onClick={() => openResetModal(emp)}
                              className="text-orange-600 hover:underline text-sm"
                            >
                              Reset Pwd
                            </button>
                            <select
                              value={emp.status}
                              onChange={(e) => handleStatusChange(emp.id, e.target.value)}
                              className="px-2 py-1 border border-input rounded text-xs bg-background"
                            >
                              <option value="Active">Active</option>
                              <option value="Suspended">Suspend</option>
                              <option value="Terminated">Terminate</option>
                            </select>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-muted rounded-md text-sm hover:bg-muted/80 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-md text-sm ${
                        currentPage === pageNum 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
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
      </div>

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <h3 className="text-2xl font-heading font-bold mb-6">Create New Employee</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    required
                    data-testid="create-employee-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Employee ID *</label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    placeholder="e.g., DLLC107"
                    required
                    data-testid="create-employee-id"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    required
                    data-testid="create-employee-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    required
                    minLength="6"
                    placeholder="Min 6 characters"
                    data-testid="create-employee-password"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    data-testid="create-employee-role"
                  >
                    <option value="Employee">Employee</option>
                    <option value="HR">HR Manager</option>
                    <option value="Finance">Finance Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Director">Director</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    placeholder="e.g., Legal, Corporate, HR"
                    required
                    data-testid="create-employee-dept"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    placeholder="+65 XXXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Join Date *</label>
                  <input
                    type="date"
                    value={formData.join_date}
                    onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
                  data-testid="submit-create-employee"
                >
                  Create Employee
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="bg-muted px-6 py-2 rounded-md hover:bg-muted/80"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-lg shadow-2xl max-w-2xl w-full m-4">
            <h3 className="text-2xl font-heading font-bold mb-6">Edit Employee</h3>
            <p className="text-muted-foreground mb-4">Editing: {selectedEmployee.full_name} ({selectedEmployee.employee_id})</p>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
                >
                  Update Employee
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-muted px-6 py-2 rounded-md hover:bg-muted/80"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-lg shadow-2xl max-w-md w-full m-4">
            <h3 className="text-2xl font-heading font-bold mb-4">Reset Password</h3>
            <p className="text-muted-foreground mb-6">
              Resetting password for: <strong>{selectedEmployee.full_name}</strong>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  required
                  minLength="6"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700"
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => { setShowResetModal(false); setNewPassword(''); }}
                  className="bg-muted px-6 py-2 rounded-md hover:bg-muted/80"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
