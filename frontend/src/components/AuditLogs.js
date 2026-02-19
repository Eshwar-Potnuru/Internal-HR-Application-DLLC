import React, { useState, useEffect } from 'react';
import { auditLogsService } from '../services/api';
import { toast } from 'sonner';
import { formatDateTime } from '../utils/helpers';

const AuditLogs = ({ user }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogsService.getAll();
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="skeleton h-64"></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="audit-logs-page">
      <h2 className="text-3xl font-heading font-bold">Audit Logs</h2>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xl font-semibold">System Activity</h3>
        </div>
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Timestamp</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Resource</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm">{formatDateTime(log.created_at)}</td>
                    <td className="px-6 py-4">{log.user_name || log.user_email || 'System'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">{log.resource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <p>📜 No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;