import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String, // HH:MM
      required: true,
    },
    type: {
      type: String,
      enum: ['In-person', 'Video', 'Phone'],
      default: 'Video',
    },
    interviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
    meetingLink: {
      type: String,
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String },
      recommendation: { type: String, enum: ['Proceed', 'Reject', 'Hold'] },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      submittedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
