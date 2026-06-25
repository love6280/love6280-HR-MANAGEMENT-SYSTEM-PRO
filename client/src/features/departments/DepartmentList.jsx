import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetEmployeesQuery
} from '../../services/api';
import { Building2, Plus, Users, User, Trash2, Edit3, Eye, Layers } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';

const DepartmentList = () => {
  const navigate = useNavigate();
  const { data: deptsData, isLoading, refetch } = useGetDepartmentsQuery();
  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });
  const [createDept] = useCreateDepartmentMutation();
  const [updateDept] = useUpdateDepartmentMutation();
  const [deleteDept] = useDeleteDepartmentMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDeptId, setEditDeptId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const handleOpenAdd = () => {
    setEditDeptId(null);
    reset({ name: '', description: '', hod: '', parentDepartment: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditDeptId(dept._id);
    reset({
      name: dept.name,
      description: dept.description,
      hod: dept.hod?._id || '',
      parentDepartment: dept.parentDepartment?._id || ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editDeptId) {
        await updateDept({ id: editDeptId, ...data }).unwrap();
        toast.success('Department updated successfully');
      } else {
        await createDept(data).unwrap();
        toast.success('Department created successfully');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Action failed.');
    }
  };

  const triggerDelete = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleDeleteExecute = async () => {
    try {
      await deleteDept(deleteId).unwrap();
      toast.success('Department deleted successfully');
      refetch();
    } catch (err) {
      toast.error('Failed to delete department.');
    }
  };

  // Convert options
  const employeeOptions = [
    { label: 'Select HOD', value: '' },
    ...(employeesData?.data || []).map(e => ({ label: e.fullName, value: e._id }))
  ];

  const parentDeptOptions = [
    { label: 'No Parent (Top-level)', value: '' },
    ...(deptsData?.data || [])
      .filter(d => d._id !== editDeptId)
      .map(d => ({ label: d.name, value: d._id }))
  ];

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Departments</h1>
          <p className="text-sm text-text-secondary">Structure corporate entities, teams, and department heads</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/departments/org-chart')}
            variant="secondary"
            icon={Layers}
          >
            Org Tree View
          </Button>
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            icon={Plus}
            className="font-semibold"
          >
            Add Department
          </Button>
        </div>
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {deptsData?.data && deptsData.data.map((dept) => (
          <Card
            key={dept._id}
            hover={true}
            className="flex flex-col justify-between border border-white/5 p-6 h-52 relative group"
          >
            {/* Header / Title */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-text-primary text-base">{dept.name}</h3>
                </div>

                {/* Edit/Delete Options */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => triggerDelete(dept._id)}
                    className="p-1 hover:bg-white/5 rounded text-state-danger transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-text-secondary mt-3 line-clamp-2 leading-relaxed">
                {dept.description || 'No department description provided.'}
              </p>
            </div>

            {/* Footer Summary details */}
            <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                <Users className="h-4 w-4 text-text-muted" />
                <span><span className="font-bold text-text-primary font-mono">{dept.totalEmployees}</span> Staff</span>
              </div>

              <div className="flex items-center gap-1 text-xs font-medium">
                <User className="h-4 w-4 text-accent-primary" />
                <span className="text-text-secondary">HOD: <span className="font-semibold text-text-primary">{dept.hod ? `${dept.hod.personalInfo.firstName} ${dept.hod.personalInfo.lastName}` : 'N/A'}</span></span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editDeptId ? 'Edit Department' : 'Create Department'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Department Name *"
            error={errors.name}
            {...register('name', { required: 'Department name is required' })}
          />

          <Input
            label="Description"
            placeholder="Describe the department's core responsibilities"
            {...register('description')}
          />

          <Select
            label="Head of Department (HOD)"
            options={employeeOptions}
            {...register('hod')}
          />

          <Select
            label="Parent Department"
            options={parentDeptOptions}
            {...register('parentDepartment')}
          />

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-semibold">
              Save Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteExecute}
        title="Delete Department"
        message="Are you sure you want to delete this department? Employees registered under this department will be unassigned."
      />
    </div>
  );
};

export default DepartmentList;
