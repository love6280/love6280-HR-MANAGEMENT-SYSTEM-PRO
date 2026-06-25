import React from 'react';

const Stepper = ({
  steps = [],
  currentStep = 1, // 1-indexed
  className = '',
}) => {
  return (
    <div className={`w-full flex items-center justify-between py-4 ${className}`}>
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <React.Fragment key={idx}>
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5 z-10 shrink-0">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300
                  ${isCompleted 
                    ? 'bg-state-success border-state-success text-white' 
                    : isActive 
                      ? 'border-accent-primary bg-background-start text-accent-primary shadow-[0_0_15px_rgba(79,158,255,0.3)]' 
                      : 'border-white/10 bg-background-end text-text-muted'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-accent-primary' : isCompleted ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                {step}
              </span>
            </div>

            {/* Connecting line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 bg-white/10 relative overflow-hidden -mt-5">
                <div
                  className="absolute left-0 top-0 h-full bg-state-success transition-all duration-300"
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
