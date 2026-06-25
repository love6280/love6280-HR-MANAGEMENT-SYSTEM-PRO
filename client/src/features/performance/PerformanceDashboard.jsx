import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import {
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalProgressMutation,
  useGetReviewsQuery,
  useCreateReviewCycleMutation,
  useSubmitReviewMutation,
  useAcknowledgeReviewMutation,
  useGetEmployeesQuery
} from '../../services/api';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Target, Award, Star, RefreshCw, Plus, ShieldCheck, ClipboardList, PenTool } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Rating from '../../components/ui/Rating';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Tabs from '../../components/ui/Tabs';
import toast from 'react-hot-toast';

const PerformanceDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState('goals');

  // Goals Form states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalCat, setGoalCat] = useState('Individual');
  const [goalDate, setGoalDate] = useState('');
  const [updateGoalId, setUpdateGoalId] = useState('');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  // Review states
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [cycleName, setCycleName] = useState('Q3 2026');
  const [cycleEmp, setCycleEmp] = useState('');
  const [cycleStart, setCycleStart] = useState('');
  const [cycleEnd, setCycleEnd] = useState('');

  // Submit Review Form states
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [activeReviewId, setActiveReviewId] = useState('');
  const [isManagerReview, setIsManagerReview] = useState(false);
  
  // Review form parameters
  const [ratingComm, setRatingComm] = useState(3);
  const [ratingTech, setRatingTech] = useState(3);
  const [ratingTeam, setRatingTeam] = useState(3);
  const [ratingPunc, setRatingPunc] = useState(3);
  const [ratingInit, setRatingInit] = useState(3);
  const [ratingLead, setRatingLead] = useState(3);

  const [selfAch, setSelfAch] = useState('');
  const [selfChal, setSelfChal] = useState('');
  const [selfLearn, setSelfLearn] = useState('');
  
  const [mgrComm, setMgrComm] = useState('');
  const [devPlan, setDevPlan] = useState('');

  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });
  const { data: goalsData, refetch: refetchGoals } = useGetGoalsQuery();
  const { data: reviewsData, refetch: refetchReviews } = useGetReviewsQuery();

  const [createGoalApi, { isLoading: goalLoading }] = useCreateGoalMutation();
  const [updateGoalProgressApi, { isLoading: progressLoading }] = useUpdateGoalProgressMutation();
  const [createCycleApi, { isLoading: cycleLoading }] = useCreateReviewCycleMutation();
  const [submitReviewApi, { isLoading: reviewLoading }] = useSubmitReviewMutation();
  const [acknowledgeApi] = useAcknowledgeReviewMutation();

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle || !goalDate) return toast.error('Please input required fields');

    try {
      await createGoalApi({
        title: goalTitle,
        description: goalDesc,
        category: goalCat,
        targetDate: goalDate,
      }).unwrap();

      toast.success('Goal targets saved successfully!');
      setIsGoalModalOpen(false);
      refetchGoals();
      setGoalTitle('');
      setGoalDesc('');
    } catch (err) {
      toast.error('Failed to create goal.');
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    try {
      await updateGoalProgressApi({
        id: updateGoalId,
        progress: parseInt(updateProgress),
        notes: `Progress advanced to ${updateProgress}%`
      }).unwrap();

      toast.success('Goal progress updated!');
      setIsProgressModalOpen(false);
      refetchGoals();
    } catch (err) {
      toast.error('Failed to update goal progress.');
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    if (!cycleName || !cycleEmp || !cycleStart || !cycleEnd) {
      return toast.error('Please fill required cycle settings');
    }

    try {
      await createCycleApi({
        reviewCycle: cycleName,
        employeeId: cycleEmp,
        periodStart: cycleStart,
        periodEnd: cycleEnd,
      }).unwrap();

      toast.success('Review cycle launched for employee!');
      setIsCycleModalOpen(false);
      refetchReviews();
    } catch (err) {
      toast.error('Failed to launch cycle.');
    }
  };

  const handleOpenReviewForm = (review, managerMode = false) => {
    setActiveReviewId(review._id);
    setIsManagerReview(managerMode);
    
    setRatingComm(review.ratings?.communication || 3);
    setRatingTech(review.ratings?.technical || 3);
    setRatingTeam(review.ratings?.teamwork || 3);
    setRatingPunc(review.ratings?.punctuality || 3);
    setRatingInit(review.ratings?.initiative || 3);
    setRatingLead(review.ratings?.leadership || 3);

    setSelfAch(review.selfAssessment?.achievements || '');
    setSelfChal(review.selfAssessment?.challenges || '');
    setSelfLearn(review.selfAssessment?.learning || '');

    setMgrComm(review.managerComments || '');
    setDevPlan(review.developmentPlan || '');

    setIsReviewFormOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await submitReviewApi({
        id: activeReviewId,
        isManagerSubmit: isManagerReview,
        ratings: isManagerReview ? {
          communication: ratingComm,
          technical: ratingTech,
          teamwork: ratingTeam,
          punctuality: ratingPunc,
          initiative: ratingInit,
          leadership: ratingLead
        } : undefined,
        selfAssessment: !isManagerReview ? {
          achievements: selfAch,
          challenges: selfChal,
          learning: selfLearn
        } : undefined,
        managerComments: isManagerReview ? mgrComm : undefined,
        developmentPlan: isManagerReview ? devPlan : undefined
      }).unwrap();

      toast.success('Performance evaluation submitted!');
      setIsReviewFormOpen(false);
      refetchReviews();
    } catch (err) {
      toast.error('Failed to submit evaluation.');
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeApi({ id }).unwrap();
      toast.success('Review acknowledged & completed!');
      refetchReviews();
    } catch (err) {
      toast.error('Failed to acknowledge review.');
    }
  };

  // Build Radar Data comparing self vs manager ratings (using the first completed review as sample data)
  const completedReview = reviewsData?.data?.find(r => 
    (r.status === 'Completed' || r.status === 'ReviewedByManager') && 
    (r.employee?._id === user?.employee?._id || r.employee === user?.employee?._id)
  );
  
  const radarData = completedReview ? [
    { subject: 'Communication', Score: completedReview.ratings?.communication || 3, fullMark: 5 },
    { subject: 'Technical Skills', Score: completedReview.ratings?.technical || 3, fullMark: 5 },
    { subject: 'Teamwork', Score: completedReview.ratings?.teamwork || 3, fullMark: 5 },
    { subject: 'Punctuality', Score: completedReview.ratings?.punctuality || 3, fullMark: 5 },
    { subject: 'Initiative', Score: completedReview.ratings?.initiative || 3, fullMark: 5 },
    { subject: 'Leadership', Score: completedReview.ratings?.leadership || 3, fullMark: 5 },
  ] : [
    { subject: 'Communication', Score: 4, fullMark: 5 },
    { subject: 'Technical Skills', Score: 3, fullMark: 5 },
    { subject: 'Teamwork', Score: 5, fullMark: 5 },
    { subject: 'Punctuality', Score: 4, fullMark: 5 },
    { subject: 'Initiative', Score: 4, fullMark: 5 },
    { subject: 'Leadership', Score: 3, fullMark: 5 },
  ];

  const tabItems = [
    { id: 'goals', label: 'My Targets', icon: Target },
    { id: 'reviews', label: 'Cycle Reviews', icon: ClipboardList }
  ];

  const formatDateStr = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const employeeOptions = [
    { label: 'Select Employee', value: '' },
    ...(employeesData?.data || []).map(e => ({ label: e.fullName, value: e._id }))
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Performance Folder</h1>
          <p className="text-sm text-text-secondary">Set objectives, compile self-assessments, and review scores</p>
        </div>
        <div className="flex gap-2">
          {user?.role !== 'Employee' && (
            <Button
              onClick={() => setIsCycleModalOpen(true)}
              variant="secondary"
              icon={PenTool}
            >
              Launch Cycle
            </Button>
          )}
          <Button
            onClick={() => setIsGoalModalOpen(true)}
            variant="primary"
            icon={Plus}
            className="font-semibold"
          >
            Add Objective
          </Button>
        </div>
      </div>

      <Tabs items={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* MY TARGETS PANEL */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goals board list */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-text-primary">My OKR Goals</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goalsData?.data && goalsData.data.map((goal) => (
                <Card
                  key={goal._id}
                  hover={true}
                  className="border border-white/5 p-5 flex flex-col justify-between h-44 relative"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant={goal.status === 'Completed' ? 'success' : goal.status === 'In Progress' ? 'warning' : 'neutral'}>
                        {goal.status}
                      </Badge>
                      <span className="text-[10px] text-text-muted font-mono">By {formatDateStr(goal.targetDate)}</span>
                    </div>
                    <h4 className="font-bold text-text-primary text-sm mt-3 truncate">{goal.title}</h4>
                    <p className="text-[11px] text-text-secondary line-clamp-2 mt-1 leading-relaxed">{goal.description}</p>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto border-t border-white/5 pt-3">
                    <ProgressBar value={goal.progress} max={100} color="blue" />
                    <button
                      onClick={() => {
                        setUpdateGoalId(goal._id);
                        setUpdateProgress(goal.progress);
                        setIsProgressModalOpen(true);
                      }}
                      className="text-[10px] text-accent-primary hover:underline font-semibold self-end"
                    >
                      Update Progress
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Radar chart review comparison */}
          <Card hover={false} className="border border-white/5 p-6 h-[340px] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Performance Parameters</h3>
              <p className="text-[10px] text-text-secondary">Core assessment values split</p>
            </div>
            <div className="flex-1 w-full text-xs mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#475569" />
                  <Radar name={completedReview?.reviewCycle || 'Performance'} dataKey="Score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* REVIEWS PANEL */}
      {activeTab === 'reviews' && (
        <Card hover={false} className="border border-white/5 flex flex-col gap-4 animate-fade-in">
          <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Active Cycle Reviews</h3>
          <Table
            columns={[
              { header: 'Cycle Name', key: 'reviewCycle' },
              { header: 'Staff Name', render: (row) => <span className="font-semibold">{row.employee?.fullName}</span> },
              { header: 'Period Range', render: (row) => `${formatDateStr(row.period?.start)} to ${formatDateStr(row.period?.end)}` },
              { header: 'Overall rating', render: (row) => <span className="font-mono text-state-warning">{row.overallRating || 'N/A'}</span> },
              { header: 'Status', render: (row) => <Badge variant={row.status === 'Completed' ? 'success' : 'warning'}>{row.status}</Badge> },
              {
                header: 'Actions',
                render: (row) => {
                  const isReviewer = user?.employee?._id === row.reviewer?._id;
                  const isHROrAdmin = user?.role === 'SuperAdmin' || user?.role === 'HRManager';
                  const canEvaluate = isReviewer || isHROrAdmin;
                  const isEmployee = user?.employee?._id === row.employee?._id || user?.employee === row.employee?._id;
                  
                  if (row.status === 'Draft' && isEmployee) {
                    return (
                      <Button
                        onClick={() => handleOpenReviewForm(row, false)}
                        variant="primary"
                        size="sm"
                        icon={PenTool}
                      >
                        Self Assessment
                      </Button>
                    );
                  }

                  if (row.status === 'SubmittedByEmployee' && canEvaluate) {
                    return (
                      <Button
                        onClick={() => handleOpenReviewForm(row, true)}
                        variant="primary"
                        size="sm"
                        icon={Star}
                      >
                        Evaluate
                      </Button>
                    );
                  }

                  if (row.status === 'ReviewedByManager' && isEmployee) {
                    return (
                      <Button
                        onClick={() => handleAcknowledge(row._id)}
                        variant="primary"
                        size="sm"
                        icon={ShieldCheck}
                      >
                        Acknowledge
                      </Button>
                    );
                  }

                  return <span className="text-text-muted text-xs">Evaluated</span>;
                }
              }
            ]}
            data={reviewsData?.data || []}
          />
        </Card>
      )}

      {/* Create Cycle Modal */}
      <Modal isOpen={isCycleModalOpen} onClose={() => setIsCycleModalOpen(false)} title="Launch Assessment Cycle">
        <form onSubmit={handleCreateCycle} className="space-y-4">
          <Input
            label="Cycle Name *"
            value={cycleName}
            onChange={(e) => setCycleName(e.target.value)}
            required
          />

          <Select
            label="Select Employee *"
            options={employeeOptions}
            value={cycleEmp}
            onChange={(e) => setCycleEmp(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Evaluation Start Date *"
              type="date"
              value={cycleStart}
              onChange={(e) => setCycleStart(e.target.value)}
              required
            />
            <Input
              label="Evaluation End Date *"
              type="date"
              value={cycleEnd}
              onChange={(e) => setCycleEnd(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCycleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={cycleLoading} variant="primary" className="font-semibold">
              Launch Cycle
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add OKR Goal Objective Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Set Objective Goal">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Objective Title *"
            placeholder="e.g. Implement Socket.io alerts pipeline"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            required
          />

          <Input
            label="Objective Description"
            placeholder="Outline criteria for objective completion"
            value={goalDesc}
            onChange={(e) => setGoalDesc(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="OKR Category"
              options={[
                { label: 'Individual Goal', value: 'Individual' },
                { label: 'Team Goal', value: 'Team' },
                { label: 'Company Level Goal', value: 'Company' }
              ]}
              value={goalCat}
              onChange={(e) => setGoalCat(e.target.value)}
            />
            <Input
              label="Target Completion Date *"
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={goalLoading} variant="primary" className="font-semibold">
              Save Objective
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Progress Modal */}
      <Modal isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} title="Update Objective Progress">
        <form onSubmit={handleUpdateProgress} className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
              <span>Goal Completion Progress:</span>
              <span className="font-mono text-accent-primary">{updateProgress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={updateProgress}
              onChange={(e) => setUpdateProgress(e.target.value)}
              className="w-full accent-accent-primary bg-white/10 rounded-lg cursor-pointer h-2"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsProgressModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={progressLoading} variant="primary" className="font-semibold">
              Save Progress
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Submission Form Modal */}
      <Modal isOpen={isReviewFormOpen} onClose={() => setIsReviewFormOpen(false)} size="lg" title={isManagerReview ? 'Submit Manager Evaluation' : 'Submit Self Assessment'}>
        <form onSubmit={handleSubmitReview} className="space-y-5">
          {/* Self Assessment Fields (Enabled only for employee) */}
          {!isManagerReview ? (
            <div className="space-y-4">
              <Input
                label="What are your key accomplishments this cycle? *"
                value={selfAch}
                onChange={(e) => setSelfAch(e.target.value)}
                required
              />
              <Input
                label="What obstacles did you face? *"
                value={selfChal}
                onChange={(e) => setSelfChal(e.target.value)}
                required
              />
              <Input
                label="Key learnings / development areas *"
                value={selfLearn}
                onChange={(e) => setSelfLearn(e.target.value)}
                required
              />
            </div>
          ) : (
            // Manager Review Rating Sliders & Comments
            <div className="space-y-5">
              <h4 className="text-xs font-semibold border-b border-white/5 pb-1 text-accent-primary">Ratings (1 - 5 stars)</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between border border-white/5 p-2 rounded-lg bg-white/[0.01]">
                  <span className="text-xs font-semibold text-text-secondary">Communication</span>
                  <Rating value={ratingComm} onChange={setRatingComm} />
                </div>
                <div className="flex items-center justify-between border border-white/5 p-2 rounded-lg bg-white/[0.01]">
                  <span className="text-xs font-semibold text-text-secondary">Technical Skills</span>
                  <Rating value={ratingTech} onChange={setRatingTech} />
                </div>
                <div className="flex items-center justify-between border border-white/5 p-2 rounded-lg bg-white/[0.01]">
                  <span className="text-xs font-semibold text-text-secondary">Teamwork</span>
                  <Rating value={ratingTeam} onChange={setRatingTeam} />
                </div>
                <div className="flex items-center justify-between border border-white/5 p-2 rounded-lg bg-white/[0.01]">
                  <span className="text-xs font-semibold text-text-secondary">Punctuality</span>
                  <Rating value={ratingPunc} onChange={setRatingPunc} />
                </div>
                <div className="flex items-center justify-between border border-white/5 p-2 rounded-lg bg-white/[0.01]">
                  <span className="text-xs font-semibold text-text-secondary">Initiative</span>
                  <Rating value={ratingInit} onChange={setRatingInit} />
                </div>
                <div className="flex items-center justify-between border border-white/5 p-2 rounded-lg bg-white/[0.01]">
                  <span className="text-xs font-semibold text-text-secondary">Leadership</span>
                  <Rating value={ratingLead} onChange={setRatingLead} />
                </div>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-4">
                <Input
                  label="Manager Evaluation Remarks *"
                  value={mgrComm}
                  onChange={(e) => setMgrComm(e.target.value)}
                  required
                />
                <Input
                  label="Development / Training Plan *"
                  value={devPlan}
                  onChange={(e) => setDevPlan(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsReviewFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={reviewLoading} variant="primary" className="font-semibold">
              Submit Assessment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PerformanceDashboard;
