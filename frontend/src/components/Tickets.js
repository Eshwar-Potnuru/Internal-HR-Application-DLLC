import React, { useState, useEffect } from 'react';
import { ticketsService } from '../services/api';
import { toast } from 'sonner';
import { formatDateTime, getStatusColor } from '../utils/helpers';

const Tickets = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ subject: '', description: '' });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsService.getAll();
      setTickets(response.data);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ticketsService.create(formData);
      toast.success('Ticket submitted!');
      setShowForm(false);
      setFormData({ subject: '', description: '' });
      loadTickets();
    } catch (error) {
      toast.error('Failed to submit ticket');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await ticketsService.updateStatus(id, status);
      toast.success(`Ticket status updated to ${status}`);
      loadTickets();
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  if (loading) {
    return <div className="skeleton h-64"></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="tickets-page">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-heading font-bold">Support Tickets</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
        >
          New Ticket
        </button>
      </div>

      {showForm && (
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Submit Support Ticket</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-4 py-2 border border-input rounded-md bg-background"
                placeholder="Brief description of the issue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border border-input rounded-md bg-background"
                rows="4"
                placeholder="Provide detailed information about your issue"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90">
                Submit
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted px-6 py-2 rounded-md hover:bg-muted/80">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {tickets.length > 0 ? (
          tickets.map((ticket, idx) => (
            <div key={idx} className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">🎫 {ticket.subject}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submitted by {ticket.full_name} on {formatDateTime(ticket.created_at)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-foreground mb-3">{ticket.description}</p>
              {['Admin', 'Director', 'HR'].includes(user.role) && ticket.status !== 'Closed' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(ticket.id, 'In Progress')}
                    className="bg-yellow-600 text-white px-4 py-1 rounded text-sm hover:bg-yellow-700"
                  >
                    Mark In Progress
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(ticket.id, 'Closed')}
                    className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Close Ticket
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-card p-12 rounded-lg border border-border text-center text-muted-foreground">
            <p>🎫 No tickets found</p>
            <p className="text-sm mt-2">Submit a ticket if you need any assistance</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;