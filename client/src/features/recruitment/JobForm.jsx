import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCreateJobMutation, useGetDepartmentsQuery } from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Briefcase } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import RichTextEditor from '../../components/ui/RichTextEditor';
import Card from '../../components/ui/Card';

const JobForm = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [createJobApi, { isLoading }] = useCreateJobMutation();
  const { data: deptData } = useGetDepartmentsQuery();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      location: 'Bangalore, India (Hybrid)',
      type: 'Full-time',
      experience: '2-5 years',
      status: 'Published'
    }
  });

  const onSubmit = async (data) => {
    if (!description || description === '<p><br></p>') {
      return toast.error('Please input a job description');
    }

    try {
      const skillsArray = data.skillsString ? data.skillsString.split(',').map(s => s.trim()) : [];
      
      await createJobApi({
        title: data.title,
        department: data.department,
        location: data.location,
        type: data.type,
        experience: data.experience,
        skills: skillsArray,
        description: description,
        salaryRange: {
          min: parseFloat(data.salaryMin || 0),
          max: parseFloat(data.salaryMax || 0)
        },
        status: data.status
      }).unwrap();

      toast.success('Job posting created successfully!');
      navigate('/recruitment');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create job posting.');
    }
  };

  const departmentOptions = [
    { label: 'Select Department', value: '' },
    ...(deptData?.data || []).map(d => ({ label: d.name, value: d._id }))
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/recruitment')}
          className="p-1.5 hover:bg-white/5 text-text-secondary hover:text-text-primary rounded-lg transition-colors border border-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Create Job Posting</h1>
          <p className="text-sm text-text-secondary font-medium">Publish a new job listing to attract candidate applications</p>
        </div>
      </div>

      {/* Form Details */}
      <Card hover={false} className="border border-white/5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-accent-primary font-semibold text-sm">
            <Briefcase className="h-4.5 w-4.5" /> Job Listing Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Job Opening Title *"
              placeholder="e.g. Senior Backend Engineer"
              error={errors.title}
              {...register('title', { required: 'Job title is required' })}
            />
            <Select
              label="Target Department *"
              options={departmentOptions}
              error={errors.department}
              {...register('department', { required: 'Department is required' })}
            />
            <Input
              label="Work Location *"
              placeholder="e.g. Bangalore, India (Hybrid)"
              error={errors.location}
              {...register('location', { required: 'Work location is required' })}
            />
            <Select
              label="Employment Type"
              options={[
                { label: 'Full-time', value: 'Full-time' },
                { label: 'Part-time', value: 'Part-time' },
                { label: 'Contract', value: 'Contract' },
                { label: 'Intern', value: 'Intern' }
              ]}
              {...register('type')}
            />
            <Input
              label="Experience Range Required *"
              placeholder="e.g. 3-5 years"
              error={errors.experience}
              {...register('experience', { required: 'Experience range is required' })}
            />
            <Input
              label="Core Skills Required (Comma-separated) *"
              placeholder="React, Node, Express, MongoDB"
              error={errors.skillsString}
              {...register('skillsString', { required: 'Skills listing is required' })}
            />
            
            <Input
              label="Minimum Salary P.A ($)"
              type="number"
              placeholder="60000"
              {...register('salaryMin')}
            />
            <Input
              label="Maximum Salary P.A ($)"
              type="number"
              placeholder="90000"
              {...register('salaryMax')}
            />

            <Select
              label="Posting Status"
              options={[
                { label: 'Published (Public Board)', value: 'Published' },
                { label: 'Draft (Internal Only)', value: 'Draft' },
                { label: 'Closed (Filled/Archived)', value: 'Closed' }
              ]}
              {...register('status')}
            />
          </div>

          {/* Description rich editor */}
          <div className="col-span-full">
            <RichTextEditor
              label="Detailed Job Description *"
              value={description}
              onChange={setDescription}
            />
          </div>

          {/* Action triggers */}
          <div className="flex justify-end gap-3 border-t border-white/5 pt-5">
            <Button type="button" variant="ghost" onClick={() => navigate('/recruitment')}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading} variant="primary" icon={Save} className="font-semibold">
              Publish Listing
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default JobForm;
