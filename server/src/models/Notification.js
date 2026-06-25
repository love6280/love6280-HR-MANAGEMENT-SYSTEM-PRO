import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'leave_request',
        'leave_approved',
        'leave_rejected',
        'attendance_regularization',
        'payslip_generated',
        'interview_scheduled',
        'announcement',
        'birthday_reminder',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String, // route link to redirect on click
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
