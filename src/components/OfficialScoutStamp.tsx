import React from 'react';

interface OfficialScoutStampProps {
  kwartirName?: string;
  tahun?: string;
  className?: string;
  size?: number;
}

export const OfficialScoutStamp: React.FC<OfficialScoutStampProps> = ({
  kwartirName = 'KWARTIR CABANG BANYUMAS',
  tahun = '2026',
  className = '',
  size = 110,
}) => {
  return (
    <div
      className={`inline-block select-none pointer-events-none transform -rotate-12 opacity-85 mix-blend-multiply ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Ring (Purple / Scout ink tone) */}
        <circle cx="80" cy="80" r="76" stroke="#4C1D95" strokeWidth="3" />
        <circle cx="80" cy="80" r="71" stroke="#5B21B6" strokeWidth="1.5" strokeDasharray="4 2" />
        <circle cx="80" cy="80" r="52" stroke="#5B21B6" strokeWidth="2" />

        {/* Circular text top: GERAKAN PRAMUKA */}
        <path
          id="stamp-top-path"
          d="M 24 80 A 56 56 0 0 1 136 80"
          fill="none"
        />
        <text fontSize="9.5" fontWeight="900" fill="#4C1D95" letterSpacing="1.2">
          <textPath href="#stamp-top-path" startOffset="50%" textAnchor="middle">
            GERAKAN PRAMUKA
          </textPath>
        </text>

        {/* Circular text bottom: KWARCAB BANYUMAS */}
        <path
          id="stamp-bottom-path"
          d="M 136 80 A 56 56 0 0 1 24 80"
          fill="none"
        />
        <text fontSize="8" fontWeight="800" fill="#4C1D95" letterSpacing="0.8">
          <textPath href="#stamp-bottom-path" startOffset="50%" textAnchor="middle">
            KWARTIR CABANG BANYUMAS
          </textPath>
        </text>

        {/* Star Separators */}
        <polygon
          points="25,80 27,82 25,84 23,82"
          fill="#4C1D95"
        />
        <polygon
          points="135,80 137,82 135,84 133,82"
          fill="#4C1D95"
        />

        {/* Center emblem: Cikal Kelapa and Year */}
        <g transform="translate(80, 76) scale(0.85)">
          {/* Cikal Sprout */}
          <path
            d="M 0 -22 C 6 -20 12 -12 12 0 C 12 14 5 22 0 24 C -5 22 -12 14 -12 0 C -12 -12 -6 -20 0 -22 Z"
            fill="none"
            stroke="#4C1D95"
            strokeWidth="2.5"
          />
          <path
            d="M 0 -12 C 4 -18 10 -22 16 -24 C 11 -18 8 -12 6 -6 Z"
            fill="#4C1D95"
          />
          <path
            d="M 0 -12 C -4 -18 -10 -22 -16 -24 C -11 -18 -8 -12 -6 -6 Z"
            fill="#4C1D95"
          />
          <circle cx="0" cy="2" r="4" fill="#4C1D95" />
        </g>

        <text
          x="80"
          y="114"
          textAnchor="middle"
          fontSize="9"
          fontWeight="900"
          fill="#4C1D95"
          letterSpacing="1"
        >
          {tahun}
        </text>
      </svg>
    </div>
  );
};
