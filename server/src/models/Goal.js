import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      enum: ['Individual', 'Team', 'Company'],
      default: 'Individual',
    },
    targetDate: {
      type: Date,
      required: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
      default: 'Not Started',
    },
    notes: [
      {
        text: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
