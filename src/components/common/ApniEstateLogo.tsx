import React from 'react';

interface ApniEstateLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  showSubtitle?: boolean;
}

export const ApniEstateLogo: React.FC<ApniEstateLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
  showSubtitle = false
}) => {
  const fillColor = variant === 'light' ? '#FFFFFF' : '#0B2545';
  const subtitleColor = variant === 'light' ? '#94A3B8' : '#64748B';

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const textSizes = {
    sm: 'text-sm tracking-[0.20em]',
    md: 'text-lg tracking-[0.22em]',
    lg: 'text-2xl tracking-[0.24em]'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Geometric Navy House Mark */}
      <svg 
        className={`${iconSizes[size]} shrink-0 drop-shadow-xs`} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Navy Block with Negative Space House & Chimney Cutout */}
        <path 
          d="M 20 15 
             L 180 15 
             L 180 135 
             L 135 75 
             L 95 125 
             L 95 90 
             L 60 90 
             L 60 145 
             L 20 200 
             Z" 
          fill={fillColor} 
        />
        
        {/* 4-Pane Window in Gable */}
        <rect x="123" y="115" width="10" height="10" rx="0.5" fill={fillColor} />
        <rect x="137" y="115" width="10" height="10" rx="0.5" fill={fillColor} />
        <rect x="123" y="129" width="10" height="10" rx="0.5" fill={fillColor} />
        <rect x="137" y="129" width="10" height="10" rx="0.5" fill={fillColor} />
      </svg>

      {/* Brand Text Block */}
      <div className="flex flex-col">
        <div className={`font-black font-display uppercase leading-none ${textSizes[size]}`} style={{ color: fillColor }}>
          APNI ESTATE
        </div>
        {showSubtitle && (
          <div 
            className="text-[9px] sm:text-[10px] font-bold tracking-[0.24em] uppercase mt-1 leading-none"
            style={{ color: subtitleColor }}
          >
            INTERIOR STUDIO MANAGEMENT SOFTWARE
          </div>
        )}
      </div>
    </div>
  );
};
