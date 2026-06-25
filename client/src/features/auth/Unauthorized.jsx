import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import Button from '../../components/ui/Button';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
      <div className="p-5 rounded-full bg-state-danger/10 border border-state-danger/20 text-state-danger mb-5 animate-pulse">
        <ShieldAlert className="h-16 w-16" />
      </div>
      <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-2">403 - Access Denied</h2>
      <p className="text-text-secondary text-sm max-w-md mb-8 leading-relaxed">
        You do not have the required permissions or access scope to view this section of the system.
        Please contact your system administrator if you think this is a mistake.
      </p>
      <Button
        variant="primary"
        onClick={() => navigate('/')}
        icon={Home}
        className="font-semibold"
      >
        Return to Dashboard
      </Button>
    </div>
  );
};

export default Unauthorized;
