import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: String, // format HH:MM:SS
    },
    checkOut: {
      type: String, // format HH:MM:SS
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    breakTime: {
      type: Number, // in minutes
      default: 0,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half-day', 'Leave', 'Holiday', 'WFH'],
      default: 'Absent',
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    isEarlyDeparture: {
      type: Boolean,
      default: false,
    },
    regularizationRequest: {
      requested: { type: Boolean, default: false },
      reason: { type: String },
      status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      checkIn: { type: String },
      checkOut: { type: String },
    },
  },
  { timestamps: true }
);

// Compound index to ensure one attendance log per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
