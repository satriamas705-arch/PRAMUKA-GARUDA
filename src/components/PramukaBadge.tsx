import React from 'react';
import { PramukaGarudaLogo } from './PramukaGarudaLogo';

interface PramukaBadgeProps {
  className?: string;
  size?: number;
  showText?: boolean;
  customLogoUrl?: string;
  kwarranText?: string;
  year?: string;
}

export const PramukaBadge: React.FC<PramukaBadgeProps> = ({
  className = '',
  size = 76,
  showText = false,
  customLogoUrl,
  kwarranText = 'KWARRAN KEMRANJEN',
  year = '2026',
}) => {
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt="Logo Pramuka Garuda"
          className="rounded-full object-contain drop-shadow-sm"
          style={{ width: size, height: size }}
        />
      ) : (
        <PramukaGarudaLogo
          size={size}
          kwarranText={kwarranText}
          year={year}
        />
      )}

      {showText && (
        <span className="text-[11px] font-black tracking-wider text-amber-950 mt-1 uppercase text-center">
          {kwarranText}
        </span>
      )}
    </div>
  );
};
