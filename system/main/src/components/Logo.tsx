import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap: Record<string, string> = {
  sm: 'h-12',
  md: 'h-24',
  lg: 'h-32',
  xl: 'h-48'
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = false, className = '' }) => {
  const src = 'http://localhost:5000/uploads/logo/ncps.png';
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={src}
        alt="NCPS Logo"
        className={`${sizeMap[size]} w-auto object-contain select-none rounded-2xl`}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          // Fallback to text if image fails
          const parent = target.parentElement;
          if (parent) {
             const textSpan = document.createElement('span');
             textSpan.className = "text-xl font-bold text-[#0B4F6C] dark:text-primary";
             textSpan.innerText = "NCPS";
             parent.appendChild(textSpan);
          }
        }}
        draggable={false}
      />
      {showText && (
        <span className="ml-2 text-lg font-semibold tracking-wide text-[#0B4F6C] dark:text-primary">
          NCPS
        </span>
      )}
    </div>
  );
};
