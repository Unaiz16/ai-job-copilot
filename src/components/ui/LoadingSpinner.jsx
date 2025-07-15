import React from 'react';
import { Brain, Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', message, aiMode = false }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  if (aiMode) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Brain className={`${sizeClasses[size]} text-primary ai-pulse`} />
          <div className="absolute inset-0 animate-spin">
            <div className="h-full w-full border-2 border-transparent border-t-primary rounded-full"></div>
          </div>
        </div>
        {message && (
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {message && (
        <p className="text-sm text-muted-foreground text-center">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;

