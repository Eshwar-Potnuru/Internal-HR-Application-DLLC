import React, { useState, useEffect } from 'react';
import './App.css';
import { authService } from './services/api';
import { Toaster, toast } from 'sonner';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AdvancedDashboard from './components/AdvancedDashboard';
import Employees from './components/Employees';
import Attendance from './components/Attendance';
import Leaves from './components/Leaves';
import Salary from './components/Salary';
import Documents from './components/Documents';
import Announcements from './components/Announcements';
import Tickets from './components/Tickets';
import AuditLogs from './components/AuditLogs';
import Reports from './components/Reports';
import IDCards from './components/IDCards';
import Settings from './components/Settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    toast.success('Login successful!');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setCurrentSection('dashboard');
    setMobileMenuOpen(false);
    toast.info('Logged out successfully');
  };

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    setMobileMenuOpen(false);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdvancedDashboard user={user} onNavigate={handleSectionChange} />;
      case 'employees':
        return <Employees user={user} />;
      case 'attendance':
        return <Attendance user={user} />;
      case 'leaves':
        return <Leaves user={user} />;
      case 'salary':
        return <Salary user={user} />;
      case 'documents':
        return <Documents user={user} />;
      case 'announcements':
        return <Announcements user={user} />;
      case 'tickets':
        return <Tickets user={user} />;
      case 'auditLogs':
        return <AuditLogs user={user} />;
      case 'reports':
        return <Reports user={user} />;
      case 'idCards':
        return <IDCards user={user} />;
      case 'settings':
        return <Settings user={user} />;
      default:
        return <AdvancedDashboard user={user} onNavigate={handleSectionChange} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden mr-2 text-2xl text-foreground"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <img 
              src="/assets/dllc-logo-v2.png" 
              alt="DLLC Logo" 
              className="h-9 sm:h-12 w-auto object-contain mr-2 sm:mr-3"
            />
            <h1 className="text-lg sm:text-2xl font-heading font-bold text-foreground">HR Portal</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-full flex items-center justify-center mr-2 sm:mr-3">
                <span className="text-secondary-foreground font-semibold">{user?.full_name?.charAt(0) || 'U'}</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold text-foreground truncate max-w-40" data-testid="current-user">{user?.full_name || user?.email}</p>
                <p className="text-sm text-muted-foreground" data-testid="current-role">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              data-testid="logout-btn"
              className="bg-destructive text-destructive-foreground px-3 sm:px-4 py-2 rounded-md hover:bg-destructive/90 transition text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`md:hidden fixed top-[61px] left-0 h-[calc(100vh-61px)] w-72 bg-primary border-r border-border z-50 transform transition-transform duration-200 overflow-y-auto ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-4">
            <NavItem
              icon="📊"
              label="Dashboard"
              active={currentSection === 'dashboard'}
              onClick={() => handleSectionChange('dashboard')}
            />
            <NavItem
              icon="👥"
              label="Employees"
              active={currentSection === 'employees'}
              onClick={() => handleSectionChange('employees')}
              hidden={!['Admin', 'Director', 'HR'].includes(user?.role)}
            />
            <NavItem
              icon="⏰"
              label="Attendance"
              active={currentSection === 'attendance'}
              onClick={() => handleSectionChange('attendance')}
            />
            <NavItem
              icon="📅"
              label="Leave Management"
              active={currentSection === 'leaves'}
              onClick={() => handleSectionChange('leaves')}
            />
            <NavItem
              icon="💰"
              label="Salary"
              active={currentSection === 'salary'}
              onClick={() => handleSectionChange('salary')}
            />
            <NavItem
              icon="📄"
              label="Documents"
              active={currentSection === 'documents'}
              onClick={() => handleSectionChange('documents')}
            />
            <NavItem
              icon="📢"
              label="Announcements"
              active={currentSection === 'announcements'}
              onClick={() => handleSectionChange('announcements')}
            />
            <NavItem
              icon="🎫"
              label="Support"
              active={currentSection === 'tickets'}
              onClick={() => handleSectionChange('tickets')}
            />
            <NavItem
              icon="📈"
              label="Reports"
              active={currentSection === 'reports'}
              onClick={() => handleSectionChange('reports')}
              hidden={!['Admin', 'Director', 'HR'].includes(user?.role)}
            />
            <NavItem
              icon="📜"
              label="Audit Logs"
              active={currentSection === 'auditLogs'}
              onClick={() => handleSectionChange('auditLogs')}
              hidden={!['Admin', 'Director'].includes(user?.role)}
            />
            <NavItem
              icon="🪪"
              label="ID Cards"
              active={currentSection === 'idCards'}
              onClick={() => handleSectionChange('idCards')}
            />
            <NavItem
              icon="⚙️"
              label="Settings"
              active={currentSection === 'settings'}
              onClick={() => handleSectionChange('settings')}
              hidden={!['Admin', 'Director'].includes(user?.role)}
            />
          </nav>
        </aside>

        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-primary min-h-[calc(100vh-73px)] border-r border-border">
          <nav className="p-4">
            <NavItem
              icon="📊"
              label="Dashboard"
              active={currentSection === 'dashboard'}
              onClick={() => handleSectionChange('dashboard')}
            />
            <NavItem
              icon="👥"
              label="Employees"
              active={currentSection === 'employees'}
              onClick={() => handleSectionChange('employees')}
              hidden={!['Admin', 'Director', 'HR'].includes(user?.role)}
            />
            <NavItem
              icon="⏰"
              label="Attendance"
              active={currentSection === 'attendance'}
              onClick={() => handleSectionChange('attendance')}
            />
            <NavItem
              icon="📅"
              label="Leave Management"
              active={currentSection === 'leaves'}
              onClick={() => handleSectionChange('leaves')}
            />
            <NavItem
              icon="💰"
              label="Salary"
              active={currentSection === 'salary'}
              onClick={() => handleSectionChange('salary')}
            />
            <NavItem
              icon="📄"
              label="Documents"
              active={currentSection === 'documents'}
              onClick={() => handleSectionChange('documents')}
            />
            <NavItem
              icon="📢"
              label="Announcements"
              active={currentSection === 'announcements'}
              onClick={() => handleSectionChange('announcements')}
            />
            <NavItem
              icon="🎫"
              label="Support"
              active={currentSection === 'tickets'}
              onClick={() => handleSectionChange('tickets')}
            />
            <NavItem
              icon="📈"
              label="Reports"
              active={currentSection === 'reports'}
              onClick={() => handleSectionChange('reports')}
              hidden={!['Admin', 'Director', 'HR'].includes(user?.role)}
            />
            <NavItem
              icon="📜"
              label="Audit Logs"
              active={currentSection === 'auditLogs'}
              onClick={() => handleSectionChange('auditLogs')}
              hidden={!['Admin', 'Director'].includes(user?.role)}
            />
            <NavItem
              icon="🪪"
              label="ID Cards"
              active={currentSection === 'idCards'}
              onClick={() => handleSectionChange('idCards')}
            />
            <NavItem
              icon="⚙️"
              label="Settings"
              active={currentSection === 'settings'}
              onClick={() => handleSectionChange('settings')}
              hidden={!['Admin', 'Director'].includes(user?.role)}
            />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-8" data-testid="main-content">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick, hidden }) => {
  if (hidden) return null;
  
  return (
    <button
      onClick={onClick}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`w-full flex items-center p-3 rounded-md mb-2 transition ${
        active
          ? 'bg-[hsl(217,33%,17%)] text-secondary'
          : 'text-primary-foreground hover:bg-[hsl(217,33%,17%)] hover:text-secondary'
      }`}
    >
      <span className="mr-3 text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
};

export default App;