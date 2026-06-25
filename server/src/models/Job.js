import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
      default: 'Full-time',
    },
    experience: {
      type: String, // e.g. "2-5 years"
      required: true,
    },
    skills: [
      {
        type: String,
      },
    ],
    description: {
      type: String, // Rich Text
      required: true,
    },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Closed'],
      default: 'Draft',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Job = mongoose.model('Job', jobSchema);
export default Job;
