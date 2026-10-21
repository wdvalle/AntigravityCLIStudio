import React from 'react';

export const AntigravityLogo: React.FC<{
  size?: number;
  pulsing?: boolean;
  className?: string;
}> = ({ size = 24, pulsing = false, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${pulsing ? 'agy-logo-pulse' : ''} ${className}`}
    >
      <defs>
        <linearGradient id="agyGradient" x1="20" y1="20" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="55%" stopColor="#2F80ED" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <path
        d="M144.248 149.062C151.748 154.688 162.998 150.938 152.685 140.625C121.748 110.625 128.31 28.125 89.8727 28.125C51.4352 28.125 57.9977 110.625 27.0602 140.625C15.8102 151.875 27.9977 154.688 35.4977 149.062C64.5602 129.375 62.6852 94.6875 89.8727 94.6875C117.06 94.6875 115.185 129.375 144.248 149.062Z"
        fill="url(#agyGradient)"
      />
    </svg>
  );
};
