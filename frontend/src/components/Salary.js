import React, { useState, useEffect } from 'react';
import { salaryService, employeesService } from '../services/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import jsPDF from 'jspdf';

const Salary = ({ user }) => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    basic: '',
    period: new Date().toISOString().slice(0, 7),
    allowances: { transport: '', housing: '', meal: '' },
    deductions: { cpf_employee: '', tax: '', other: '' }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salaryRes, empRes] = await Promise.all([
        salaryService.getAll(),
        employeesService.getAll()
      ]);
      setSalaries(salaryRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const allowancesTotal = Object.values(formData.allowances).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      const deductionsTotal = Object.values(formData.deductions).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      const cpfEmployer = parseFloat(formData.basic) * 0.17; // 17% employer CPF
      const net = parseFloat(formData.basic) + allowancesTotal - deductionsTotal;

      await salaryService.create({
        ...formData,
        allowances: { ...formData.allowances, cpf_employer: cpfEmployer.toFixed(2) },
        net: net.toFixed(2)
      });
      
      toast.success('Salary entry created!');
      setShowCreateModal(false);
      setFormData({
        employee_id: '',
        basic: '',
        period: new Date().toISOString().slice(0, 7),
        allowances: { transport: '', housing: '', meal: '' },
        deductions: { cpf_employee: '', tax: '', other: '' }
      });
      loadData();
    } catch (error) {
      toast.error('Failed to create salary entry');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await salaryService.updateStatus(id, status);
      toast.success(`Status updated to ${status}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const viewPayslip = async (salaryId) => {
    try {
      const response = await salaryService.getById(salaryId);
      setSelectedPayslip(response.data);
      setShowPayslipModal(true);
    } catch (error) {
      toast.error('Failed to load payslip');
    }
  };

  const downloadPayslipPDF = () => {
    if (!selectedPayslip) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Company Header with Logo
    doc.setFillColor(28, 42, 73); // Primary color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Logo placeholder (you can add actual logo image here)
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('DL LAW CORPORATION', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('8 Eu Tong Sen Street #20-98, Clarke Quay Central', pageWidth / 2, 28, { align: 'center' });
    doc.text('Singapore 059818 | Tel: 6557 0215', pageWidth / 2, 34, { align: 'center' });

    // Payslip Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYSLIP', pageWidth / 2, 55, { align: 'center' });

    // Employee Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let y = 70;
    
    doc.text(`Employee Name: ${selectedPayslip.full_name}`, 20, y);
    doc.text(`Period: ${selectedPayslip.period}`, pageWidth - 70, y);
    y += 8;
    doc.text(`Employee ID: ${selectedPayslip.emp_code}`, 20, y);
    doc.text(`Status: ${selectedPayslip.status}`, pageWidth - 70, y);
    y += 8;
    doc.text(`Department: ${selectedPayslip.department}`, 20, y);
    
    // Line separator
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);

    // Earnings Section
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('EARNINGS', 20, y);
    doc.text('AMOUNT (S$)', pageWidth - 60, y);
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Basic Salary', 20, y);
    doc.text(parseFloat(selectedPayslip.basic).toFixed(2), pageWidth - 60, y);
    
    const allowances = typeof selectedPayslip.allowances === 'string' 
      ? JSON.parse(selectedPayslip.allowances) 
      : selectedPayslip.allowances;
      
    Object.entries(allowances || {}).forEach(([key, value]) => {
      if (value && parseFloat(value) > 0 && key !== 'cpf_employer') {
        y += 7;
        doc.text(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 20, y);
        doc.text(parseFloat(value).toFixed(2), pageWidth - 60, y);
      }
    });

    const totalEarnings = parseFloat(selectedPayslip.basic) + 
      Object.values(allowances || {}).reduce((sum, val) => {
        if (typeof val === 'string' && val !== '' && val !== 'cpf_employer') return sum + parseFloat(val);
        if (typeof val === 'number') return sum + val;
        return sum;
      }, 0);

    y += 10;
    doc.line(20, y, pageWidth - 20, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Earnings', 20, y);
    doc.text(totalEarnings.toFixed(2), pageWidth - 60, y);

    // Deductions Section
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('DEDUCTIONS', 20, y);
    doc.text('AMOUNT (S$)', pageWidth - 60, y);
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    
    const deductions = typeof selectedPayslip.deductions === 'string'
      ? JSON.parse(selectedPayslip.deductions)
      : selectedPayslip.deductions;
      
    Object.entries(deductions || {}).forEach(([key, value]) => {
      if (value && parseFloat(value) > 0) {
        y += 7;
        doc.text(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 20, y);
        doc.text(parseFloat(value).toFixed(2), pageWidth - 60, y);
      }
    });

    const totalDeductions = Object.values(deductions || {}).reduce((sum, val) => {
      if (typeof val === 'string' && val !== '') return sum + parseFloat(val);
      if (typeof val === 'number') return sum + val;
      return sum;
    }, 0);

    y += 10;
    doc.line(20, y, pageWidth - 20, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Deductions', 20, y);
    doc.text(totalDeductions.toFixed(2), pageWidth - 60, y);

    // Net Pay
    y += 15;
    doc.setFillColor(28, 42, 73);
    doc.rect(20, y - 5, pageWidth - 40, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('NET PAY', 25, y + 5);
    doc.text(`S$ ${parseFloat(selectedPayslip.net).toFixed(2)}`, pageWidth - 25, y + 5, { align: 'right' });

    // Footer Notes
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    y += 25;
    doc.text('Note: CPF and statutory deductions are subject to company policy and Singapore regulations.', 20, y);
    y += 5;
    doc.text(`Employer CPF Contribution: S$ ${(allowances?.cpf_employer || 0)}`, 20, y);
    y += 5;
    doc.text('This is a computer-generated payslip and does not require a signature.', 20, y);

    // Save PDF
    doc.save(`payslip-${selectedPayslip.emp_code}-${selectedPayslip.period}.pdf`);
    toast.success('Payslip downloaded!');
  };

  if (loading) {
    return <div className="skeleton h-64"></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="salary-page">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-heading font-bold">Salary & Payroll</h2>
        {['Admin', 'Director', 'HR', 'Finance'].includes(user.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2"
          >
            <span>➕</span>
            Create Salary Entry
          </button>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xl font-semibold">Salary Records</h3>
        </div>
        {salaries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Period</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Basic</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Net Pay</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((salary, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/50">
                    <td className="px-6 py-4">{salary.full_name}</td>
                    <td className="px-6 py-4">{salary.period}</td>
                    <td className="px-6 py-4">{formatCurrency(salary.basic)}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(salary.net)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(salary.status)}`}>
                        {salary.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewPayslip(salary.id)}
                          className="text-primary hover:underline text-sm"
                        >
                          View Payslip
                        </button>
                        {['Admin', 'Director', 'Finance'].includes(user.role) && (
                          <select
                            value={salary.status}
                            onChange={(e) => handleUpdateStatus(salary.id, e.target.value)}
                            className="px-2 py-1 border border-input rounded text-xs bg-background"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="On-hold">On-hold</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <p>No salary records found</p>
            <p className="text-sm mt-2">Create salary entries to start processing payroll</p>
          </div>
        )}
      </div>

      {/* Create Salary Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-card p-8 rounded-lg shadow-2xl max-w-3xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-heading font-bold mb-6">Create Salary Entry</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Employee *</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.filter(e => e.status === 'Active').map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Period (YYYY-MM) *</label>
                  <input
                    type="month"
                    value={formData.period}
                    onChange={(e) => setFormData({...formData, period: e.target.value})}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Basic Salary (S$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.basic}
                  onChange={(e) => setFormData({...formData, basic: e.target.value})}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  required
                />
              </div>

              <div>
                <h4 className="font-semibold mb-2">Allowances (S$)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Transport"
                    value={formData.allowances.transport}
                    onChange={(e) => setFormData({...formData, allowances: {...formData.allowances, transport: e.target.value}})}
                    className="px-4 py-2 border border-input rounded-md bg-background"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Housing"
                    value={formData.allowances.housing}
                    onChange={(e) => setFormData({...formData, allowances: {...formData.allowances, housing: e.target.value}})}
                    className="px-4 py-2 border border-input rounded-md bg-background"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Meal"
                    value={formData.allowances.meal}
                    onChange={(e) => setFormData({...formData, allowances: {...formData.allowances, meal: e.target.value}})}
                    className="px-4 py-2 border border-input rounded-md bg-background"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Deductions (S$)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="CPF Employee (20%)"
                    value={formData.deductions.cpf_employee}
                    onChange={(e) => setFormData({...formData, deductions: {...formData.deductions, cpf_employee: e.target.value}})}
                    className="px-4 py-2 border border-input rounded-md bg-background"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Tax"
                    value={formData.deductions.tax}
                    onChange={(e) => setFormData({...formData, deductions: {...formData.deductions, tax: e.target.value}})}
                    className="px-4 py-2 border border-input rounded-md bg-background"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Other"
                    value={formData.deductions.other}
                    onChange={(e) => setFormData({...formData, deductions: {...formData.deductions, other: e.target.value}})}
                    className="px-4 py-2 border border-input rounded-md bg-background"
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                Note: Employer CPF (17%) will be automatically calculated and displayed in payslip
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
                >
                  Create Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-muted px-6 py-2 rounded-md hover:bg-muted/80"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-heading font-bold">Payslip</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadPayslipPDF}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm"
                >
                  📥 Download PDF
                </button>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="bg-muted px-4 py-2 rounded-md hover:bg-muted/80 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="p-8">
              {/* Preview similar to PDF */}
              <div className="bg-primary text-primary-foreground p-6 rounded-t-lg text-center">
                <h2 className="text-2xl font-bold">DL LAW CORPORATION</h2>
                <p className="text-sm mt-2">8 Eu Tong Sen Street #20-98, Clarke Quay Central, Singapore 059818</p>
                <p className="text-sm">Tel: 6557 0215</p>
              </div>
              
              <div className="border border-border border-t-0 p-6 rounded-b-lg">
                <h3 className="text-xl font-bold text-center mb-6">PAYSLIP</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee Name</p>
                    <p className="font-semibold">{selectedPayslip.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="font-semibold">{selectedPayslip.period}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-semibold">{selectedPayslip.emp_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-semibold">{selectedPayslip.department}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold mb-3">Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span>{formatCurrency(selectedPayslip.basic)}</span>
                    </div>
                    {Object.entries(typeof selectedPayslip.allowances === 'string' ? JSON.parse(selectedPayslip.allowances || '{}') : (selectedPayslip.allowances || {})).map(([key, value]) => (
                      value && parseFloat(value) > 0 && key !== 'cpf_employer' && (
                        <div key={key} className="flex justify-between text-sm">
                          <span>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          <span>{formatCurrency(value)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Deductions</h4>
                  <div className="space-y-2">
                    {Object.entries(typeof selectedPayslip.deductions === 'string' ? JSON.parse(selectedPayslip.deductions || '{}') : (selectedPayslip.deductions || {})).map(([key, value]) => (
                      value && parseFloat(value) > 0 && (
                        <div key={key} className="flex justify-between text-sm">
                          <span>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          <span>{formatCurrency(value)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div className="bg-primary text-primary-foreground p-4 rounded mt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">NET PAY</span>
                    <span className="text-2xl font-bold">{formatCurrency(selectedPayslip.net)}</span>
                  </div>
                </div>

                <div className="mt-6 text-xs text-muted-foreground italic space-y-1">
                  <p>Note: CPF and statutory deductions are subject to company policy.</p>
                  <p>Employer CPF Contribution: {formatCurrency((typeof selectedPayslip.allowances === 'string' ? JSON.parse(selectedPayslip.allowances || '{}') : (selectedPayslip.allowances || {})).cpf_employer || 0)}</p>
                  <p>This is a computer-generated payslip.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-2">💡 Important Information</h3>
        <p className="text-sm text-muted-foreground">
          CPF and statutory deductions are calculated according to Singapore regulations. 
          All salary figures are subject to final confirmation. Payslips can be downloaded as PDF for records.
        </p>
      </div>
    </div>
  );
};

export default Salary;