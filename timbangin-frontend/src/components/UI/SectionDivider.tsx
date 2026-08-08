import React from 'react';

export const SectionDivider: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`h-1.5 w-full overflow-hidden ${className}`}>
      <div 
        className="w-full h-full opacity-20 dark:opacity-30" 
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #F2A900, #F2A900 10px, #1C2128 10px, #1C2128 20px)'
        }}
      />
    </div>
  );
};
