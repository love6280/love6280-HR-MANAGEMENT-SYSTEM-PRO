import mongoose from 'mongoose';

const performanceReviewSchema = new mongoose.Schema(
  {
    reviewCycle: {
      type: String, // e.g. "Q3 2026" or "Annual 2026"
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    type: {
      type: String,
      enum: ['Self', 'Manager', 'Peer'],
      default: 'Self',
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    ratings: {
      communication: { type: Number, min: 1, max: 5, default: 3 },
      technical: { type: Number, min: 1, max: 5, default: 3 },
      teamwork: { type: Number, min: 1, max: 5, default: 3 },
      punctuality: { type: Number, min: 1, max: 5, default: 3 },
      initiative: { type: Number, min: 1, max: 5, default: 3 },
      leadership: { type: Number, min: 1, max: 5, default: 3 },
    },
    overallRating: {
      type: Number,
      default: 3,
    },
    selfAssessment: {
      achievements: String,
      challenges: String,
      learning: String,
    },
    managerComments: {
      type: String,
    },
    developmentPlan: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Draft', 'SubmittedByEmployee', 'ReviewedByManager', 'Acknowledged', 'Completed'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate overall rating as average of ratings
performanceReviewSchema.pre('save', function (next) {
  const r = this.ratings;
  const avg = (r.communication + r.technical + r.teamwork + r.punctuality + r.initiative + r.leadership) / 6;
  this.overallRating = Math.round(avg * 100) / 100;
  next();
});

const PerformanceReview = mongoose.model('PerformanceReview', performanceReviewSchema);
export default PerformanceReview;
