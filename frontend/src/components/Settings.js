import React, { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/api';
import { toast } from 'sonner';

const Settings = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState({
    branding: {},
    leave_policies: {},
    payroll: {},
    working_hours: {}
  });
  const [hasChanges, setHasChanges] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await settingsService.getAll();
      
      // If no settings exist, initialize defaults
      if (Object.keys(response.data).length === 0) {
        await settingsService.initialize();
        const newResponse = await settingsService.getAll();
        setSettings(parseSettings(newResponse.data));
      } else {
        setSettings(parseSettings(response.data));
      }
    } catch (error) {
      console.error('Load settings error:', error);
      // Initialize with defaults if API fails
      initializeDefaults();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
    try {
      setLoading(true);
      const response = await settingsService.getAll();
      
      // If no settings exist, initialize defaults
      if (Object.keys(response.data).length === 0) {
        await settingsService.initialize();
        const newResponse = await settingsService.getAll();
        setSettings(parseSettings(newResponse.data));
      } else {
        setSettings(parseSettings(response.data));
      }
    } catch (error) {
      console.error('Load settings error:', error);
      // Initialize with defaults if API fails
      initializeDefaults();
    } finally {
      setLoading(false);
    }
  };

  const parseSettings = (data) => {
    const parsed = {
      branding: {},
      leave_policies: {},
      payroll: {},
      working_hours: {}
    };

    Object.keys(data).forEach(category => {
      if (parsed[category] !== undefined) {
        Object.keys(data[category]).forEach(key => {
          try {
            const val = data[category][key].value;
            parsed[category][key] = typeof val === 'string' ? JSON.parse(val) : val;
          } catch {
            parsed[category][key] = data[category][key].value;
          }
        });
      }
    });

    return parsed;
  };

  const initializeDefaults = () => {
    setSettings({
      branding: {
        company_name: 'DL Law Corporation',
        company_short_name: 'DLLC',
        company_address: '10 Anson Road, #20-08 International Plaza, Singapore 079903',
        company_phone: '+65 6222 8988',
        company_email: 'info@dllc.com',
        primary_color: '#1c2a49',
        secondary_color: '#f0a500'
      },
      leave_policies: {
        annual_leave_days: 14,
        sick_leave_days: 14,
        medical_leave_days: 60,
        maternity_leave_days: 112,
        paternity_leave_days: 14,
        compassionate_leave_days: 3,
        unpaid_leave_days: 30,
        carry_forward_enabled: true,
        max_carry_forward_days: 5,
        probation_leave_enabled: false
      },
      payroll: {
        pay_cycle: 'monthly',
        pay_day: 28,
        currency: 'SGD',
        currency_symbol: 'S$',
        cpf_enabled: true,
        cpf_employee_rate: 20,
        cpf_employer_rate: 17,
        overtime_rate: 1.5,
        tax_enabled: true
      },
      working_hours: {
        work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        start_time: '09:00',
        end_time: '18:00',
        lunch_start: '12:00',
        lunch_duration: 60,
        flexible_hours: false,
        core_hours_start: '10:00',
        core_hours_end: '16:00',
        overtime_threshold: 44
      }
    });
  };

  const handleChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async (category) => {
    try {
      setSaving(true);
      await settingsService.update(category, settings[category]);
      toast.success(`${getCategoryTitle(category)} saved successfully!`);
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkDayToggle = (day) => {
    const currentDays = settings.working_hours.work_days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    handleChange('working_hours', 'work_days', newDays);
  };

  const getCategoryTitle = (category) => {
    const titles = {
      branding: 'Company Branding',
      leave_policies: 'Leave Policies',
      payroll: 'Payroll Settings',
      working_hours: 'Working Hours'
    };
    return titles[category] || category;
  };

  const tabs = [
    { id: 'branding', label: 'Company Branding', icon: '🏢' },
    { id: 'leave_policies', label: 'Leave Policies', icon: '📅' },
    { id: 'payroll', label: 'Payroll Settings', icon: '💰' },
    { id: 'working_hours', label: 'Working Hours', icon: '⏰' }
  ];

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (!['Admin', 'Director'].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 fade-in">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground mt-2">Only Admins and Directors can access settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-48"></div>
        <div className="skeleton h-64"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="settings-page">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-heading font-bold">Settings</h2>
        {hasChanges && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
            Unsaved changes
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Company Branding */}
          {activeTab === 'branding' && (
            <div className="space-y-6" data-testid="branding-settings">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🏢</span> Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Company Name</label>
                    <input
                      type="text"
                      value={settings.branding.company_name || ''}
                      onChange={(e) => handleChange('branding', 'company_name', e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-md bg-background"
                      data-testid="company-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Short Name</label>
                    <input
                      type="text"
                      value={settings.branding.company_short_name || ''}
                      onChange={(e) => handleChange('branding', 'company_short_name', e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Company Address</label>
                    <textarea
                      value={settings.branding.company_address || ''}
                      onChange={(e) => handleChange('branding', 'company_address', e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-md bg-background"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Phone</label>
                    <input
                      type="tel"
                      value={settings.branding.company_phone || ''}
                      onChange={(e) => handleChange('branding', 'company_phone', e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      value={settings.branding.company_email || ''}
                      onChange={(e) => handleChange('branding', 'company_email', e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🎨</span> Theme Colors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Primary Color</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.branding.primary_color || '#1c2a49'}
                        onChange={(e) => handleChange('branding', 'primary_color', e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={settings.branding.primary_color || '#1c2a49'}
                        onChange={(e) => handleChange('branding', 'primary_color', e.target.value)}
                        className="flex-1 px-4 py-2 border border-input rounded-md bg-background font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Used for headers, buttons, and navigation</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Secondary Color</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.branding.secondary_color || '#f0a500'}
                        onChange={(e) => handleChange('branding', 'secondary_color', e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={settings.branding.secondary_color || '#f0a500'}
                        onChange={(e) => handleChange('branding', 'secondary_color', e.target.value)}
                        className="flex-1 px-4 py-2 border border-input rounded-md bg-background font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Used for accents and highlights</p>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-3">Preview</p>
                  <div className="flex gap-4 items-center">
                    <div 
                      className="w-24 h-12 rounded flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: settings.branding.primary_color || '#1c2a49' }}
                    >
                      Primary
                    </div>
                    <div 
                      className="w-24 h-12 rounded flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: settings.branding.secondary_color || '#f0a500' }}
                    >
                      Secondary
                    </div>
                    <div 
                      className="flex-1 h-12 rounded flex items-center px-4 text-white text-sm"
                      style={{ 
                        background: `linear-gradient(135deg, ${settings.branding.primary_color || '#1c2a49'}, ${settings.branding.secondary_color || '#f0a500'})` 
                      }}
                    >
                      Gradient Preview
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => handleSave('branding')}
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-8 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                  data-testid="save-branding-btn"
                >
                  {saving ? 'Saving...' : 'Save Branding Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Leave Policies */}
          {activeTab === 'leave_policies' && (
            <div className="space-y-6" data-testid="leave-policies-settings">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>📅</span> Annual Leave Entitlements
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <label className="block text-sm font-semibold mb-2">Annual Leave</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.leave_policies.annual_leave_days || 14}
                      onChange={(e) => handleChange('leave_policies', 'annual_leave_days', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-input rounded-md bg-background text-center"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">days/year</span>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <label className="block text-sm font-semibold mb-2">Sick Leave</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.leave_policies.sick_leave_days || 14}
                      onChange={(e) => handleChange('leave_policies', 'sick_leave_days', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-input rounded-md bg-background text-center"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">days/year</span>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <label className="block text-sm font-semibold mb-2">Medical Leave</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.leave_policies.medical_leave_days || 60}
                      onChange={(e) => handleChange('leave_policies', 'medical_leave_days', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-input rounded-md bg-background text-center"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">days/year</span>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <label className="block text-sm font-semibold mb-2">Maternity Leave</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.leave_policies.maternity_leave_days || 112}
                      onChange={(e) => handleChange('leave_policies', 'maternity_leave_days', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-input rounded-md bg-background text-center"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <label className="block text-sm font-semibold mb-2">Paternity Leave</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.leave_policies.paternity_leave_days || 14}
                      onChange={(e) => handleChange('leave_policies', 'paternity_leave_days', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-input rounded-md bg-background text-center"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <label className="block text-sm font-semibold mb-2">Compassionate Leave</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.leave_policies.compassionate_leave_days || 3}
                      onChange={(e) => handleChange('leave_policies', 'compassionate_leave_days', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-input rounded-md bg-background text-center"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">days/year</span>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <label className="block text-sm font-semibold mb-2">Unpaid Leave (Max)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.leave_policies.unpaid_leave_days || 30}
                      onChange={(e) => handleChange('leave_policies', 'unpaid_leave_days', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-input rounded-md bg-background text-center"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">days/year</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>⚙️</span> Leave Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-semibold">Allow Leave Carry Forward</p>
                      <p className="text-sm text-muted-foreground">Allow employees to carry forward unused leave to next year</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.leave_policies.carry_forward_enabled || false}
                        onChange={(e) => handleChange('leave_policies', 'carry_forward_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {settings.leave_policies.carry_forward_enabled && (
                    <div className="ml-4 p-4 bg-background rounded-lg border border-border">
                      <label className="block text-sm font-semibold mb-2">Maximum Carry Forward Days</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={settings.leave_policies.max_carry_forward_days || 5}
                          onChange={(e) => handleChange('leave_policies', 'max_carry_forward_days', parseInt(e.target.value))}
                          className="w-20 px-3 py-2 border border-input rounded-md bg-background text-center"
                          min="0"
                        />
                        <span className="text-sm text-muted-foreground">days maximum</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-semibold">Allow Leave During Probation</p>
                      <p className="text-sm text-muted-foreground">Allow new employees to take leave during probation period</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.leave_policies.probation_leave_enabled || false}
                        onChange={(e) => handleChange('leave_policies', 'probation_leave_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => handleSave('leave_policies')}
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-8 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Leave Policies'}
                </button>
              </div>
            </div>
          )}

          {/* Payroll Settings */}
          {activeTab === 'payroll' && (
            <div className="space-y-6" data-testid="payroll-settings">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>💰</span> Payment Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Pay Cycle</label>
                  <select
                    value={settings.payroll.pay_cycle || 'monthly'}
                    onChange={(e) => handleChange('payroll', 'pay_cycle', e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Pay Day</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.payroll.pay_day || 28}
                      onChange={(e) => handleChange('payroll', 'pay_day', parseInt(e.target.value))}
                      className="w-24 px-4 py-2 border border-input rounded-md bg-background text-center"
                      min="1"
                      max="31"
                    />
                    <span className="text-sm text-muted-foreground">of each month</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Currency</label>
                  <select
                    value={settings.payroll.currency || 'SGD'}
                    onChange={(e) => handleChange('payroll', 'currency', e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="MYR">MYR - Malaysian Ringgit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Currency Symbol</label>
                  <input
                    type="text"
                    value={settings.payroll.currency_symbol || 'S$'}
                    onChange={(e) => handleChange('payroll', 'currency_symbol', e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🏛️</span> CPF Settings (Singapore)
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-semibold">Enable CPF Contributions</p>
                      <p className="text-sm text-muted-foreground">Automatically calculate CPF for Singapore employees</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.payroll.cpf_enabled || false}
                        onChange={(e) => handleChange('payroll', 'cpf_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {settings.payroll.cpf_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4 p-4 bg-background rounded-lg border border-border">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Employee CPF Rate</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={settings.payroll.cpf_employee_rate || 20}
                            onChange={(e) => handleChange('payroll', 'cpf_employee_rate', parseFloat(e.target.value))}
                            className="w-24 px-4 py-2 border border-input rounded-md bg-background text-center"
                            step="0.5"
                            min="0"
                            max="100"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Employer CPF Rate</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={settings.payroll.cpf_employer_rate || 17}
                            onChange={(e) => handleChange('payroll', 'cpf_employer_rate', parseFloat(e.target.value))}
                            className="w-24 px-4 py-2 border border-input rounded-md bg-background text-center"
                            step="0.5"
                            min="0"
                            max="100"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>📊</span> Other Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Overtime Rate Multiplier</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.payroll.overtime_rate || 1.5}
                        onChange={(e) => handleChange('payroll', 'overtime_rate', parseFloat(e.target.value))}
                        className="w-24 px-4 py-2 border border-input rounded-md bg-background text-center"
                        step="0.25"
                        min="1"
                      />
                      <span className="text-sm text-muted-foreground">x regular hourly rate</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-semibold">Enable Tax Calculation</p>
                      <p className="text-sm text-muted-foreground">Auto-calculate income tax</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.payroll.tax_enabled || false}
                        onChange={(e) => handleChange('payroll', 'tax_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => handleSave('payroll')}
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-8 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Payroll Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Working Hours */}
          {activeTab === 'working_hours' && (
            <div className="space-y-6" data-testid="working-hours-settings">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>📆</span> Work Days
              </h3>
              <div className="flex flex-wrap gap-2">
                {allDays.map(day => (
                  <button
                    key={day}
                    onClick={() => handleWorkDayToggle(day)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      (settings.working_hours.work_days || []).includes(day)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {(settings.working_hours.work_days || []).length} days per week
              </p>

              <div className="border-t border-border pt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>⏰</span> Office Hours
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Start Time</label>
                    <input
                      type="time"
                      value={settings.working_hours.start_time || '09:00'}
                      onChange={(e) => handleChange('working_hours', 'start_time', e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">End Time</label>
                    <input
                      type="time"
                      value={settings.working_hours.end_time || '18:00'}
                      onChange={(e) => handleChange('working_hours', 'end_time', e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Lunch Start</label>
                    <input
                      type="time"
                      value={settings.working_hours.lunch_start || '12:00'}
                      onChange={(e) => handleChange('working_hours', 'lunch_start', e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Lunch Duration</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.working_hours.lunch_duration || 60}
                        onChange={(e) => handleChange('working_hours', 'lunch_duration', parseInt(e.target.value))}
                        className="w-24 px-4 py-2 border border-input rounded-md bg-background text-center"
                        min="0"
                      />
                      <span className="text-sm text-muted-foreground">mins</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🔄</span> Flexible Hours
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-semibold">Enable Flexible Hours</p>
                      <p className="text-sm text-muted-foreground">Allow employees to start/end within a time range</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.working_hours.flexible_hours || false}
                        onChange={(e) => handleChange('working_hours', 'flexible_hours', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {settings.working_hours.flexible_hours && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4 p-4 bg-background rounded-lg border border-border">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Core Hours Start</label>
                        <input
                          type="time"
                          value={settings.working_hours.core_hours_start || '10:00'}
                          onChange={(e) => handleChange('working_hours', 'core_hours_start', e.target.value)}
                          className="w-full px-4 py-2 border border-input rounded-md bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1">All employees must be present from this time</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Core Hours End</label>
                        <input
                          type="time"
                          value={settings.working_hours.core_hours_end || '16:00'}
                          onChange={(e) => handleChange('working_hours', 'core_hours_end', e.target.value)}
                          className="w-full px-4 py-2 border border-input rounded-md bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Employees can leave after this time</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>⏱️</span> Overtime Settings
                </h3>
                <div className="p-4 bg-muted rounded-lg">
                  <label className="block text-sm font-semibold mb-2">Weekly Overtime Threshold</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.working_hours.overtime_threshold || 44}
                      onChange={(e) => handleChange('working_hours', 'overtime_threshold', parseInt(e.target.value))}
                      className="w-24 px-4 py-2 border border-input rounded-md bg-background text-center"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">hours per week (hours beyond this count as overtime)</span>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2">Working Hours Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Work Days</p>
                    <p className="font-semibold">{(settings.working_hours.work_days || []).length} days/week</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Office Hours</p>
                    <p className="font-semibold">{settings.working_hours.start_time || '09:00'} - {settings.working_hours.end_time || '18:00'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Hours</p>
                    <p className="font-semibold">
                      {(() => {
                        const start = settings.working_hours.start_time || '09:00';
                        const end = settings.working_hours.end_time || '18:00';
                        const lunch = (settings.working_hours.lunch_duration || 60) / 60;
                        const [startH, startM] = start.split(':').map(Number);
                        const [endH, endM] = end.split(':').map(Number);
                        const total = (endH + endM/60) - (startH + startM/60) - lunch;
                        return total.toFixed(1);
                      })()}h
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Weekly Hours</p>
                    <p className="font-semibold">
                      {(() => {
                        const start = settings.working_hours.start_time || '09:00';
                        const end = settings.working_hours.end_time || '18:00';
                        const lunch = (settings.working_hours.lunch_duration || 60) / 60;
                        const [startH, startM] = start.split(':').map(Number);
                        const [endH, endM] = end.split(':').map(Number);
                        const daily = (endH + endM/60) - (startH + startM/60) - lunch;
                        return (daily * (settings.working_hours.work_days || []).length).toFixed(1);
                      })()}h
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => handleSave('working_hours')}
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-8 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Working Hours'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
