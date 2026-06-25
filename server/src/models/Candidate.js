import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    resumeUrl: {
      type: String, // PDF or Doc URL
    },
    currentCTC: {
      type: Number,
    },
    expectedCTC: {
      type: Number,
    },
    noticePeriod: {
      type: Number, // in days
    },
    stage: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview', 'Technical', 'HR', 'Offered', 'Joined', 'Rejected'],
      default: 'Applied',
    },
    notes: [
      {
        text: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    interviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interview',
      },
    ],
    offer: {
      letterUrl: { type: String },
      status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Negotiating', 'Rejected'], default: 'Draft' },
      sentAt: { type: Date },
      joiningDate: { type: Date },
      salary: { type: Number },
    },
  },
  { timestamps: true }
);

// Virtual for Full Name
candidateSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

candidateSchema.set('toJSON', { virtuals: true });
candidateSchema.set('toObject', { virtuals: true });

const Candidate = mongoose.model('Candidate', candidateSchema);
export default Candidate;
