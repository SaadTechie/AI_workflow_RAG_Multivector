import React from 'react';

interface SegulaLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-16 h-16',
};

import logoSegula from '../../assets/favicon.png';

export const SegulaLogo: React.FC<SegulaLogoProps> = ({ size = 'md' }) => {
  return (
    <div className={`${SIZES[size]} flex items-center justify-center shrink-0 overflow-hidden`}>
      <img
        src={logoSegula}
        alt="SEGULA Assistant"
        className="w-full h-full object-contain"
      />
    </div>
  );
};