import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCreateEmployeeMutation, useGetDepartmentsQuery, useGetEmployeesQuery } from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Save, User, Briefcase, PhoneCall, DollarSign } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Stepper from '../../components/ui/Stepper';
import Card from '../../components/ui/Card';

const EmployeeForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [createEmployeeApi, { isLoading }] = useCreateEmployeeMutation();
  const { data: deptData } = useGetDepartmentsQuery();
  const { data: managerData } = useGetEmployeesQuery({ limit: 100 });

  const { register, handleSubmit, trigger, watch, formState: { errors } } = useForm({
    defaultValues: {
      personalInfo: { gender: 'Male', maritalStatus: 'Single', photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80' },
      workInfo: { employmentType: 'Full-time', workLocation: 'Bangalore Office', shift: '09:00 - 18:00' },
      salaryInfo: { basic: 0, hra: 0, da: 0, conveyance: 0, medical: 0, specialAllowance: 0, otherAllowances: 0 }
    }
  });

  // Watch salary fields to calculate total CTC
  const salaryWatch = watch('salaryInfo');
  const calculateCTC = () => {
    if (!salaryWatch) return 0;
    const basic = parseFloat(salaryWatch.basic || 0);
    const hra = parseFloat(salaryWatch.hra || 0);
    const da = parseFloat(salaryWatch.da || 0);
    const conveyance = parseFloat(salaryWatch.conveyance || 0);
    const medical = parseFloat(salaryWatch.medical || 0);
    const special = parseFloat(salaryWatch.specialAllowance || 0);
    const other = parseFloat(salaryWatch.otherAllowances || 0);
    return basic + hra + da + conveyance + medical + special + other;
  };

  const steps = ['Personal Info', 'Work Info', 'Contact & Emergency', 'Salary & Bank'];

  const validateStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = [
        'personalInfo.firstName',
        'personalInfo.lastName',
        'personalInfo.dob',
        'personalInfo.gender',
      ];
    } else if (step === 2) {
      fieldsToValidate = [
        'workInfo.department',
        'workInfo.designation',
        'workInfo.dateOfJoining',
      ];
    } else if (step === 3) {
      fieldsToValidate = [
        'contactInfo.personalEmail',
        'contactInfo.phone',
      ];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    } else {
      toast.error('Please resolve validation errors before moving forward.');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async (data) => {
    try {
      // Clean up empty ObjectIds to avoid Mongoose CastError on the backend
      const cleanedData = { ...data };
      if (cleanedData.workInfo) {
        cleanedData.workInfo = { ...cleanedData.workInfo };
        if (cleanedData.workInfo.reportingManager === '') {
          cleanedData.workInfo.reportingManager = null;
        }
        if (cleanedData.workInfo.department === '') {
          cleanedData.workInfo.department = null;
        }
      }

      const result = await createEmployeeApi(cleanedData).unwrap();
      toast.success(`Employee ${result.fullName} successfully registered!`);
      navigate('/employees');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create employee profile.');
    }
  };

  // Convert departments to select items
  const departmentOptions = [
    { label: 'Select Department', value: '' },
    ...(deptData?.data || []).map(d => ({ label: d.name, value: d._id }))
  ];

  // Convert employees to manager options
  const managerOptions = [
    { label: 'No Reporting Manager', value: '' },
    ...(managerData?.data || []).map(e => ({ label: e.fullName, value: e._id }))
  ];

  const designationOptions = [
    { label: 'Select Designation', value: '' },
    { label: 'Super Administrator', value: 'Super Administrator' },
    { label: 'HR Manager', value: 'HR Manager' },
    { label: 'Engineering Lead', value: 'Engineering Lead' },
    { label: 'Senior Engineer', value: 'Senior Engineer' },
    { label: 'Frontend Developer', value: 'Frontend Developer' },
    { label: 'Backend Developer', value: 'Backend Developer' },
    { label: 'Fullstack Developer', value: 'Fullstack Developer' },
    { label: 'QA Engineer', value: 'QA Engineer' },
    { label: 'Finance Lead', value: 'Finance Lead' },
    { label: 'Marketing Executive', value: 'Marketing Executive' },
    { label: 'Operations Associate', value: 'Operations Associate' },
    { label: 'Product Manager', value: 'Product Manager' },
    { label: 'UI/UX Designer', value: 'UI/UX Designer' }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/employees')}
          className="p-1.5 hover:bg-white/5 text-text-secondary hover:text-text-primary rounded-lg transition-colors border border-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Add New Employee</h1>
          <p className="text-sm text-text-secondary">Register a new employee profile and generate login access</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <Card hover={false} className="border border-white/5 py-2">
        <Stepper steps={steps} currentStep={step} />
      </Card>

      {/* Form Card */}
      <Card hover={false} className="border border-white/5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* STEP 1: PERSONAL INFO */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-accent-primary font-semibold text-sm">
                <User className="h-4 w-4" /> Personal Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  error={errors.personalInfo?.firstName}
                  {...register('personalInfo.firstName', { required: 'First name is required' })}
                />
                <Input
                  label="Last Name *"
                  error={errors.personalInfo?.lastName}
                  {...register('personalInfo.lastName', { required: 'Last name is required' })}
                />
                <Input
                  label="Date of Birth *"
                  type="date"
                  error={errors.personalInfo?.dob}
                  {...register('personalInfo.dob', { required: 'Date of birth is required' })}
                />
                <Select
                  label="Gender *"
                  options={[
                    { label: 'Male', value: 'Male' },
                    { label: 'Female', value: 'Female' },
                    { label: 'Other', value: 'Other' }
                  ]}
                  error={errors.personalInfo?.gender}
                  {...register('personalInfo.gender', { required: 'Gender is required' })}
                />
                <Select
                  label="Marital Status"
                  options={[
                    { label: 'Single', value: 'Single' },
                    { label: 'Married', value: 'Married' },
                    { label: 'Divorced', value: 'Divorced' },
                    { label: 'Widowed', value: 'Widowed' }
                  ]}
                  {...register('personalInfo.maritalStatus')}
                />
                <Input
                  label="Blood Group"
                  placeholder="O+"
                  {...register('personalInfo.bloodGroup')}
                />
                <Input
                  label="Aadhaar Number"
                  placeholder="12 digit Aadhaar"
                  error={errors.personalInfo?.aadhaar}
                  {...register('personalInfo.aadhaar', {
                    pattern: { value: /^\d{12}$/, message: 'Must be exactly 12 digits' }
                  })}
                />
                <Input
                  label="PAN Number"
                  placeholder="10 char PAN code"
                  error={errors.personalInfo?.pan}
                  {...register('personalInfo.pan', {
                    pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, message: 'Invalid PAN code format' }
                  })}
                />
              </div>
            </div>
          )}

          {/* STEP 2: WORK INFO */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-accent-primary font-semibold text-sm">
                <Briefcase className="h-4 w-4" /> Work Profile Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Department *"
                  options={departmentOptions}
                  error={errors.workInfo?.department}
                  {...register('workInfo.department', { required: 'Department is required' })}
                />
                <Select
                  label="Designation *"
                  options={designationOptions}
                  error={errors.workInfo?.designation}
                  {...register('workInfo.designation', { required: 'Designation is required' })}
                />
                <Input
                  label="Date of Joining *"
                  type="date"
                  error={errors.workInfo?.dateOfJoining}
                  {...register('workInfo.dateOfJoining', { required: 'Joining date is required' })}
                />
                <Select
                  label="Employment Type"
                  options={[
                    { label: 'Full-time', value: 'Full-time' },
                    { label: 'Part-time', value: 'Part-time' },
                    { label: 'Contract', value: 'Contract' },
                    { label: 'Intern', value: 'Intern' }
                  ]}
                  {...register('workInfo.employmentType')}
                />
                <Select
                  label="Reporting Manager"
                  options={managerOptions}
                  {...register('workInfo.reportingManager')}
                />
                <Input
                  label="Work Location"
                  placeholder="Bangalore Office"
                  {...register('workInfo.workLocation')}
                />
                <Input
                  label="Shift Timing"
                  placeholder="09:00 - 18:00"
                  {...register('workInfo.shift')}
                />
              </div>
            </div>
          )}

          {/* STEP 3: CONTACT & EMERGENCY */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-accent-primary font-semibold text-sm">
                <PhoneCall className="h-4 w-4" /> Contact & Emergency Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Personal Email Address *"
                  type="email"
                  placeholder="employee@gmail.com"
                  error={errors.contactInfo?.personalEmail}
                  {...register('contactInfo.personalEmail', { required: 'Personal email is required' })}
                />
                <Input
                  label="Contact Phone Number *"
                  placeholder="10 digit number"
                  error={errors.contactInfo?.phone}
                  {...register('contactInfo.phone', { required: 'Phone is required' })}
                />
                <div className="col-span-full border-t border-white/5 pt-4 mt-2">
                  <h4 className="text-xs font-semibold text-text-secondary mb-3">Residential Address</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Street" {...register('contactInfo.address.street')} />
                    <Input label="City" {...register('contactInfo.address.city')} />
                    <Input label="State" {...register('contactInfo.address.state')} />
                    <Input label="PIN Code" {...register('contactInfo.address.pin')} />
                    <Input label="Country" {...register('contactInfo.address.country')} />
                  </div>
                </div>

                <div className="col-span-full border-t border-white/5 pt-4 mt-2">
                  <h4 className="text-xs font-semibold text-text-secondary mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Contact Name" {...register('emergencyContact.name')} />
                    <Input label="Relation" {...register('emergencyContact.relation')} />
                    <Input label="Phone Number" {...register('emergencyContact.phone')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SALARY & BANK */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-accent-primary font-semibold text-sm">
                <DollarSign className="h-4 w-4" /> Salary Info & Bank Account details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Basic Salary ($/mo)" type="number" {...register('salaryInfo.basic')} />
                <Input label="HRA ($/mo)" type="number" {...register('salaryInfo.hra')} />
                <Input label="DA ($/mo)" type="number" {...register('salaryInfo.da')} />
                <Input label="Conveyance ($/mo)" type="number" {...register('salaryInfo.conveyance')} />
                <Input label="Medical Allowance ($/mo)" type="number" {...register('salaryInfo.medical')} />
                <Input label="Special Allowance ($/mo)" type="number" {...register('salaryInfo.specialAllowance')} />
                <Input label="Other Allowances ($/mo)" type="number" {...register('salaryInfo.otherAllowances')} />
                
                <div className="col-span-full flex items-center justify-between p-3 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-sm font-semibold">
                  <span>Calculated Monthly CTC:</span>
                  <span className="font-mono">${calculateCTC().toLocaleString()}</span>
                </div>

                <div className="col-span-full border-t border-white/5 pt-4 mt-2">
                  <h4 className="text-xs font-semibold text-text-secondary mb-3">Bank Account Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Bank Name" placeholder="e.g. HDFC Bank" {...register('salaryInfo.bankName')} />
                    <Input label="Account Holder Name" {...register('salaryInfo.accountHolder')} />
                    <Input label="Account Number" {...register('salaryInfo.accountNumber')} />
                    <Input label="IFSC Code" placeholder="e.g. HDFC0000001" {...register('salaryInfo.ifsc')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Controls */}
          <div className="flex items-center justify-between border-t border-white/5 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={step === 1}
              icon={ArrowLeft}
            >
              Back
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                variant="primary"
                onClick={validateStep}
                className="font-semibold"
              >
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                loading={isLoading}
                variant="primary"
                icon={Save}
                className="font-semibold"
              >
                Save Profile
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EmployeeForm;
