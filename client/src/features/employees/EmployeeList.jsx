import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetEmployeesQuery,
  useBulkEmployeeActionMutation,
  useGetDepartmentsQuery
} from '../../services/api';
import {
  Grid, List as ListIcon, Search, SlidersHorizontal, Plus,
  MoreVertical, UserCheck, UserX, Trash2, Eye
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('deactivate');

  const { data: deptData } = useGetDepartmentsQuery();
  const { data: empData, isLoading, refetch } = useGetEmployeesQuery({
    search,
    department: deptFilter,
    status: statusFilter,
    page,
    limit,
  });

  const [bulkAction] = useBulkEmployeeActionMutation();

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = (checked, items) => {
    if (checked) {
      setSelectedIds(items.map(e => e._id));
    } else {
      setSelectedIds([]);
    }
  };

  const triggerBulkAction = (type) => {
    if (selectedIds.length === 0) {
      return toast.error('No employees selected');
    }
    setBulkActionType(type);
    setIsConfirmOpen(true);
  };

  const handleExecuteBulkAction = async () => {
    try {
      await bulkAction({ ids: selectedIds, action: bulkActionType }).unwrap();
      toast.success(`Bulk ${bulkActionType} complete!`);
      setSelectedIds([]);
      refetch();
    } catch (err) {
      toast.error('Bulk action failed.');
    }
  };

  // Convert departments to select options
  const deptOptions = [
    { label: 'All Departments', value: '' },
    ...(deptData?.data || []).map(d => ({ label: d.name, value: d._id }))
  ];

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' }
  ];

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={empData?.data && selectedIds.length === empData.data.length}
          onChange={(e) => handleSelectAll(e.target.checked, empData?.data || [])}
          className="rounded border-white/10 bg-white/5 cursor-pointer h-4 w-4"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row._id)}
          onChange={() => handleSelectRow(row._id)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-white/10 bg-white/5 cursor-pointer h-4 w-4"
        />
      )
    },
    {
      header: 'Employee ID',
      render: (row) => <span className="font-mono text-xs">{row.employeeId}</span>
    },
    {
      header: 'Employee Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.personalInfo.photo} name={row.fullName} size="sm" />
          <span className="font-semibold">{row.fullName}</span>
        </div>
      )
    },
    {
      header: 'Work Info',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold">{row.workInfo.designation}</span>
          <span className="text-[10px] text-text-secondary">{row.workInfo.department?.name || 'Unassigned'}</span>
        </div>
      )
    },
    {
      header: 'Email / Phone',
      render: (row) => (
        <div className="flex flex-col text-xs text-text-secondary">
          <span>{row.contactInfo.workEmail}</span>
          <span>{row.contactInfo.phone}</span>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/employees/${row._id}`)}
            icon={Eye}
          />
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Employees</h1>
          <p className="text-sm text-text-secondary">Manage company employee rosters and profile folders</p>
        </div>
        <Button
          onClick={() => navigate('/employees/add')}
          variant="primary"
          icon={Plus}
          className="font-semibold"
        >
          Add Employee
        </Button>
      </div>

      {/* Control panel */}
      <Card hover={false} className="flex flex-col gap-4 border border-white/5 py-4">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search ID, name or email..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg input-glass text-sm glow-border"
            />
          </div>
          <Select
            options={deptOptions}
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          />
          {/* View toggle */}
          <div className="flex justify-end gap-1.5 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-all ${viewMode === 'grid' ? 'bg-white/10 text-accent-primary border-accent-primary/20' : 'bg-white/5 border-white/5 text-text-secondary hover:text-text-primary'}`}
            >
              <Grid className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-all ${viewMode === 'list' ? 'bg-white/10 text-accent-primary border-accent-primary/20' : 'bg-white/5 border-white/5 text-text-secondary hover:text-text-primary'}`}
            >
              <ListIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5 animate-fade-in text-xs font-medium">
            <span>Selected {selectedIds.length} employee(s)</span>
            <Button
              onClick={() => triggerBulkAction('deactivate')}
              variant="secondary"
              size="sm"
              icon={UserX}
            >
              Deactivate
            </Button>
            <Button
              onClick={() => triggerBulkAction('activate')}
              variant="secondary"
              size="sm"
              icon={UserCheck}
            >
              Activate
            </Button>
            <Button
              onClick={() => triggerBulkAction('delete')}
              variant="danger"
              size="sm"
              icon={Trash2}
            >
              Delete
            </Button>
          </div>
        )}
      </Card>

      {/* Grid or List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
            ))
          ) : empData?.data && empData.data.length > 0 ? (
            empData.data.map((emp) => (
              <Card
                key={emp._id}
                hover={true}
                className="flex flex-col items-center text-center relative border border-white/5 p-6"
              >
                {/* Checkbox select */}
                <input
                  type="checkbox"
                  checked={selectedIds.includes(emp._id)}
                  onChange={() => handleSelectRow(emp._id)}
                  className="absolute top-4 left-4 rounded border-white/10 bg-white/5 cursor-pointer h-4 w-4 z-10"
                />

                <Avatar src={emp.personalInfo.photo} name={emp.fullName} size="lg" className="mb-4" />
                <h3 className="font-semibold text-text-primary text-sm truncate max-w-full">{emp.fullName}</h3>
                <span className="text-[11px] font-mono text-text-secondary mt-0.5">{emp.employeeId}</span>
                <span className="text-xs text-accent-primary font-medium mt-1">{emp.workInfo.designation}</span>
                <span className="text-[10px] text-text-muted mt-0.5">{emp.workInfo.department?.name || 'Unassigned'}</span>

                <div className="flex flex-col gap-0.5 text-[10px] text-text-secondary mt-4 w-full border-t border-white/5 pt-3">
                  <span className="truncate">{emp.contactInfo.workEmail}</span>
                  <span>{emp.contactInfo.phone}</span>
                </div>

                <div className="flex items-center justify-between w-full mt-4">
                  <Badge variant={emp.isActive ? 'success' : 'danger'}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    onClick={() => navigate(`/employees/${emp._id}`)}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    icon={Eye}
                  >
                    View Folder
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card hover={false} className="py-12 text-center text-text-muted">No employees found matching filter</Card>
            </div>
          )}
        </div>
      ) : (
        <Table
          columns={columns}
          data={empData?.data || []}
          loading={isLoading}
          onRowClick={(row) => navigate(`/employees/${row._id}`)}
        />
      )}

      {/* Pagination */}
      {empData?.total > 0 && (
        <Pagination
          total={empData.total}
          page={page}
          perPage={limit}
          onChange={(p) => setPage(p)}
        />
      )}

      {/* Confirm dialogues */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteBulkAction}
        title={`Bulk ${bulkActionType === 'delete' ? 'Delete' : 'Status Toggle'}`}
        message={`Are you sure you want to perform this bulk action (${bulkActionType}) on ${selectedIds.length} employee(s)?`}
        confirmText="Confirm Action"
      />
    </div>
  );
};

export default EmployeeList;
