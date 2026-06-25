import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['Casual', 'Sick', 'Paid', 'WFH'],
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayType: {
      type: String,
      enum: ['AM', 'PM'],
    },
    reason: {
      type: String,
      required: true,
    },
    attachment: {
      type: String, // URL to attachment file
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    comments: {
      type: String,
    },
  },
  { timestamps: true }
);

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;
