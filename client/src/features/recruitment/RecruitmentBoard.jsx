import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetJobsQuery,
  useGetCandidatesQuery,
  useUpdateCandidateStageMutation,
  useGetInterviewsQuery,
  useScheduleInterviewMutation,
  useSubmitInterviewFeedbackMutation,
  useGetEmployeesQuery
} from '../../services/api';
import { Briefcase, UserCheck, CalendarRange, Plus, HelpCircle, Star, PlusSquare, MapPin, ExternalLink, CalendarDays } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Tabs from '../../components/ui/Tabs';
import Rating from '../../components/ui/Rating';
import Avatar from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

const RecruitmentBoard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [isSchedOpen, setIsSchedOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Form states for scheduler
  const [candidateId, setCandidateId] = useState('');
  const [jobId, setJobId] = useState('');
  const [intDate, setIntDate] = useState('');
  const [intTime, setIntTime] = useState('');
  const [intType, setIntType] = useState('Video');
  const [interviewerId, setInterviewerId] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  // Form states for feedback
  const [interviewId, setInterviewId] = useState('');
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [rec, setRec] = useState('Proceed');

  const { data: jobsResult, refetch: refetchJobs } = useGetJobsQuery();
  const { data: candidatesResult, refetch: refetchCandidates } = useGetCandidatesQuery();
  const { data: interviewsResult, refetch: refetchInterviews } = useGetInterviewsQuery();
  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });

  const [updateStage] = useUpdateCandidateStageMutation();
  const [scheduleInterviewApi, { isLoading: schedLoading }] = useScheduleInterviewMutation();
  const [submitFeedbackApi, { isLoading: feedLoading }] = useSubmitInterviewFeedbackMutation();

  const tabItems = [
    { id: 'jobs', label: 'Job Board', icon: Briefcase },
    { id: 'candidates', label: 'Candidates Pipeline', icon: UserCheck },
    { id: 'interviews', label: 'Interviews', icon: CalendarRange }
  ];

  // Drag and Drop implementation for Candidate Stages
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    const cId = e.dataTransfer.getData('text');
    if (!cId) return;

    try {
      await updateStage({ id: cId, stage: targetStage }).unwrap();
      toast.success(`Candidate advanced to ${targetStage}!`);
      refetchCandidates();
    } catch (err) {
      toast.error('Failed to update stage.');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!candidateId || !jobId || !intDate || !intTime) {
      return toast.error('Please input required scheduling fields.');
    }

    try {
      await scheduleInterviewApi({
        candidateId,
        jobId,
        date: intDate,
        time: intTime,
        type: intType,
        interviewers: interviewerId ? [interviewerId] : [],
        meetingLink
      }).unwrap();

      toast.success('Interview scheduled, invitation email sent!');
      setIsSchedOpen(false);
      refetchInterviews();
      refetchCandidates();
    } catch (err) {
      toast.error('Failed to schedule interview.');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!comment) return toast.error('Please input interviewer comments.');

    try {
      await submitFeedbackApi({
        id: interviewId,
        rating,
        comments: comment,
        recommendation: rec,
      }).unwrap();

      toast.success('Interview feedback submitted successfully!');
      setIsFeedbackOpen(false);
      refetchInterviews();
    } catch (err) {
      toast.error('Failed to submit feedback.');
    }
  };

  const triggerOpenFeedback = (id) => {
    setInterviewId(id);
    setRating(3);
    setComment('');
    setRec('Proceed');
    setIsFeedbackOpen(true);
  };

  const triggerOpenSchedule = (candidate) => {
    setCandidateId(candidate._id);
    setJobId(candidate.job?._id || '');
    setIntDate('');
    setIntTime('');
    setIntType('Video');
    setInterviewerId('');
    setMeetingLink('https://meet.google.com/abc-defg-hij');
    setIsSchedOpen(true);
  };

  // Stage columns definitions
  const PIPELINE_STAGES = [
    { id: 'Applied', title: 'Applied', color: 'bg-white/5 text-text-secondary' },
    { id: 'Shortlisted', title: 'Shortlisted', color: 'bg-accent-primary/10 text-accent-primary' },
    { id: 'Interview', title: 'Interview', color: 'bg-accent-secondary/10 text-accent-secondary' },
    { id: 'Technical', title: 'Technical Round', color: 'bg-state-warning/10 text-state-warning' },
    { id: 'HR', title: 'HR Round', color: 'bg-state-warning/10 text-state-warning' },
    { id: 'Offered', title: 'Offered', color: 'bg-accent-primary/20 text-accent-primary' },
    { id: 'Joined', title: 'Joined', color: 'bg-state-success/15 text-state-success' },
    { id: 'Rejected', title: 'Rejected', color: 'bg-state-danger/15 text-state-danger' }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Recruitment Dashboard</h1>
          <p className="text-sm text-text-secondary">Publish job openings, track candidate progression boards, and coordinate interviews</p>
        </div>
        {activeTab === 'jobs' && (
          <Button
            onClick={() => navigate('/recruitment/jobs/add')}
            variant="primary"
            icon={Plus}
            className="font-semibold"
          >
            Create Job Post
          </Button>
        )}
      </div>

      <Tabs items={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* JOB BOARD PANEL */}
      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobsResult?.data && jobsResult.data.map((job) => (
            <Card
              key={job._id}
              hover={true}
              className="flex flex-col justify-between border border-white/5 p-6 h-52 relative"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant={job.status === 'Published' ? 'success' : job.status === 'Draft' ? 'warning' : 'neutral'}>
                    {job.status}
                  </Badge>
                  <span className="text-[10px] text-text-muted font-mono">{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-text-primary text-base mt-2.5 truncate">{job.title}</h3>
                <span className="text-xs text-accent-primary font-medium">{job.department?.name || 'Engineering'}</span>
                
                <div className="flex items-center gap-1.5 text-[10px] text-text-secondary mt-3">
                  <MapPin className="h-3.5 w-3.5 text-text-muted" />
                  <span>{job.location} | {job.type}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-3">
                <span className="text-xs font-medium text-text-secondary">
                  <span className="font-bold text-text-primary font-mono">{job.applicationsCount || 0}</span> Applications
                </span>
                
                <Button
                  onClick={() => {
                    setActiveTab('candidates');
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  icon={ArrowRight}
                >
                  View Pipeline
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CANDIDATES PIPELINE PANEL */}
      {activeTab === 'candidates' && (
        <div className="flex gap-4 overflow-x-auto pb-4 select-none min-h-[500px] scrollbar-thin">
          {PIPELINE_STAGES.map((stage) => {
            const list = candidatesResult?.data.filter(c => c.stage === stage.id) || [];
            
            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="w-72 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col shrink-0 min-h-[450px]"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                  <span className="text-xs font-bold text-text-primary">{stage.title}</span>
                  <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded text-text-secondary">
                    {list.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-2.5 flex flex-col gap-2.5 overflow-y-auto flex-1 scrollbar-none">
                  {list.map((cand) => (
                    <div
                      key={cand._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, cand._id)}
                      className="p-3.5 glass-card border border-white/10 hover:border-accent-primary/40 cursor-grab active:cursor-grabbing flex flex-col gap-2.5 text-xs text-left transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{cand.fullName}</span>
                        <span className="text-[10px] text-text-secondary truncate mt-0.5">{cand.job?.title}</span>
                      </div>

                      <div className="text-[10px] text-text-muted flex flex-col gap-0.5 border-t border-white/5 pt-2">
                        <span>{cand.email}</span>
                        <span>{cand.phone}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
                        <a
                          href={cand.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-accent-primary hover:underline flex items-center gap-0.5"
                        >
                          Resume <ExternalLink className="h-3 w-3" />
                        </a>
                        
                        {cand.stage !== 'Offered' && cand.stage !== 'Joined' && cand.stage !== 'Rejected' && (
                          <button
                            onClick={() => triggerOpenSchedule(cand)}
                            className="text-[10px] text-accent-secondary hover:underline font-semibold"
                          >
                            Schedule
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-[10px] text-text-muted py-10">
                      Drag here to move
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INTERVIEWS SCHEDULE PANEL */}
      {activeTab === 'interviews' && (
        <Card hover={false} className="border border-white/5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Scheduled Interview Calendar</h3>
          <Table
            columns={[
              { header: 'Candidate', render: (row) => <span className="font-semibold">{row.candidate?.firstName} {row.candidate?.lastName}</span> },
              { header: 'Job Applied', render: (row) => <span>{row.job?.title}</span> },
              { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
              { header: 'Time', render: (row) => <span className="font-mono text-xs">{row.time}</span> },
              { header: 'Format', key: 'type' },
              {
                header: 'Feedback / Recommendation',
                render: (row) => {
                  if (row.feedback?.rating) {
                    return (
                      <div className="flex flex-col gap-1 text-[11px]">
                        <span className="font-semibold text-text-primary">Rec: {row.feedback.recommendation}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-state-warning text-state-warning" />
                          <span className="font-semibold">{row.feedback.rating} / 5</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <Button
                      onClick={() => triggerOpenFeedback(row._id)}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-accent-secondary font-semibold"
                      icon={PlusSquare}
                    >
                      Add Feedback
                    </Button>
                  );
                }
              }
            ]}
            data={interviewsResult?.data || []}
          />
        </Card>
      )}

      {/* Schedule Interview Modal */}
      <Modal isOpen={isSchedOpen} onClose={() => setIsSchedOpen(false)} title="Schedule Candidate Interview">
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Interview Date *"
              type="date"
              value={intDate}
              onChange={(e) => setIntDate(e.target.value)}
              required
            />
            <Input
              label="Interview Time *"
              type="time"
              value={intTime}
              onChange={(e) => setIntTime(e.target.value)}
              required
            />
          </div>

          <Select
            label="Format Type"
            options={[
              { label: 'Video Call (Online)', value: 'Video' },
              { label: 'Phone Call (Voice)', value: 'Phone' },
              { label: 'In-person Office Visit', value: 'In-person' }
            ]}
            value={intType}
            onChange={(e) => setIntType(e.target.value)}
          />

          <Select
            label="Select Lead Interviewer"
            options={[
              { label: 'Select Interviewer', value: '' },
              ...(employeesData?.data || []).map(e => ({ label: e.fullName, value: e._id }))
            ]}
            value={interviewerId}
            onChange={(e) => setInterviewerId(e.target.value)}
          />

          <Input
            label="Meeting / Online Link"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
          />

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsSchedOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={schedLoading} variant="primary" className="font-semibold">
              Schedule & Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Submit Feedback Modal */}
      <Modal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} title="Submit Interview Feedback">
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Interviewer Rating *</label>
            <Rating value={rating} onChange={setRating} />
          </div>

          <Select
            label="Recommendation"
            options={[
              { label: 'Proceed (Advance to next stage)', value: 'Proceed' },
              { label: 'Hold (Keep in pipeline)', value: 'Hold' },
              { label: 'Reject (Release candidate)', value: 'Reject' }
            ]}
            value={rec}
            onChange={(e) => setRec(e.target.value)}
          />

          <Input
            label="Comments / Evaluation details *"
            placeholder="Type your evaluation remarks..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsFeedbackOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={feedLoading} variant="primary" className="font-semibold">
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const ArrowRight = (props) => (
  <svg {...props} className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default RecruitmentBoard;
