import React from 'react';
import { AppSettings } from '../types';

interface KopSuratProps {
  settings: AppSettings;
  className?: string;
  showDoubleBorder?: boolean;
}

/**
 * Komponen Siluet Bayangan Tunas Kelapa (Cikal Gerakan Pramuka)
 * Sesuai gambar kiri kop surat
 */
export const DefaultCikalLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={`shrink-0 ${className}`}
      fill="currentColor"
    >
      {/* Batok kelapa miring khas lambang cikal */}
      <path
        d="M 28 92 C 14 84 8 68 20 54 C 28 44 42 42 54 48 C 68 56 70 74 60 88 C 50 100 38 98 28 92 Z"
        fill="#111827"
      />
      {/* Tunas kelapa menjulang ke atas dengan lekukan khas cikal */}
      <path
        d="M 44 52 C 40 36 44 20 48 4 C 52 14 58 26 58 36 C 58 44 54 50 44 52 Z"
        fill="#111827"
      />
      <path
        d="M 47 38 C 42 26 38 18 42 6 C 46 16 52 28 50 40 Z"
        fill="#111827"
      />
      {/* Akar tunas di bagian bawah */}
      <path
        d="M 24 92 C 22 102 18 110 16 114 C 20 112 26 104 28 96 Z"
        fill="#111827"
      />
      <path
        d="M 34 94 C 36 104 38 112 40 118 C 40 110 38 102 36 94 Z"
        fill="#111827"
      />
    </svg>
  );
};

/**
 * Komponen Logo Pandu Dunia WOSM (World Scout Emblem Ungu)
 * Sesuai gambar kanan kop surat
 */
export const DefaultWosmLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    >
      {/* Lingkaran Ungu Tua Khas WOSM */}
      <circle cx="60" cy="60" r="56" fill="#4A154B" />
      <circle cx="60" cy="60" r="50" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Tali melingkar dengan simpul mati (reef knot) di bagian bawah */}
      {/* Simpul Reef Knot di bawah */}
      <g stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 52 103 C 56 100 64 100 68 103" />
        <path d="M 48 100 C 52 105 68 105 72 100" />
        <ellipse cx="60" cy="102" rx="4" ry="2.5" />
      </g>

      {/* Fleur-de-lis (Bunga Lili Pandu Dunia) */}
      <g fill="#FFFFFF">
        {/* Daun tengah dengan garis vertikal */}
        <path d="M 60 22 C 64 34 71 46 72 62 C 66 65 62 66 60 66 C 58 66 54 65 48 62 C 49 46 56 34 60 22 Z" />
        {/* Daun kiri */}
        <path d="M 54 54 C 44 48 35 52 32 60 C 30 66 34 72 42 70 C 50 68 53 64 56 58 Z" />
        {/* Daun kanan */}
        <path d="M 66 54 C 76 48 85 52 88 60 C 90 66 86 72 78 70 C 70 68 67 64 64 58 Z" />
        {/* Bintang kiri (5 sudut) */}
        <polygon points="44,60 45.5,63.5 49,63.5 46,65.5 47,69 44,67 41,69 42,65.5 39,63.5 42.5,63.5" fill="#4A154B" />
        {/* Bintang kanan (5 sudut) */}
        <polygon points="76,60 77.5,63.5 81,63.5 78,65.5 79,69 76,67 73,69 74,65.5 71,63.5 74.5,63.5" fill="#4A154B" />
        {/* Cincin pengikat di bawah kelopak */}
        <rect x="52" y="66" width="16" height="5" rx="2" fill="#FFFFFF" />
        {/* Jarum kompas / panah di bagian bawah daun */}
        <polygon points="60,71 55,80 65,80" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

export const KopSurat: React.FC<KopSuratProps> = ({
  settings,
  className = '',
  showDoubleBorder = true,
}) => {
  const baris1 = settings.kopBaris1 || 'GERAKAN PRAMUKA';
  const baris2 = settings.kopBaris2 || `KWARTIR RANTING KECAMATAN ${settings.kwarran?.replace('KWARRAN ', '') || 'KEMRANJEN'}`;
  const baris3 =
    settings.kopBaris3 ||
    'Alamat: Jalan Pramuka Nomor 17 Karangjati Kemranjen Banyumas Kode Pos 53194';

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between gap-3 sm:gap-6 py-2">
        {/* LOGO KIRI (Siluet Tunas Kelapa Cikal atau Kustom Upload) */}
        <div className="w-16 sm:w-20 h-20 sm:h-24 shrink-0 flex items-center justify-center">
          {settings.logoKiriUrl ? (
            <img
              src={settings.logoKiriUrl}
              alt="Logo Kiri Kop Surat"
              className="max-h-20 sm:max-h-24 max-w-full object-contain"
            />
          ) : (
            <DefaultCikalLogo size={70} />
          )}
        </div>

        {/* TULISAN KOP SURAT 3 BARIS */}
        <div className="text-center flex-1 px-1">
          {/* Baris 1: GERAKAN PRAMUKA */}
          <div className="text-base sm:text-xl lg:text-2xl font-black tracking-wider text-black uppercase font-sans leading-snug">
            {baris1}
          </div>

          {/* Baris 2: KWARTIR RANTING KECAMATAN KEMRANJEN */}
          <div className="text-sm sm:text-lg lg:text-xl font-extrabold tracking-wide text-black uppercase font-sans mt-0.5 leading-tight">
            {baris2}
          </div>

          {/* Baris 3: Alamat Lengkap */}
          <div className="text-[11px] sm:text-xs text-black font-medium mt-1 leading-normal font-sans">
            {baris3}
          </div>
        </div>

        {/* LOGO KANAN (WOSM Pandu Dunia Ungu atau Kustom Upload) */}
        <div className="w-16 sm:w-20 h-20 sm:h-24 shrink-0 flex items-center justify-center">
          {settings.logoKananUrl ? (
            <img
              src={settings.logoKananUrl}
              alt="Logo Kanan Kop Surat"
              className="max-h-20 sm:max-h-24 max-w-full object-contain rounded-full"
            />
          ) : (
            <DefaultWosmLogo size={72} />
          )}
        </div>
      </div>

      {/* Garis Pembatas Kop Surat Resmi (Garis Ganda Tebal-Tipis Sesuai Standar Surat Resmi) */}
      {showDoubleBorder && (
        <div className="mt-1">
          <div className="border-b-[3px] border-black" />
          <div className="border-b-[1px] border-black mt-[1.5px]" />
        </div>
      )}
    </div>
  );
};
