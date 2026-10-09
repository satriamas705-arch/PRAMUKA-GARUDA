import React from 'react';

interface PramukaGarudaLogoProps {
  className?: string;
  size?: number;
  kwarranText?: string;
  year?: string;
  showShadow?: boolean;
}

export const PramukaGarudaLogo: React.FC<PramukaGarudaLogoProps> = ({
  className = '',
  size = 120,
  kwarranText = 'KWARRAN KEMRANJEN',
  year = '2026',
  showShadow = true,
}) => {
  return (
    <div
      className={`inline-block select-none shrink-0 ${showShadow ? 'drop-shadow-md' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 500 500"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="pg-gold-ribbon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <linearGradient id="pg-crown-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          <linearGradient id="pg-feather-light" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <linearGradient id="pg-beak" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="40%" stopColor="#1F2937" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>

          <radialGradient id="pg-eye" cx="45%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="80%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          <linearGradient id="pg-red-flag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          {/* Text paths */}
          {/* Top text arc: PENILAIAN PENCAPAIAN PRAMUKA GARUDA TAHUN 2026 */}
          <path
            id="pg-outer-top-arc"
            d="M 52 250 A 198 198 0 1 1 448 250"
            fill="none"
          />

          {/* Motto arc: SETIA - SIAP - SEDIA */}
          <path
            id="pg-motto-arc"
            d="M 115 250 A 135 135 0 0 1 385 250"
            fill="none"
          />

          {/* Bottom ribbon text arc: KWARRAN KEMRANJEN */}
          <path
            id="pg-ribbon-arc"
            d="M 85 365 A 200 200 0 0 0 415 365"
            fill="none"
          />

          {/* Clip path for inner circular flag */}
          <clipPath id="pg-inner-circle-clip">
            <circle cx="250" cy="250" r="186" />
          </clipPath>
        </defs>

        {/* Outer Circle Ring */}
        <circle cx="250" cy="250" r="244" fill="#FFFFFF" stroke="#991B1B" strokeWidth="6" />
        <circle cx="250" cy="250" r="236" fill="#FFFFFF" stroke="#D97706" strokeWidth="2" strokeDasharray="6 3" />

        {/* Top Outer Text: PENILAIAN PENCAPAIAN PRAMUKA GARUDA TAHUN 2026 */}
        <text
          fill="#111827"
          fontSize="22.5"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          letterSpacing="2.2"
        >
          <textPath href="#pg-outer-top-arc" startOffset="50%" textAnchor="middle">
            PENILAIAN PENCAPAIAN PRAMUKA GARUDA TAHUN {year}
          </textPath>
        </text>

        {/* Inner Circle (Red & White Flag Background) */}
        <g clipPath="url(#pg-inner-circle-clip)">
          {/* Base Inner Circle */}
          <circle cx="250" cy="250" r="186" fill="#FFFFFF" stroke="#991B1B" strokeWidth="4" />

          {/* Red Top Half of Indonesian Flag */}
          <path
            d="M 64 250 A 186 186 0 0 1 436 250 C 370 265, 300 235, 230 255 C 160 275, 110 255, 64 250 Z"
            fill="url(#pg-red-flag)"
          />
          {/* Subtle Flag wave highlight */}
          <path
            d="M 64 250 C 130 235, 200 260, 270 240 C 340 220, 390 240, 436 250 L 436 260 C 370 275, 300 245, 230 265 C 160 285, 110 265, 64 260 Z"
            fill="#FFFFFF"
            opacity="0.25"
          />

          {/* Motto Text on Red Field: SETIA - SIAP - SEDIA */}
          <text
            fill="#FFFFFF"
            fontSize="22"
            fontWeight="900"
            fontFamily="system-ui, serif"
            letterSpacing="3"
            stroke="#991B1B"
            strokeWidth="0.8"
          >
            <textPath href="#pg-motto-arc" startOffset="50%" textAnchor="middle">
              SETIA - SIAP - SEDIA
            </textPath>
          </text>

          {/* ================= GARUDA PROFILE (CENTERPIECE) ================= */}
          <g transform="translate(110, 105)">
            {/* Dark Underfeathers & Crest Back */}
            <path
              d="M 180 80 C 230 40 280 80 270 140 C 290 120 310 160 280 200 C 300 210 280 260 250 280 C 210 300 160 300 130 280 Z"
              fill="#1F2937"
            />
            {/* Feathers plume back */}
            <path
              d="M 230 70 C 265 45 285 75 275 110 C 290 95 305 130 290 165 C 310 180 295 220 270 240"
              fill="#78350F"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />

            {/* Back Golden Feathers Layer */}
            <path
              d="M 210 90 L 255 75 L 240 105 L 280 100 L 250 135 L 285 145 L 250 170 L 280 195 L 240 215 L 265 245 L 210 255"
              fill="url(#pg-feather-light)"
              stroke="#78350F"
              strokeWidth="2"
            />

            {/* Main Neck & Head Golden Feathers */}
            <path
              d="M 120 180 C 130 230 150 270 220 280 C 170 285 130 275 100 240 C 80 210 70 180 80 150 Z"
              fill="#92400E"
            />
            {/* Layered Golden Neck Feathers */}
            <g fill="url(#pg-feather-light)" stroke="#78350F" strokeWidth="1.2">
              <path d="M 120 170 C 145 190 170 210 195 240 C 165 245 140 230 120 200 Z" />
              <path d="M 135 150 C 165 170 195 195 215 220 C 185 225 160 210 135 180 Z" />
              <path d="M 150 130 C 180 150 210 175 230 200 C 205 205 180 190 150 160 Z" />
              <path d="M 165 110 C 195 130 225 155 245 180 C 220 185 195 170 165 140 Z" />
            </g>

            {/* Front Throat & Chin */}
            <path
              d="M 60 185 C 75 195 95 205 115 210 C 105 225 90 235 75 225 C 65 210 60 195 60 185 Z"
              fill="#F59E0B"
              stroke="#78350F"
              strokeWidth="1.5"
            />

            {/* Beak & Cere */}
            {/* Upper Hooked Curved Beak */}
            <path
              d="M 50 145 C 30 148 5 160 -5 180 C -15 200 -12 225 -2 235 C -2 215 8 190 35 180 C 45 176 52 170 55 160 Z"
              fill="url(#pg-beak)"
              stroke="#111827"
              strokeWidth="2"
            />
            {/* Lower Beak */}
            <path
              d="M 25 182 C 15 195 12 210 18 218 C 22 215 28 200 45 190 Z"
              fill="#1F2937"
              stroke="#111827"
              strokeWidth="1.5"
            />
            {/* Beak Highlight */}
            <path
              d="M 35 155 C 20 165 8 180 3 195 C 10 180 22 170 38 165 Z"
              fill="#FDE68A"
              opacity="0.8"
            />

            {/* Golden Face Mask & Eye Rim */}
            <path
              d="M 45 145 C 50 130 70 120 95 125 C 110 128 120 140 115 160 C 105 175 80 180 60 175 C 50 172 45 160 45 145 Z"
              fill="url(#pg-feather-light)"
              stroke="#78350F"
              strokeWidth="1.5"
            />

            {/* Piercing Golden Eagle Eye */}
            <circle cx="78" cy="148" r="16" fill="#1F2937" />
            <circle cx="78" cy="148" r="13" fill="url(#pg-eye)" stroke="#78350F" strokeWidth="1" />
            <circle cx="78" cy="148" r="6.5" fill="#000000" />
            <circle cx="75" cy="145" r="3" fill="#FFFFFF" />
            {/* Fierce Brow */}
            <path
              d="M 58 135 C 72 130 90 132 102 140"
              stroke="#451A03"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* ================= ROYAL GOLDEN CROWN (MAHKOTA KENCANA) ================= */}
            <g transform="translate(65, 30)">
              {/* Crown Base Band with Rubies */}
              <path
                d="M 15 65 C 35 55 65 55 90 65 L 85 75 C 60 68 35 68 18 75 Z"
                fill="url(#pg-crown-gold)"
                stroke="#78350F"
                strokeWidth="1.5"
              />
              {/* Crown Jewels on Base */}
              <circle cx="28" cy="67" r="3" fill="#DC2626" stroke="#92400E" strokeWidth="1" />
              <circle cx="52" cy="63" r="4" fill="#DC2626" stroke="#92400E" strokeWidth="1" />
              <circle cx="76" cy="67" r="3" fill="#DC2626" stroke="#92400E" strokeWidth="1" />

              {/* Main Crown Spires & Ornaments */}
              {/* Center Tower */}
              <path
                d="M 45 60 L 52 18 L 59 60 Z"
                fill="url(#pg-crown-gold)"
                stroke="#78350F"
                strokeWidth="1.5"
              />
              <circle cx="52" cy="16" r="4.5" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
              {/* Center Big Ruby */}
              <path
                d="M 48 38 L 52 30 L 56 38 L 52 46 Z"
                fill="#DC2626"
                stroke="#78350F"
                strokeWidth="1"
              />

              {/* Left Spire */}
              <path
                d="M 22 62 L 28 32 L 36 60 Z"
                fill="url(#pg-crown-gold)"
                stroke="#78350F"
                strokeWidth="1.2"
              />
              <circle cx="28" cy="30" r="3.5" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
              <circle cx="28" cy="45" r="2.5" fill="#DC2626" />

              {/* Right Spire */}
              <path
                d="M 68 60 L 76 32 L 82 62 Z"
                fill="url(#pg-crown-gold)"
                stroke="#78350F"
                strokeWidth="1.2"
              />
              <circle cx="76" cy="30" r="3.5" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
              <circle cx="76" cy="45" r="2.5" fill="#DC2626" />

              {/* Crown Royal Plumes / Feathers behind */}
              <path
                d="M 52 20 C 65 0 85 -5 95 10 C 85 15 75 18 60 22 Z"
                fill="#1F2937"
                stroke="#D97706"
                strokeWidth="1"
              />
              <path
                d="M 52 20 C 60 5 70 2 80 12 Z"
                fill="#DC2626"
              />
            </g>

            {/* Royal Gold Filigree Collar / Perhiasan Leher */}
            <g transform="translate(60, 205)">
              <path
                d="M 20 20 C 50 15 90 25 125 50 C 95 60 55 50 20 30 Z"
                fill="url(#pg-crown-gold)"
                stroke="#78350F"
                strokeWidth="1.5"
              />
              <circle cx="50" cy="28" r="4" fill="#DC2626" stroke="#78350F" strokeWidth="1" />
              <circle cx="80" cy="36" r="5" fill="#DC2626" stroke="#78350F" strokeWidth="1" />
              <circle cx="105" cy="45" r="4" fill="#DC2626" stroke="#78350F" strokeWidth="1" />
            </g>
          </g>
        </g>

        {/* Inner Border Ring */}
        <circle cx="250" cy="250" r="186" fill="none" stroke="#78350F" strokeWidth="4" />

        {/* ================= BOTTOM RIBBON (BANNER) ================= */}
        {/* Ribbon Shadow */}
        <path
          d="M 58 355 C 130 425 370 425 442 355 L 430 405 C 360 470 140 470 70 405 Z"
          fill="#78350F"
          opacity="0.3"
        />

        {/* Main Ribbon Body */}
        <path
          d="M 64 350 C 135 418 365 418 436 350 C 445 375 428 412 405 435 C 330 485 170 485 95 435 C 72 412 55 375 64 350 Z"
          fill="url(#pg-gold-ribbon)"
          stroke="#78350F"
          strokeWidth="4"
        />

        {/* Ribbon Border Inset Highlight */}
        <path
          d="M 78 360 C 142 418 358 418 422 360 C 412 388 395 415 375 432 C 315 470 185 470 125 432 C 105 415 88 388 78 360 Z"
          fill="none"
          stroke="#FEF3C7"
          strokeWidth="1.5"
          opacity="0.75"
        />

        {/* Ribbon Text: KWARRAN KEMRANJEN */}
        <text
          fill="#FFFFFF"
          fontSize="30"
          fontWeight="900"
          fontFamily="system-ui, serif"
          letterSpacing="4"
          stroke="#78350F"
          strokeWidth="1.5"
        >
          <textPath href="#pg-ribbon-arc" startOffset="50%" textAnchor="middle">
            {kwarranText}
          </textPath>
        </text>

        {/* Ribbon End Finials & Gems */}
        <circle cx="78" cy="360" r="4.5" fill="#FEF3C7" stroke="#78350F" strokeWidth="1" />
        <circle cx="422" cy="360" r="4.5" fill="#FEF3C7" stroke="#78350F" strokeWidth="1" />
      </svg>
    </div>
  );
};
