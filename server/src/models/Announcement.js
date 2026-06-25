import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String, // Rich Text
      required: true,
    },
    category: {
      type: String,
      enum: ['News', 'Event', 'Holiday', 'Policy', 'Circular'],
      default: 'News',
    },
    priority: {
      type: String,
      enum: ['Normal', 'Important', 'Urgent'],
      default: 'Normal',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Department', 'Role'],
      default: 'All',
    },
    targetDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    expiresAt: {
      type: Date,
    },
    attachment: {
      type: String, // URL to document
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reactions: [
      {
        type: { type: String, enum: ['like', 'love', 'celebrate'] }, // mapped to 👍❤️🎉
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      },
    ],
    comments: [
      {
        text: { type: String, required: true },
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
