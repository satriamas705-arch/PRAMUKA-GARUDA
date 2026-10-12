import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Peserta, Penguji, PenilaianPeserta, AppSettings, Kelompok } from '../types';
import { PramukaBadge } from './PramukaBadge';
import { KopSurat } from './KopSurat';
import {
  Printer,
  Download,
  X,
  QrCode,
  Award,
  MapPin,
  Calendar,
  FileText,
} from 'lucide-react';
import { exportElementToPdf } from '../utils/generatePdf';
import { exportLembarIndividuToExcel } from '../utils/exportExcel';
import { formatTanggalIndonesia } from '../utils/formatDate';
import { extractGolonganName, formatPencapaianForGolongan } from '../utils/golongan';

interface LembarPenilaianPrintProps {
  peserta: Peserta;
  penilaian: PenilaianPeserta;
  penguji?: Penguji;
  kelompok?: Kelompok;
  settings: AppSettings;
  onClose?: () => void;
}

export const LembarPenilaianPrint: React.FC<LembarPenilaianPrintProps> = ({
  peserta,
  penilaian,
  penguji,
  kelompok,
  settings,
  onClose,
}) => {
  // Paper Size & Watermark / QR Toggles
  const [paperSize, setPaperSize] = useState<'a4' | 'f4'>('a4');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);

  // Isian Tempat & Tanggal Ujian
  const [tempatUjian, setTempatUjian] = useState<string>(
    settings.tempat || 'Kemranjen, Banyumas'
  );
  const [tanggalUjian, setTanggalUjian] = useState<string>(
    penilaian.tanggalPenilaian || settings.tanggalDefault || '2026-10-08'
  );

  // PDF Export Progress
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Calculations
  const totalPoin = penilaian.wawancara.reduce((acc, curr) => acc + (curr.poin || 0), 0);
  const persentase = Number(((totalPoin / 55) * 100).toFixed(2));
  const isLulus = persentase >= 80;
  const adminYaCount = penilaian.administrasi.filter((a) => a.tersedia).length;

  // Tanggal terformat dd mmmm yyyy
  const tanggalTerformat = formatTanggalIndonesia(tanggalUjian);

  // Predikat
  const predikat =
    persentase >= 90
      ? 'A (Sangat Baik / Unggul)'
      : persentase >= 80
      ? 'B (Baik / Memenuhi Syarat)'
      : persentase >= 65
      ? 'C (Cukup / Perlu Pemantapan)'
      : 'D (Kurang)';

  // Document Registry Number
  const regNumber = `PG-${settings.tahun}/${peserta.nomorPeserta.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Generate genuine QR code verification data
  useEffect(() => {
    const verificationText = [
      `LEMBAR VERIFIKASI RESMI PRAMUKA GARUDA`,
      `Kwartir: ${settings.kwartirCabang}`,
      `Tahun: ${settings.tahun}`,
      `Nama: ${peserta.nama}`,
      `No. Peserta: ${peserta.nomorPeserta}`,
      `Pangkalan: ${peserta.pangkalan}`,
      `TKU: ${peserta.tingkatTKU}`,
      `Skor Wawancara: ${totalPoin}/55 (${persentase}%)`,
      `Administrasi: ${adminYaCount}/14`,
      `Status: ${isLulus ? 'LULUS PRAMUKA GARUDA' : 'BELUM LULUS'}`,
      `Penguji: ${penguji?.nama || 'Tim Penilai Kwarcab'}`,
      `Tempat Ujian: ${tempatUjian}`,
      `Tanggal: ${tanggalTerformat}`,
      `No. Registrasi: ${regNumber}`,
    ].join('\n');

    QRCode.toDataURL(verificationText, {
      width: 140,
      margin: 1,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [
    peserta,
    penilaian,
    penguji,
    settings,
    totalPoin,
    persentase,
    isLulus,
    adminYaCount,
    regNumber,
    tempatUjian,
    tanggalTerformat,
  ]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportDirectPdf = async () => {
    setIsExportingPdf(true);
    setExportProgress(10);
    setExportStage('Menyiapkan lembar dokumen penilaian...');

    try {
      const elementIds = ['pdf-page-administrasi', 'pdf-page-wawancara'];
      const safeName = peserta.nama.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Penilaian_Garuda_${safeName}_${settings.tahun}.pdf`;

      await exportElementToPdf(elementIds, {
        fileName,
        paperSize,
        onProgress: (prog, stage) => {
          setExportProgress(prog);
          setExportStage(stage);
        },
      });
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor PDF. Anda dapat menggunakan tombol "Cetak (Ctrl+P)" sebagai alternatif.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/85 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 print:p-0 print:m-0 print:bg-white print:static print:inset-auto print:overflow-visible print:h-auto print:w-full print:block">
      <div className="max-w-[220mm] w-full mx-auto print:max-w-none print:w-full print:m-0 print:p-0">
        {/* ================= FORM PENGATURAN CETAK PDF (HIDDEN IN PRINT) ================= */}
        <div className="sticky top-2 z-30 mb-4 bg-stone-900/95 text-white p-4 rounded-2xl shadow-2xl border border-stone-700/80 backdrop-blur-md print:hidden">
          {/* Top Bar: Title, Status & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Document Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black shrink-0">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                    Cetak Lembar Penilaian Lengkap
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    2 Halaman Resmi
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isLulus
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {isLulus ? 'LULUS (≥80%)' : 'BELUM LULUS'}
                  </span>
                </div>
                <div className="text-xs text-stone-300 mt-0.5">
                  {peserta.nama} ({peserta.nomorPeserta}) • {peserta.pangkalan}
                </div>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  exportLembarIndividuToExcel(
                    peserta,
                    penilaian,
                    penguji,
                    settings,
                    tempatUjian,
                    tanggalUjian
                  )
                }
                className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white flex items-center gap-1.5 transition-all shadow-sm"
                title="Unduh format spreadsheet Excel"
              >
                <Download className="w-4 h-4" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportDirectPdf}
                disabled={isExportingPdf}
                className="px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 flex items-center gap-2 transition-all shadow-md shadow-amber-500/25 disabled:opacity-50"
                title="Unduh langsung file dokumen PDF lengkap 2 halaman"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF (.pdf)'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-stone-700 hover:bg-stone-600 active:scale-95 text-white flex items-center gap-2 transition-all shadow-sm"
                title="Cetak melalui printer atau dialog cetak browser (Ctrl+P)"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Cetak (Ctrl+P)</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors ml-1"
                  title="Tutup Form Cetak"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Export Progress Bar */}
          {isExportingPdf && (
            <div className="mt-3 pt-3 border-t border-stone-800 animate-in fade-in">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-amber-300 font-semibold">{exportStage}</span>
                <span className="font-mono text-stone-400">{exportProgress}%</span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Form Isian Tempat Ujian, Tanggal, dan Ukuran Kertas */}
          <div className="mt-4 pt-3 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center text-xs">
            {/* Isian Tempat Ujian */}
            <div className="lg:col-span-4 flex items-center gap-2 bg-stone-800/80 p-2 rounded-xl border border-stone-700/80">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 leading-none mb-1">
                  Tempat Ujian
                </label>
                <input
                  type="text"
                  value={tempatUjian}
                  onChange={(e) => setTempatUjian(e.target.value)}
                  placeholder="Contoh: Kemranjen, Banyumas"
                  className="w-full bg-stone-900 text-white font-semibold text-xs px-2 py-1 rounded-md border border-stone-600 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Isian Tanggal Ujian */}
            <div className="lg:col-span-4 flex items-center gap-2 bg-stone-800/80 p-2 rounded-xl border border-stone-700/80">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 leading-none mb-1">
                    Tanggal Ujian
                  </label>
                  <span className="text-[10px] text-amber-300 font-bold">
                    {tanggalTerformat}
                  </span>
                </div>
                <input
                  type="date"
                  value={tanggalUjian}
                  onChange={(e) => setTanggalUjian(e.target.value)}
                  className="w-full bg-stone-900 text-white font-semibold text-xs px-2 py-1 rounded-md border border-stone-600 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Pilihan Kertas & Tampilan */}
            <div className="lg:col-span-4 flex flex-wrap items-center justify-between sm:justify-end gap-3 bg-stone-800/80 p-2 rounded-xl border border-stone-700/80">
              {/* Paper Size */}
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 text-[11px] font-bold">Kertas:</span>
                <div className="inline-flex rounded-lg bg-stone-900 p-0.5 border border-stone-700">
                  <button
                    onClick={() => setPaperSize('a4')}
                    className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                      paperSize === 'a4'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    A4
                  </button>
                  <button
                    onClick={() => setPaperSize('f4')}
                    className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                      paperSize === 'f4'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    F4 / Folio
                  </button>
                </div>
              </div>

              {/* QR Code toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-stone-300 hover:text-white select-none text-[11px]">
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  className="rounded-sm accent-amber-500"
                />
                <span>QR Verifikasi</span>
              </label>

              {/* Watermark toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-stone-300 hover:text-white select-none text-[11px]">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded-sm accent-amber-500"
                />
                <span>Watermark</span>
              </label>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* LEMBAR PENILAIAN LENGKAP RESMI (2 HALAMAN RESMI)                 */}
        {/* ============================================================== */}
        <div className="space-y-8 print:space-y-0">
          {/* ==================== PAGE 1: ADMINISTRASI ==================== */}
          <div
            id="pdf-page-administrasi"
            className="bg-white text-stone-950 shadow-2xl rounded-lg p-6 sm:p-10 font-sans print:shadow-none print:p-0 print:m-0 print:rounded-none border border-stone-300 print:border-none relative overflow-hidden print:break-after-page"
            style={{ minHeight: paperSize === 'f4' ? '330mm' : '297mm' }}
          >
            {/* Subtle Official Watermark Background */}
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
                <PramukaBadge
                  size={480}
                  customLogoUrl={settings.customLogoUrl}
                  kwarranText={settings.kwarran || 'KWARRAN KEMRANJEN'}
                  year={settings.tahun}
                />
              </div>
            )}

            <div className="relative z-10">
              {/* Official Scout Kop Surat Header */}
              <div className="mb-4">
                <KopSurat settings={settings} showDoubleBorder={true} />
              </div>

              {/* Participant Identity & Registration Details */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 bg-stone-50/80 p-3.5 rounded-md border border-stone-300">
                <div className="text-xs sm:text-sm font-semibold space-y-1.5 flex-1">
                  <div className="flex">
                    <span className="w-28 font-bold text-stone-700">Nama Lengkap</span>
                    <span className="w-4">:</span>
                    <span className="font-extrabold text-stone-950 uppercase tracking-wide">
                      {peserta.nama}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-bold text-stone-700">Pangkalan / Gudep</span>
                    <span className="w-4">:</span>
                    <span className="text-stone-900 font-semibold">
                      {peserta.pangkalan} {peserta.gudep ? `(${peserta.gudep})` : ''}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-bold text-stone-700">Nomor Peserta</span>
                    <span className="w-4">:</span>
                    <span className="font-mono font-bold text-amber-950">
                      {peserta.nomorPeserta} {kelompok ? `• ${kelompok.nama}` : ''}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-bold text-stone-700">Golongan / TKU</span>
                    <span className="w-4">:</span>
                    <span className="text-stone-800 font-bold">
                      {peserta.golongan || extractGolonganName(settings.golongan)} (Tingkat {peserta.tingkatTKU})
                    </span>
                  </div>
                </div>

                {/* QR Code Verifikasi Resmi on Right Header (Pasfoto dihilangkan sesuai permintaan) */}
                {showQrCode && qrCodeDataUrl && (
                  <div className="w-20 h-24 border border-stone-300 bg-white p-1 flex flex-col items-center justify-center text-center rounded-sm shadow-xs shrink-0 self-center sm:self-auto">
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Verifikasi"
                      className="w-16 h-16 object-contain"
                    />
                    <span className="text-[7px] font-mono font-bold text-stone-500 uppercase mt-0.5">
                      VERIFIED
                    </span>
                  </div>
                )}
              </div>

              {/* Document Main Heading */}
              <div className="text-center mb-3">
                <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-stone-900">
                  KRITERIA KELULUSAN PENCAPAIAN PRAMUKA GARUDA
                </h2>
                <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-stone-800">
                  {settings.golongan}
                </h3>
                <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-stone-800">
                  {settings.kwartirCabang}
                </h4>
                <h5 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-stone-800">
                  TAHUN {settings.tahun}
                </h5>
              </div>

              {/* Section A Title */}
              <div className="font-extrabold text-sm tracking-wide uppercase mb-2 flex items-center justify-between border-b border-stone-800 pb-1">
                <span>A. ADMINISTRASI</span>
                <span className="text-xs font-bold text-stone-700">
                  Status: <span className="font-black text-amber-950">{adminYaCount} / 14 Butir Terpenuhi</span>
                </span>
              </div>

              {/* Section A Table (14 Items) */}
              <table className="w-full text-[11px] sm:text-xs border-collapse border-2 border-stone-800">
                <thead>
                  <tr className="bg-stone-100 text-stone-900 font-extrabold border-b-2 border-stone-800">
                    <th className="border border-stone-800 px-2 py-1.5 w-8 text-center" rowSpan={2}>
                      NO
                    </th>
                    <th className="border border-stone-800 px-2.5 py-1.5 text-center" rowSpan={2}>
                      PENCAPAIAN
                    </th>
                    <th className="border border-stone-800 px-1 py-0.5 text-center" colSpan={2}>
                      KETERSEDIAAN DATA
                    </th>
                    <th className="border border-stone-800 px-2 py-1.5 text-center w-44 sm:w-56" rowSpan={2}>
                      KETERANGAN / CATATAN
                    </th>
                  </tr>
                  <tr className="bg-stone-100 text-stone-900 font-extrabold border-b border-stone-800">
                    <th className="border border-stone-800 px-1 py-0.5 w-11 text-center text-[10px]">YA</th>
                    <th className="border border-stone-800 px-1 py-0.5 w-11 text-center text-[10px]">TIDAK</th>
                  </tr>
                </thead>
                <tbody>
                  {penilaian.administrasi.map((item, index) => (
                    <tr
                      key={item.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50/60'}
                    >
                      <td className="border border-stone-800 px-1.5 py-1 text-center font-bold align-top">
                        {item.id}
                      </td>
                      <td className="border border-stone-800 px-2 py-1 text-stone-900 leading-snug align-top">
                        {formatPencapaianForGolongan(item.pencapaian, settings.golongan)}
                      </td>
                      <td className="border border-stone-800 px-1 py-1 text-center font-black text-sm align-middle">
                        {item.tersedia ? '✓' : ''}
                      </td>
                      <td className="border border-stone-800 px-1 py-1 text-center font-black text-sm text-rose-700 align-middle">
                        {!item.tersedia ? '✓' : ''}
                      </td>
                      <td className="border border-stone-800 px-2 py-1 text-stone-700 text-[10px] italic align-top">
                        {item.catatan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Section A Footnote */}
              <div className="mt-2.5 text-[11px] text-stone-800 italic leading-relaxed bg-amber-50/50 p-2 border border-amber-200 rounded-sm">
                <p className="font-semibold">
                  Point Administrasi : Centang (✓) Ya (jika data tersedia) atau Tidak (Jika Data Tidak tersedia)
                </p>
                <p>
                  (Catatan = Namun point - point yang belum terpenuhi diberikan waktu 3 hari sebelum pelaksanaan Wawancara)
                </p>
              </div>

              {/* Page 1 Footer */}
              <div className="mt-4 pt-2 border-t border-stone-300 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                <span>Halaman 1 dari 2 • Dokumen Penilaian Pencapaian Pramuka Garuda</span>
                <span>Reg: {regNumber}</span>
              </div>
            </div>
          </div>

          {/* ==================== PAGE 2: WAWANCARA ==================== */}
          <div
            id="pdf-page-wawancara"
            className="bg-white text-stone-950 shadow-2xl rounded-lg p-6 sm:p-10 font-sans print:shadow-none print:p-0 print:m-0 print:rounded-none border border-stone-300 print:border-none relative overflow-hidden"
            style={{ minHeight: paperSize === 'f4' ? '330mm' : '297mm' }}
          >
            {/* Watermark Background */}
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
                <PramukaBadge
                  size={480}
                  customLogoUrl={settings.customLogoUrl}
                  kwarranText={settings.kwarran || 'KWARRAN KEMRANJEN'}
                  year={settings.tahun}
                />
              </div>
            )}

            <div className="relative z-10">
              {/* Header Top Summary for Page 2 */}
              <div className="border-b-2 border-stone-800 pb-2 mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                    B. WAWANCARA
                  </h3>
                  <div className="text-xs text-stone-600">
                    Instrumen Uji Kemampuan, Bakat Minat, dan Keteladanan
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="font-extrabold text-stone-900 uppercase">{peserta.nama}</div>
                  <div className="text-stone-600 text-[11px]">
                    {peserta.nomorPeserta} • {peserta.pangkalan}
                  </div>
                </div>
              </div>

              {/* Section B Table (11 Items) */}
              <table className="w-full text-[11px] sm:text-xs border-collapse border-2 border-stone-800">
                <thead>
                  <tr className="bg-stone-100 text-stone-900 font-extrabold border-b-2 border-stone-800">
                    <th className="border border-stone-800 px-2 py-1.5 w-8 text-center" rowSpan={2}>
                      NO
                    </th>
                    <th className="border border-stone-800 px-2.5 py-1.5 text-center" rowSpan={2}>
                      PENCAPAIAN
                    </th>
                    <th className="border border-stone-800 px-1 py-0.5 text-center" colSpan={5}>
                      POIN KEMAMPUAN
                    </th>
                    <th className="border border-stone-800 px-2 py-1.5 text-center w-40 sm:w-52" rowSpan={2}>
                      KETERANGAN / CATATAN
                    </th>
                  </tr>
                  <tr className="bg-stone-100 text-stone-900 font-extrabold border-b border-stone-800">
                    <th className="border border-stone-800 px-1 py-0.5 w-7 text-center text-[10px]">1</th>
                    <th className="border border-stone-800 px-1 py-0.5 w-7 text-center text-[10px]">2</th>
                    <th className="border border-stone-800 px-1 py-0.5 w-7 text-center text-[10px]">3</th>
                    <th className="border border-stone-800 px-1 py-0.5 w-7 text-center text-[10px]">4</th>
                    <th className="border border-stone-800 px-1 py-0.5 w-7 text-center text-[10px]">5</th>
                  </tr>
                </thead>
                <tbody>
                  {penilaian.wawancara.map((item, index) => (
                    <tr
                      key={item.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50/60'}
                    >
                      <td className="border border-stone-800 px-1.5 py-1.5 text-center font-bold align-top">
                        {item.id}
                      </td>
                      <td className="border border-stone-800 px-2.5 py-1.5 text-stone-900 leading-snug align-top">
                        {formatPencapaianForGolongan(item.pencapaian, settings.golongan)}
                      </td>
                      {[1, 2, 3, 4, 5].map((scale) => (
                        <td
                          key={scale}
                          className={`border border-stone-800 px-1 py-1 text-center font-black text-xs align-middle ${
                            item.poin === scale ? 'bg-amber-100/70' : ''
                          }`}
                        >
                          {item.poin === scale ? '✓' : ''}
                        </td>
                      ))}
                      <td className="border border-stone-800 px-2 py-1.5 text-stone-700 text-[10px] italic align-top">
                        {item.catatan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Skala Poin Legend */}
              <div className="mt-2 text-[10.5px] border border-stone-400 p-1.5 bg-stone-50 rounded-sm">
                <span className="font-extrabold text-stone-900">KETERANGAN: </span>
                <span className="text-stone-800">
                  1. Sangat Kurang &nbsp;&nbsp; 2. Kurang &nbsp;&nbsp; 3. Cukup &nbsp;&nbsp; 4. Baik &nbsp;&nbsp; 5. Sangat Baik
                </span>
              </div>

              {/* Score Formula Box and Examiner Signature Block */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {/* Left: Perhitungan Skor Resmi */}
                <div className="border-2 border-stone-900 p-3.5 bg-stone-50/70 rounded-sm shadow-xs">
                  <div className="flex items-center justify-between text-sm font-extrabold mb-2 pb-1.5 border-b border-stone-300">
                    <span>Jumlah Poin =</span>
                    <span className="text-2xl font-black text-stone-950 px-3.5 py-0.5 bg-white border-2 border-stone-800 rounded-sm">
                      {totalPoin}
                    </span>
                  </div>

                  <div className="text-xs font-semibold space-y-2">
                    <div className="flex items-center flex-wrap gap-1">
                      <span>% Pencapaian =</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block text-center border-b border-stone-800 px-1 text-[10px] leading-tight">
                          jumlah poin yang diperoleh
                          <br />
                          <span className="font-bold text-xs">55</span>
                        </span>
                        <span>x 100% =</span>
                        <span className="inline-block text-center border-b border-stone-800 px-1 font-black text-sm">
                          {totalPoin}
                          <br />
                          <span className="text-xs">55</span>
                        </span>
                        <span>x 100% =</span>
                        <span className="font-black text-base text-stone-950 underline underline-offset-2">
                          {persentase}%
                        </span>
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-stone-300">
                      <div className="font-black text-xs uppercase tracking-wider text-stone-800">
                        LULUS jika tercapai minimal 80 %
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-700">KEPUTUSAN:</span>
                        <span
                          className={`px-3 py-1 text-sm font-black tracking-wider rounded-sm border-2 ${
                            isLulus
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-700'
                              : 'bg-rose-100 text-rose-950 border-rose-700'
                          }`}
                        >
                          {isLulus ? 'LULUS PRAMUKA GARUDA' : 'BELUM LULUS'}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-600 mt-1">
                        Predikat: <span className="font-bold text-stone-900">{predikat}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Signature Block (Cap basah & tanda tangan simulasi dihilangkan, format tanggal dd mmmm yyyy) */}
                <div className="text-center sm:text-right pt-1 sm:pr-2 flex flex-col items-center sm:items-end">
                  <div className="text-xs sm:text-sm text-stone-900 font-semibold">
                    {tempatUjian || settings.tempat || 'Kemranjen, Banyumas'}, {tanggalTerformat}
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-stone-950 mt-0.5">
                    Tim Penguji Pramuka Garuda
                  </div>

                  {/* Ruang Tanda Tangan Manual Penguji (Bersih untuk tanda tangan basah langsung) */}
                  <div className="w-56 h-20 sm:h-24 my-1 flex items-center justify-center sm:justify-end">
                    {/* Ruang tanda tangan resmi penguji */}
                  </div>

                  {/* Examiner Name & Details */}
                  <div className="text-center sm:text-right">
                    <div className="text-xs sm:text-sm font-black text-stone-950 underline underline-offset-2">
                      {penguji?.nama || '( .................................................... )'}
                    </div>
                    <div className="text-[11px] text-stone-700 font-mono font-semibold">
                      {penguji?.nipNta ? `NIP/NTA: ${penguji.nipNta}` : 'NIP/NTA: .......................................'}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {penguji?.jabatan || 'Tim Penilai Kwartir Cabang'}
                    </div>
                  </div>
                </div>
              </div>

              {penilaian.catatanUmum && (
                <div className="mt-3 p-2 bg-stone-50 border border-stone-300 text-xs rounded-sm">
                  <span className="font-bold text-stone-900">Catatan Khusus Penguji: </span>
                  <span className="text-stone-700">{penilaian.catatanUmum}</span>
                </div>
              )}

              {/* Page 2 Footer */}
              <div className="mt-5 pt-2 border-t border-stone-300 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                <span>Halaman 2 dari 2 • Dokumen Penilaian Pencapaian Pramuka Garuda</span>
                <span>Verifikasi ID: {regNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
