import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import { Building2, Landmark, ShieldCheck, CalendarRange, Plus, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Tabs from '../../components/ui/Tabs';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState('company');

  // Company profile states
  const [compName, setCompName] = useState('HRMS Pro System Inc.');
  const [compAddr, setCompAddr] = useState('123 Corporate Ave, Silicon Valley, CA, USA');
  const [compCIN, setCompCIN] = useState('U72200KA2021PTC147822');
  const [compGST, setCompGST] = useState('29AAAAA1111A1Z1');

  // Leave policy states
  const [casualDays, setCasualDays] = useState(10);
  const [sickDays, setSickDays] = useState(10);
  const [paidDays, setPaidDays] = useState(15);
  const [carryForward, setCarryForward] = useState(5);

  // Payroll config
  const [pfRate, setPfRate] = useState(12); // % of basic
  const [esiRate, setEsiRate] = useState(0.75); // % of gross
  const [payDay, setPayDay] = useState(1); // 1st of month

  // Holidays list
  const [holidays, setHolidays] = useState([
    { name: 'New Year Day', date: '2026-01-01', type: 'National' },
    { name: 'Independence Day', date: '2026-08-15', type: 'National' },
    { name: 'Christmas Day', date: '2026-12-25', type: 'National' }
  ]);
  const [newHolName, setNewHolName] = useState('');
  const [newHolDate, setNewHolDate] = useState('');
  const [newHolType, setNewHolType] = useState('National');

  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!newHolName || !newHolDate) return toast.error('Please fill required holiday details');
    setHolidays([...holidays, { name: newHolName, date: newHolDate, type: newHolType }]);
    setNewHolName('');
    setNewHolDate('');
    toast.success('Holiday added to calendar');
  };

  const handleDeleteHoliday = (idx) => {
    setHolidays(holidays.filter((_, i) => i !== idx));
    toast.success('Holiday removed');
  };

  const handleSaveCompany = (e) => {
    e.preventDefault();
    toast.success('Company profile configurations updated!');
  };

  const handleSavePolicy = (e) => {
    e.preventDefault();
    toast.success('Leave policy parameters saved successfully!');
  };

  const handleSavePayroll = (e) => {
    e.preventDefault();
    toast.success('Payroll structures and statutory rates updated!');
  };

  const tabItems = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'policy', label: 'Leave Policy', icon: CalendarRange },
    { id: 'payroll', label: 'Payroll Slabs', icon: Landmark },
    { id: 'holidays', label: 'Holidays Calendar', icon: CalendarRange }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight font-sans">Settings Portal</h1>
        <p className="text-sm text-text-secondary">Configure statutory rates, corporate profiles, leave structures, and holidays</p>
      </div>

      <Tabs items={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* COMPANY PROFILE */}
      {activeTab === 'company' && (
        <Card hover={false} className="border border-white/5">
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-accent-primary font-semibold text-sm">
              <Building2 className="h-4.5 w-4.5" /> Company Profile Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                required
              />
              <Input
                label="Company Address *"
                value={compAddr}
                onChange={(e) => setCompAddr(e.target.value)}
                required
              />
              <Input
                label="Corporate Identity No (CIN)"
                value={compCIN}
                onChange={(e) => setCompCIN(e.target.value)}
              />
              <Input
                label="GSTIN Number"
                value={compGST}
                onChange={(e) => setCompGST(e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-white/5 mt-2">
              <Button type="submit" variant="primary" className="font-semibold">
                Save Configurations
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* LEAVE POLICY */}
      {activeTab === 'policy' && (
        <Card hover={false} className="border border-white/5">
          <form onSubmit={handleSavePolicy} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-accent-primary font-semibold text-sm">
              <CalendarRange className="h-4.5 w-4.5" /> Yearly Allocations & carry forwards
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Casual Leave (Days/Yr)"
                type="number"
                value={casualDays}
                onChange={(e) => setCasualDays(e.target.value)}
              />
              <Input
                label="Sick Leave (Days/Yr)"
                type="number"
                value={sickDays}
                onChange={(e) => setSickDays(e.target.value)}
              />
              <Input
                label="Paid Leave (Days/Yr)"
                type="number"
                value={paidDays}
                onChange={(e) => setPaidDays(e.target.value)}
              />
              <Input
                label="Max Carry-forward Days"
                type="number"
                value={carryForward}
                onChange={(e) => setCarryForward(e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-white/5 mt-2">
              <Button type="submit" variant="primary" className="font-semibold">
                Save Policy
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* PAYROLL SLABS */}
      {activeTab === 'payroll' && (
        <Card hover={false} className="border border-white/5">
          <form onSubmit={handleSavePayroll} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-accent-primary font-semibold text-sm">
              <Landmark className="h-4.5 w-4.5" /> Statutory Slabs & Payout days
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Provident Fund (PF) Rate (%)"
                type="number"
                value={pfRate}
                onChange={(e) => setPfRate(e.target.value)}
              />
              <Input
                label="ESI Rate (%)"
                type="number"
                value={esiRate}
                onChange={(e) => setEsiRate(e.target.value)}
              />
              <Select
                label="Pay Day of Month"
                options={Array.from({ length: 10 }).map((_, i) => ({ label: `Day ${i + 1}`, value: String(i + 1) }))}
                value={String(payDay)}
                onChange={(e) => setPayDay(e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-white/5 mt-2">
              <Button type="submit" variant="primary" className="font-semibold">
                Save Payroll Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* HOLIDAYS CALENDAR */}
      {activeTab === 'holidays' && (
        <div className="space-y-6">
          {/* Add Holiday Form */}
          <Card hover={false} className="border border-white/5 p-5">
            <form onSubmit={handleAddHoliday} className="flex flex-col sm:flex-row items-end gap-4">
              <Input
                label="Holiday Name"
                placeholder="e.g. Labor Day"
                value={newHolName}
                onChange={(e) => setNewHolName(e.target.value)}
              />
              <Input
                label="Holiday Date"
                type="date"
                value={newHolDate}
                onChange={(e) => setNewHolDate(e.target.value)}
              />
              <Select
                label="Holiday Category"
                options={[
                  { label: 'National Holiday', value: 'National' },
                  { label: 'Regional Holiday', value: 'Regional' },
                  { label: 'Optional Holiday', value: 'Optional' }
                ]}
                value={newHolType}
                onChange={(e) => setNewHolType(e.target.value)}
              />
              <Button
                type="submit"
                variant="primary"
                icon={Plus}
                className="font-semibold shrink-0"
              >
                Add Holiday
              </Button>
            </form>
          </Card>

          {/* Holidays list table */}
          <Card hover={false} className="border border-white/5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Yearly Holidays List</h3>
            <Table
              columns={[
                { header: 'Holiday Name', key: 'name' },
                { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString(undefined, { dateStyle: 'long' }) },
                { header: 'Category Type', render: (row) => <Badge variant="neutral">{row.type}</Badge> },
                {
                  header: 'Actions',
                  render: (row, idx) => (
                    <Button
                      onClick={() => handleDeleteHoliday(idx)}
                      variant="ghost"
                      size="sm"
                      className="text-state-danger hover:bg-state-danger/5"
                      icon={Trash2}
                    />
                  )
                }
              ]}
              data={holidays}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
