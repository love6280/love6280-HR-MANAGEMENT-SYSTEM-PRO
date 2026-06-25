import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetOrgChartQuery } from '../../services/api';
import { ArrowLeft, User } from 'lucide-react';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

// Recursive Tree Node Renderer
const TreeNode = ({ node }) => {
  const navigate = useNavigate();
  if (!node) return null;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        onClick={() => navigate(`/employees/${node.id}`)}
        className="glass-card border border-white/10 hover:border-accent-primary/50 transition-all duration-300 p-3.5 flex items-center gap-3 w-52 cursor-pointer shadow-glass active:scale-95 z-10"
      >
        <Avatar src={node.photo} name={node.name} size="sm" />
        <div className="flex flex-col text-left truncate">
          <span className="text-xs font-semibold text-text-primary truncate">{node.name}</span>
          <span className="text-[10px] text-text-secondary truncate mt-0.5">{node.title}</span>
        </div>
      </div>

      {/* Children connected by lines */}
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center w-full mt-4">
          {/* Vertical line from node down to horizontal line connector */}
          <div className="w-0.5 h-6 bg-white/15" />
          
          {/* Horizontal line connector connecting all children nodes */}
          <div className="flex justify-center w-full relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/15" style={{ left: `${100 / (node.children.length * 2)}%`, right: `${100 / (node.children.length * 2)}%` }} />
            
            {/* Render each child */}
            <div className="flex gap-8 pt-6 relative">
              {node.children.map((child, i) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Vertical connector line above child card */}
                  <div className="absolute -top-6 w-0.5 h-6 bg-white/15" />
                  <TreeNode node={child} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OrgChartView = () => {
  const navigate = useNavigate();
  const { data: chartData, isLoading } = useGetOrgChartQuery();

  if (isLoading) {
    return <LoadingSkeleton type="list" />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/departments')}
          className="p-1.5 hover:bg-white/5 text-text-secondary hover:text-text-primary rounded-lg transition-colors border border-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Organization Structure</h1>
          <p className="text-sm text-text-secondary">Reporting lines, management hierarchy, and staff trees</p>
        </div>
      </div>

      {/* Org Tree wrapper */}
      <Card hover={false} className="border border-white/5 p-10 overflow-x-auto flex justify-center min-h-[500px]">
        {chartData?.data ? (
          <div className="w-fit">
            <TreeNode node={chartData.data} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-text-muted text-sm gap-2">
            <User className="h-10 w-10 text-accent-primary" />
            <span>No employee records available to draw organizational chart</span>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrgChartView;
