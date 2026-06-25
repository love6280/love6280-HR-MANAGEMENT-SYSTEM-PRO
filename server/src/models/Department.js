import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
  },
  { timestamps: true }
);

const Department = mongoose.model('Department', departmentSchema);
export default Department;
