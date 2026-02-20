import React, { useState } from 'react';
import { reportsService } from '../services/api';
import { toast } from 'sonner';
import { downloadCSV } from '../utils/helpers';

const Reports = ({ user }) => {
  const [loading, setLoading] = useState(false);

  const handleExportAttendance = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getAttendance();
      downloadCSV(response.data, 'attendance_report');
      toast.success('Attendance report exported!');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLeaves = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getLeaves();
      downloadCSV(response.data, 'leaves_report');
      toast.success('Leave report exported!');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportEmployees = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getEmployees();
      downloadCSV(response.data, 'employees_report');
      toast.success('Employee report exported!');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in" data-testid="reports-page">
      <h2 className="text-2xl sm:text-3xl font-heading font-bold">Reports</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⏰</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Attendance Report</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Export attendance records with check-in/check-out times and hours worked
          </p>
          <button
            onClick={handleExportAttendance}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Leave Report</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Export leave requests with status, dates, and approval information
          </p>
          <button
            onClick={handleExportLeaves}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Employee Report</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Export employee directory with contact information and department details
          </p>
          <button
            onClick={handleExportEmployees}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-2">📊 Report Information</h3>
        <p className="text-sm text-muted-foreground">
          All reports are exported in CSV format for easy analysis in Excel or other spreadsheet applications.
          Reports include data based on your role permissions.
        </p>
      </div>
    </div>
  );
};

export default Reports;