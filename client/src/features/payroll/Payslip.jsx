import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPayslipQuery } from '../../services/api';
import { ArrowLeft, Download, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Payslip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: payslipResult, isLoading } = useGetPayslipQuery(id);

  const handleDownloadPDF = () => {
    if (!payslipResult?.data) return toast.error('Payslip details missing');
    const p = payslipResult.data;
    const emp = p.employee;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('Inter', 'bold');
    doc.setTextColor(15, 20, 40);
    doc.text('HRMS PRO INC.', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('Inter', 'normal');
    doc.text('123 Corporate Ave, Silicon Valley, USA', 14, 26);
    doc.text('Web: www.hrmspro.com | Email: payroll@hrmspro.com', 14, 31);
    
    // Title
    doc.setFontSize(14);
    doc.setFont('Inter', 'bold');
    doc.text(`SALARY PAYSLIP - ${p.payPeriod.toUpperCase()}`, 14, 45);

    // Employee & Period metadata block
    doc.setFontSize(10);
    doc.setFont('Inter', 'normal');
    doc.text(`Employee ID: ${emp.employeeId}`, 14, 55);
    doc.text(`Name: ${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`, 14, 61);
    doc.text(`Designation: ${emp.workInfo.designation}`, 14, 67);
    doc.text(`Department: ${emp.workInfo.department?.name || 'N/A'}`, 14, 73);

    doc.text(`Bank Name: ${emp.salaryInfo.bankName || 'N/A'}`, 120, 55);
    doc.text(`Account No: ${emp.salaryInfo.accountNumber ? `xxxx-xxxx-${emp.salaryInfo.accountNumber.slice(-4)}` : 'N/A'}`, 120, 61);
    doc.text(`IFSC Code: ${emp.salaryInfo.ifsc || 'N/A'}`, 120, 67);
    doc.text(`LOP Days: ${p.lopDays || 0}`, 120, 73);

    // Earnings vs Deductions Table
    const tableColumn = ['Earnings Description', 'Amount ($)', 'Deductions Description', 'Amount ($)'];
    
    const tableRows = [
      ['Basic Salary', p.earnings.basic, 'Provident Fund (PF)', p.deductions.pf],
      ['HRA Allowance', p.earnings.hra, 'Employee State Ins. (ESI)', p.deductions.esi],
      ['Dearness Allowance (DA)', p.earnings.da, 'Professional Tax (PT)', p.deductions.pt],
      ['Conveyance', p.earnings.conveyance, 'TDS / Income Tax', p.deductions.tds],
      ['Medical Allowance', p.earnings.medical, 'Loan Deductions', p.deductions.loan],
      ['Special Allowance', p.earnings.special, 'Loss of Pay (LOP) amount', p.lopAmount],
      ['Other Allowances', p.earnings.other, 'Other Deductions', p.deductions.other],
      ['Gross Earnings', p.grossEarnings, 'Total Deductions', p.totalDeductions]
    ];

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 83,
      theme: 'grid',
      headStyles: { fillColor: [79, 158, 255] },
      columnStyles: {
        0: { fontStyle: 'normal' },
        1: { fontStyle: 'bold', halign: 'right' },
        2: { fontStyle: 'normal' },
        3: { fontStyle: 'bold', halign: 'right' }
      }
    });

    // Net Payout summary block
    const finalY = doc.previousAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('Inter', 'bold');
    doc.text(`NET PAYOUT: $${p.netPay.toLocaleString()}`, 14, finalY);

    doc.setFontSize(9);
    doc.setFont('Inter', 'italic');
    doc.text('This is a system generated payslip and requires no physical signature.', 14, finalY + 12);

    doc.save(`payslip_${emp.employeeId}_${p.payPeriod.replace(' ', '_')}.pdf`);
  };

  if (isLoading) {
    return <LoadingSkeleton type="list" />;
  }

  if (!payslipResult?.data) {
    return <div className="text-center text-text-muted mt-10">Payslip record not found</div>;
  }

  const p = payslipResult.data;
  const emp = p.employee;

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Return
        </button>

        <div className="flex gap-2">
          <Button onClick={handleDownloadPDF} variant="primary" icon={Download} className="font-semibold">
            Download PDF
          </Button>
        </div>
      </div>

      {/* Styled Glass Payslip Container */}
      <Card hover={false} className="border border-white/10 p-8 flex flex-col gap-8 bg-white/[0.02] shadow-glass rounded-2xl relative overflow-hidden">
        {/* Glow blur element */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Company Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-5 gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">HRMS PRO INC.</h2>
            <span className="text-[10px] text-text-secondary">Corporate Payroll Operations Department</span>
          </div>
          <div className="text-left sm:text-right">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Salary Payslip</h3>
            <span className="text-xs text-accent-primary font-semibold font-mono">{p.payPeriod}</span>
          </div>
        </div>

        {/* Employee & Bank Grid info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs leading-relaxed border-b border-white/5 pb-5">
          <div className="flex flex-col gap-1.5">
            <div><span className="text-text-secondary">Employee Name:</span> <span className="font-semibold text-text-primary">{emp.fullName}</span></div>
            <div><span className="text-text-secondary">Employee ID:</span> <span className="font-semibold font-mono text-text-primary">{emp.employeeId}</span></div>
            <div><span className="text-text-secondary">Designation:</span> <span className="font-semibold text-text-primary">{emp.workInfo.designation}</span></div>
            <div><span className="text-text-secondary">Department:</span> <span className="font-semibold text-text-primary">{emp.workInfo.department?.name || 'N/A'}</span></div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div><span className="text-text-secondary">Bank Name:</span> <span className="font-semibold text-text-primary">{emp.salaryInfo.bankName || 'N/A'}</span></div>
            <div><span className="text-text-secondary">Account Number:</span> <span className="font-semibold font-mono text-text-primary">xxxx-xxxx-{emp.salaryInfo.accountNumber?.slice(-4) || 'N/A'}</span></div>
            <div><span className="text-text-secondary">IFSC Code:</span> <span className="font-semibold font-mono text-text-primary">{emp.salaryInfo.ifsc || 'N/A'}</span></div>
            <div><span className="text-text-secondary">Loss of Pay (LOP):</span> <span className="font-semibold text-state-danger">{p.lopDays || 0} days absent</span></div>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          {/* Earnings */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-accent-primary border-b border-white/5 pb-1">Earnings Detail</h4>
            <div className="flex flex-col gap-2.5 font-medium">
              <div className="flex justify-between"><span>Basic Salary</span><span className="font-mono">${p.earnings.basic}</span></div>
              <div className="flex justify-between"><span>HRA Allowance</span><span className="font-mono">${p.earnings.hra}</span></div>
              <div className="flex justify-between"><span>Dearness Allowance (DA)</span><span className="font-mono">${p.earnings.da}</span></div>
              <div className="flex justify-between"><span>Conveyance</span><span className="font-mono">${p.earnings.conveyance}</span></div>
              <div className="flex justify-between"><span>Medical Allowance</span><span className="font-mono">${p.earnings.medical}</span></div>
              <div className="flex justify-between"><span>Special Allowance</span><span className="font-mono">${p.earnings.special}</span></div>
              <div className="flex justify-between"><span>Other Allowances</span><span className="font-mono">${p.earnings.other}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-2.5 font-bold text-text-primary"><span>Gross Earnings</span><span className="font-mono">${p.grossEarnings}</span></div>
            </div>
          </div>

          {/* Deductions */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-state-danger border-b border-white/5 pb-1">Deductions Detail</h4>
            <div className="flex flex-col gap-2.5 font-medium">
              <div className="flex justify-between"><span>Provident Fund (PF)</span><span className="font-mono">${p.deductions.pf}</span></div>
              <div className="flex justify-between"><span>Employee State Ins. (ESI)</span><span className="font-mono">${p.deductions.esi}</span></div>
              <div className="flex justify-between"><span>Professional Tax (PT)</span><span className="font-mono">${p.deductions.pt}</span></div>
              <div className="flex justify-between"><span>TDS / Income Tax</span><span className="font-mono">${p.deductions.tds}</span></div>
              <div className="flex justify-between"><span>Loan Deductions</span><span className="font-mono">${p.deductions.loan}</span></div>
              <div className="flex justify-between text-state-warning"><span>Loss of Pay (LOP) amount</span><span className="font-mono">${p.lopAmount}</span></div>
              <div className="flex justify-between"><span>Other Deductions</span><span className="font-mono">${p.deductions.other}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-2.5 font-bold text-text-primary"><span>Total Deductions</span><span className="font-mono">${p.totalDeductions}</span></div>
            </div>
          </div>
        </div>

        {/* Net payout highlight */}
        <div className="flex items-center justify-between p-4.5 rounded-xl bg-state-success/10 border border-state-success/15 mt-2">
          <span className="text-sm font-semibold text-state-success">NET REMUNERATION PAID:</span>
          <span className="text-2xl font-bold font-mono text-state-success">${p.netPay.toLocaleString()}</span>
        </div>
      </Card>
    </div>
  );
};

export default Payslip;
