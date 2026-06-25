import mongoose from 'mongoose';

const balanceDetailSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
}, { _id: false });

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    casual: { type: balanceDetailSchema, default: () => ({ total: 10, used: 0, remaining: 10 }) },
    sick: { type: balanceDetailSchema, default: () => ({ total: 10, used: 0, remaining: 10 }) },
    paid: { type: balanceDetailSchema, default: () => ({ total: 15, used: 0, remaining: 15 }) },
    wfh: { type: balanceDetailSchema, default: () => ({ total: 20, used: 0, remaining: 20 }) },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);
export default LeaveBalance;
