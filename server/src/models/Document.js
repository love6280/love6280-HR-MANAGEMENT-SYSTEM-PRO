import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'Resume',
        'Aadhaar',
        'PAN',
        'Offer Letter',
        'Experience Letter',
        'Education Certificate',
        'Bank Passbook',
      ],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },
    rejectedReason: {
      type: String,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;
