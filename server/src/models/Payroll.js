import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: Number,
      required: true, // 1 to 12
    },
    year: {
      type: Number,
      required: true,
    },
    payPeriod: {
      type: String, // e.g. "June 2026"
    },
    earnings: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      special: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    deductions: {
      pf: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      pt: { type: Number, default: 0 }, // Professional Tax
      tds: { type: Number, default: 0 },
      loan: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    lopDays: {
      type: Number,
      default: 0,
    },
    lopAmount: {
      type: Number,
      default: 0,
    },
    grossEarnings: {
      type: Number,
      required: true,
    },
    totalDeductions: {
      type: Number,
      required: true,
    },
    netPay: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Processed', 'Paid'],
      default: 'Draft',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
    payslipUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model('Payroll', payrollSchema);
export default Payroll;
