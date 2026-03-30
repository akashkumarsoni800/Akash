import React from 'react';

interface AdukulLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  letterOnly?: boolean;
}

const AdukulLogo: React.FC<AdukulLogoProps> = ({ size = 'md', className = '', letterOnly = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-24 h-24 text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} bg-white rounded-[5px] border border-slate-100 flex items-center justify-center text-slate-800 font-black shadow-lg shadow-slate-200/50 active:scale-95 transition-all`}>
        A
      </div>
      {!letterOnly && (
        <span className={`${size === 'xl' ? 'text-4xl' : 'text-xl'} font-black tracking-tighter text-slate-900 uppercase`}>
          Adukul
        </span>
      )}
    </div>
  );
};

export default AdukulLogo;
