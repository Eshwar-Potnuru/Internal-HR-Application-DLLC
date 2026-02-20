import React, { useEffect, useState } from 'react';
import { authService, demoService } from '../services/api';
import { toast } from 'sonner';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState([]);
  const [showDemoInfo, setShowDemoInfo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      onLogin(data.user);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoUsers = async () => {
    setShowDemoInfo(true);
    setLoading(true);
    try {
      const result = await demoService.loadUsers();
      const createdCount = result?.data?.created_count || 0;
      const updatedCount = result?.data?.updated_count || 0;
      toast.success(`Demo users ready (${createdCount} created, ${updatedCount} updated)`);
      const usersResult = await demoService.getUsers();
      setDemoUsers(usersResult?.data?.demo_users || []);
    } catch (error) {
      toast.error('Failed to load demo users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDemoUsers = async () => {
      try {
        const result = await demoService.getUsers();
        setDemoUsers(result?.data?.demo_users || []);
      } catch {
        setDemoUsers([]);
      }
    };

    fetchDemoUsers();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-5 sm:p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/dllc-logo-v2.png" 
              alt="DLLC Logo" 
              className="h-20 sm:h-28 w-auto object-contain"
            />
          </div>
          <p className="text-muted-foreground mt-2 text-lg">HR Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} data-testid="login-form">
          <div className="mb-6">
            <label htmlFor="email" className="block text-foreground text-sm font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-foreground text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            data-testid="login-submit-btn"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-semibold hover:bg-primary/90 transition duration-200 disabled:opacity-50 relative"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={handleLoadDemoUsers}
            data-testid="load-demo-users-btn"
            disabled={loading}
            className="w-full bg-secondary text-secondary-foreground py-2 rounded-md font-semibold hover:bg-secondary/80 transition duration-200 text-sm disabled:opacity-50"
          >
            🧪 Load / Repair Demo Users
          </button>

          {showDemoInfo && (
          <div className="mt-4 p-4 bg-muted rounded-md text-sm">
              <p className="font-semibold text-foreground mb-2">Demo Accounts (Password: <strong>demo123</strong>)</p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                {(demoUsers.length > 0 ? demoUsers : [
                  { role: 'Director', email: 'anil.lalwani@dllc.com' },
                  { role: 'Admin', email: 'admin@dllc.com' },
                  { role: 'HR', email: 'hr@dllc.com' },
                  { role: 'Finance', email: 'finance@dllc.com' },
                  { role: 'Employee', email: 'eshwar.p@dllc.com' }
                ]).slice(0, 6).map((user) => (
                  <li key={user.email}>• <strong>{user.role}:</strong> {user.email}</li>
                ))}
              </ul>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;