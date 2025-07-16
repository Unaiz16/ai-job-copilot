import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative" {...props}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          value, 
          onValueChange, 
          isOpen, 
          setIsOpen 
        })
      )}
    </div>
  );
};

export const SelectTrigger = ({ children, value, isOpen, setIsOpen, className = '' }) => {
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

export const SelectValue = ({ placeholder, value }) => {
  return (
    <span className={value ? '' : 'text-muted-foreground'}>
      {value || placeholder}
    </span>
  );
};

export const SelectContent = ({ children, isOpen, onValueChange, setIsOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-full left-0 z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md">
      <div className="p-1">
        {React.Children.map(children, child => 
          React.cloneElement(child, { onValueChange, setIsOpen })
        )}
      </div>
    </div>
  );
};

export const SelectItem = ({ children, value, onValueChange, setIsOpen }) => {
  return (
    <div
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
      onClick={() => {
        onValueChange(value);
        setIsOpen(false);
      }}
    >
      {children}
    </div>
  );
};

