import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useCommentAnnouncementMutation,
  useReactAnnouncementMutation
} from '../../services/api';
import { Megaphone, Pin, MessageSquare, Plus, Send, Heart, ThumbsUp, PartyPopper } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import RichTextEditor from '../../components/ui/RichTextEditor';
import Avatar from '../../components/ui/Avatar';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';

const AnnouncementsPage = () => {
  const user = useSelector(selectCurrentUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('News');
  const [priority, setPriority] = useState('Normal');
  const [isPinned, setIsPinned] = useState(false);
  
  const [commentTextMap, setCommentTextMap] = useState({});

  const { data: announcementsData, isLoading, refetch } = useGetAnnouncementsQuery();
  const [createAnnouncementApi, { isLoading: createLoading }] = useCreateAnnouncementMutation();
  const [commentAnnouncement] = useCommentAnnouncementMutation();
  const [reactAnnouncement] = useReactAnnouncementMutation();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !content || content === '<p><br></p>') {
      return toast.error('Please fill required fields');
    }

    try {
      await createAnnouncementApi({
        title,
        content,
        category,
        priority,
        isPinned,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry default
      }).unwrap();

      toast.success('Announcement published successfully!');
      setIsModalOpen(false);
      refetch();
      setTitle('');
      setContent('');
    } catch (err) {
      toast.error('Failed to publish announcement.');
    }
  };

  const handleAddComment = async (annId) => {
    const text = commentTextMap[annId];
    if (!text) return;

    try {
      await commentAnnouncement({ id: annId, text }).unwrap();
      setCommentTextMap({ ...commentTextMap, [annId]: '' });
      refetch();
    } catch (err) {
      toast.error('Failed to post comment.');
    }
  };

  const handleReact = async (annId, type) => {
    try {
      await reactAnnouncement({ id: annId, type }).unwrap();
      refetch();
    } catch (err) {
      toast.error('Failed to react.');
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="list" />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Announcements</h1>
          <p className="text-sm text-text-secondary font-medium">Internal newsletters, circular notices, and holiday statements</p>
        </div>
        {user?.role !== 'Employee' && (
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            icon={Plus}
            className="font-semibold"
          >
            New Notice
          </Button>
        )}
      </div>

      {/* Feed list */}
      <div className="flex flex-col gap-6">
        {announcementsData?.data && announcementsData.data.map((ann) => {
          const reactions = ann.reactions || [];
          const likeCount = reactions.filter(r => r.type === 'like').length;
          const loveCount = reactions.filter(r => r.type === 'love').length;
          const celebrateCount = reactions.filter(r => r.type === 'celebrate').length;

          const activeEmpId = user?.employee?._id?.toString();
          const userReaction = reactions.find(r => r.employee?.toString() === activeEmpId)?.type;

          return (
            <Card key={ann._id} hover={false} className="border border-white/5 p-6 flex flex-col gap-4 relative bg-white/[0.01]">
              {/* Pin badge indicator */}
              {ann.isPinned && (
                <div className="absolute top-4 right-4 text-accent-primary animate-pulse" title="Pinned Announcement">
                  <Pin className="h-4 w-4 fill-accent-primary" />
                </div>
              )}

              {/* Title & Metadata */}
              <div className="flex flex-col gap-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={ann.priority === 'Urgent' ? 'danger' : ann.priority === 'Important' ? 'warning' : 'neutral'}>
                    {ann.category}
                  </Badge>
                  <span className="text-[10px] text-text-muted font-mono">{new Date(ann.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                </div>
                <h2 className="text-lg font-bold text-text-primary mt-1.5 leading-snug">{ann.title}</h2>
              </div>

              {/* HTML Rich text Content */}
              <div
                className="text-sm text-text-secondary leading-relaxed text-left border-b border-white/5 pb-4"
                dangerouslySetInnerHTML={{ __html: ann.content }}
              />

              {/* Reactions & Comments count footer */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-3">
                  {/* Reactions actions */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleReact(ann._id, 'like')}
                      className={`flex items-center gap-1.5 p-1 rounded hover:bg-white/5 transition-colors ${userReaction === 'like' ? 'text-accent-primary font-semibold' : 'text-text-secondary'}`}
                    >
                      <ThumbsUp className="h-4 w-4" /> <span>{likeCount}</span>
                    </button>
                    <button
                      onClick={() => handleReact(ann._id, 'love')}
                      className={`flex items-center gap-1.5 p-1 rounded hover:bg-white/5 transition-colors ${userReaction === 'love' ? 'text-state-danger font-semibold' : 'text-text-secondary'}`}
                    >
                      <Heart className="h-4 w-4" /> <span>{loveCount}</span>
                    </button>
                    <button
                      onClick={() => handleReact(ann._id, 'celebrate')}
                      className={`flex items-center gap-1.5 p-1 rounded hover:bg-white/5 transition-colors ${userReaction === 'celebrate' ? 'text-state-warning font-semibold' : 'text-text-secondary'}`}
                    >
                      <PartyPopper className="h-4 w-4" /> <span>{celebrateCount}</span>
                    </button>
                  </div>

                  <span className="text-text-muted flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" /> {ann.comments?.length || 0} comments
                  </span>
                </div>

                {/* Comment thread list */}
                <div className="space-y-3 max-h-40 overflow-y-auto pr-1 text-xs text-left scrollbar-none">
                  {ann.comments && ann.comments.map((c, cIdx) => (
                    <div key={cIdx} className="flex gap-2.5 items-start">
                      <Avatar src={c.employee?.personalInfo?.photo} name={`${c.employee?.personalInfo?.firstName} ${c.employee?.personalInfo?.lastName}`} size="sm" className="h-7 w-7 border-white/5" />
                      <div className="flex-1 p-2 rounded-lg bg-white/5 flex flex-col gap-0.5 border border-white/5">
                        <div className="flex justify-between items-center text-[10px] text-text-secondary">
                          <span className="font-semibold text-text-primary">{c.employee?.personalInfo?.firstName} {c.employee?.personalInfo?.lastName}</span>
                          <span className="font-mono text-text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-text-secondary mt-0.5 leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Post a comment */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Type comments..."
                    value={commentTextMap[ann._id] || ''}
                    onChange={(e) => setCommentTextMap({ ...commentTextMap, [ann._id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment(ann._id);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg input-glass text-xs glow-border"
                  />
                  <Button
                    onClick={() => handleAddComment(ann._id)}
                    variant="primary"
                    size="sm"
                    icon={Send}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Publish Notice Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg" title="Publish Notice Announcement">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Notice Title *"
            placeholder="e.g. FY 2026 Appraisal Closing Guidelines"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Category"
              options={[
                { label: 'News / Press', value: 'News' },
                { label: 'Corporate Event', value: 'Event' },
                { label: 'Holiday Announcement', value: 'Holiday' },
                { label: 'Company Policy Update', value: 'Policy' },
                { label: 'General Circular', value: 'Circular' }
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Select
              label="Urgency Priority"
              options={[
                { label: 'Normal Urgency', value: 'Normal' },
                { label: 'Important Notice', value: 'Important' },
                { label: 'Urgent Action Required', value: 'Urgent' }
              ]}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
            <div className="flex flex-col gap-1.5 justify-end pb-3 pl-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded bg-white/5 border-white/10 text-accent-primary h-4 w-4"
                />
                <span>Pin to top</span>
              </label>
            </div>
          </div>

          <RichTextEditor
            label="Detailed Announcement Content *"
            value={content}
            onChange={setContent}
          />

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createLoading} variant="primary" className="font-semibold">
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AnnouncementsPage;
