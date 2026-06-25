import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    personalInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      dob: { type: Date, required: true },
      gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
      bloodGroup: { type: String },
      maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
      aadhaar: { type: String },
      pan: { type: String },
      photo: { type: String }, // URL to photo
    },
    contactInfo: {
      workEmail: { type: String, required: true, unique: true },
      personalEmail: { type: String },
      phone: { type: String, required: true },
      address: {
        street: String,
        city: String,
        state: String,
        pin: String,
        country: String,
      },
    },
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String },
    },
    workInfo: {
      department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
      designation: { type: String, required: true },
      dateOfJoining: { type: Date, required: true },
      employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], default: 'Full-time' },
      reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      workLocation: { type: String },
      shift: { type: String },
    },
    salaryInfo: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      otherAllowances: { type: Number, default: 0 },
      bankName: { type: String },
      accountNumber: { type: String },
      ifsc: { type: String },
      accountHolder: { type: String },
    },
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Virtual for Full Name
employeeSchema.virtual('fullName').get(function () {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
