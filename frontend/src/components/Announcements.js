import React, { useState, useEffect } from 'react';
import { announcementsService } from '../services/api';
import { toast } from 'sonner';
import { formatDateTime } from '../utils/helpers';

const Announcements = ({ user }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementsService.getAll();
      setAnnouncements(response.data);
    } catch (error) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await announcementsService.create(formData);
      toast.success('Announcement posted!');
      setShowForm(false);
      setFormData({ title: '', content: '' });
      loadAnnouncements();
    } catch (error) {
      toast.error('Failed to post announcement');
    }
  };

  if (loading) {
    return <div className="skeleton h-64"></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="announcements-page">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-heading font-bold">Announcements</h2>
        {['Admin', 'Director', 'HR'].includes(user.role) && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
          >
            Create Announcement
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-xl font-semibold mb-4">New Announcement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full px-4 py-2 border border-input rounded-md bg-background"
                rows="4"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90">
                Post
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted px-6 py-2 rounded-md hover:bg-muted/80">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((announcement, idx) => (
            <div key={idx} className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">📢 {announcement.title}</h3>
                  <p className="text-foreground mb-3">{announcement.content}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>Posted by {announcement.creator_name || 'Admin'}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDateTime(announcement.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-card p-12 rounded-lg border border-border text-center text-muted-foreground">
            <p>📢 No announcements yet</p>
            <p className="text-sm mt-2">Check back later for company updates</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;