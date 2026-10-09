import React, { useState, useRef } from 'react';
import { AppSettings } from '../types';
import {
  X,
  Settings,
  RotateCcw,
  Download,
  Upload,
  Check,
  Image,
  Sparkles,
  FileText,
  Trash2,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { PramukaBadge } from './PramukaBadge';
import { KopSurat, DefaultCikalLogo, DefaultWosmLogo } from './KopSurat';

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetDefault: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onResetDefault,
  onClose,
}) => {
  // General event settings
  const [kwartirCabang, setKwartirCabang] = useState(settings.kwartirCabang);
  const [kwarran, setKwarran] = useState(settings.kwarran || 'KWARRAN KEMRANJEN');
  const [golongan, setGolongan] = useState(settings.golongan);
  const [tahun, setTahun] = useState(settings.tahun);
  const [tempat, setTempat] = useState(settings.tempat);
  const [ketuaPanitia, setKetuaPanitia] = useState(settings.mabigusAtauKetuaPanitia || '');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(settings.customLogoUrl);

  // Kop Surat Settings (3 Baris & Logo Kiri/Kanan)
  const [kopBaris1, setKopBaris1] = useState(
    settings.kopBaris1 || 'GERAKAN PRAMUKA'
  );
  const [kopBaris2, setKopBaris2] = useState(
    settings.kopBaris2 || 'KWARTIR RANTING KECAMATAN KEMRANJEN'
  );
  const [kopBaris3, setKopBaris3] = useState(
    settings.kopBaris3 ||
      'Alamat: Jalan Pramuka Nomor 17 Karangjati Kemranjen Banyumas Kode Pos 53194'
  );
  const [logoKiriUrl, setLogoKiriUrl] = useState<string | undefined>(settings.logoKiriUrl);
  const [logoKananUrl, setLogoKananUrl] = useState<string | undefined>(settings.logoKananUrl);

  const [activeSubTab, setActiveSubTab] = useState<'kop' | 'umum' | 'garuda'>('kop');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // File input refs
  const fileInputGarudaRef = useRef<HTMLInputElement>(null);
  const fileInputKiriRef = useRef<HTMLInputElement>(null);
  const fileInputKananRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | undefined) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      kwartirCabang,
      kwarran,
      golongan,
      tahun,
      tempat,
      mabigusAtauKetuaPanitia: ketuaPanitia,
      customLogoUrl,
      kopBaris1,
      kopBaris2,
      kopBaris3,
      logoKiriUrl,
      logoKananUrl,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 700);
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      peserta: localStorage.getItem('pg_banyumas_peserta_v1'),
      penguji: localStorage.getItem('pg_banyumas_penguji_v1'),
      kelompok: localStorage.getItem('pg_banyumas_kelompok_v1'),
      penilaian: localStorage.getItem('pg_banyumas_penilaian_v1'),
      settings: localStorage.getItem('pg_banyumas_settings_v1'),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Pramuka_Garuda_${tahun}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Temporary settings object for KopSurat live preview
  const previewSettings: AppSettings = {
    ...settings,
    kwartirCabang,
    kwarran,
    golongan,
    tahun,
    tempat,
    mabigusAtauKetuaPanitia: ketuaPanitia,
    customLogoUrl,
    kopBaris1,
    kopBaris2,
    kopBaris3,
    logoKiriUrl,
    logoKananUrl,
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-5 sm:p-7 border border-stone-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-600 text-white shadow-sm shadow-amber-600/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight uppercase">
                Pengaturan Kop Surat &amp; Identitas
              </h3>
              <p className="text-xs text-stone-500">
                Atur 3 baris teks kop surat, unggah logo kiri &amp; kanan, dan identitas kwartir
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigasi Pengaturan */}
        <div className="flex items-center gap-2 mb-5 p-1 bg-stone-100 rounded-xl border border-stone-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('kop')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'kop'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Kop Surat (3 Baris &amp; Logo)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('umum')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'umum'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Data Kwartir &amp; Kegiatan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('garuda')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'garuda'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Logo Pramuka Garuda</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          {/* TAB 1: KOP SURAT 3 BARIS & UPLOAD LOGO KIRI KANAN */}
          {activeSubTab === 'kop' && (
            <div className="space-y-5 animate-in fade-in">
              {/* LIVE PREVIEW KOP SURAT */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-300 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950 uppercase tracking-wide">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-700" />
                    <span>Pratinjau Langsung Kop Surat (Live Preview)</span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-200/80 px-2 py-0.5 rounded-full">
                    Sesuai Standar Resmi
                  </span>
                </div>

                <div className="bg-white p-4 rounded-lg border border-stone-300 shadow-xs overflow-x-auto">
                  <KopSurat settings={previewSettings} showDoubleBorder={true} />
                </div>
              </div>

              {/* UPLOAD LOGO KIRI & KANAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. UPLOAD LOGO KIRI */}
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-amber-600" />
                      <span>Logo Kiri Kop Surat</span>
                    </label>
                    <span className="text-[10px] font-bold text-stone-500">
                      {logoKiriUrl ? 'Kustom' : 'Default Cikal'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-stone-200">
                    <div className="w-16 h-18 shrink-0 flex items-center justify-center bg-stone-50 rounded border border-stone-200 p-1">
                      {logoKiriUrl ? (
                        <img
                          src={logoKiriUrl}
                          alt="Logo Kiri"
                          className="max-h-16 max-w-full object-contain"
                        />
                      ) : (
                        <DefaultCikalLogo size={52} />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="text-[11px] text-stone-600 font-medium leading-tight">
                        Default: Siluet Cikal Tunas Kelapa hitam. Format PNG/JPG/WebP transparan disarankan.
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="file"
                          ref={fileInputKiriRef}
                          accept="image/*"
                          onChange={(e) => handleLogoUpload(e, setLogoKiriUrl)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputKiriRef.current?.click()}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah Logo Kiri</span>
                        </button>
                        {logoKiriUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoKiriUrl(undefined)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                            title="Kembalikan ke siluet cikal bawaan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. UPLOAD LOGO KANAN */}
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-purple-700" />
                      <span>Logo Kanan Kop Surat</span>
                    </label>
                    <span className="text-[10px] font-bold text-stone-500">
                      {logoKananUrl ? 'Kustom' : 'Default WOSM'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-stone-200">
                    <div className="w-16 h-18 shrink-0 flex items-center justify-center bg-stone-50 rounded border border-stone-200 p-1">
                      {logoKananUrl ? (
                        <img
                          src={logoKananUrl}
                          alt="Logo Kanan"
                          className="max-h-16 max-w-full object-contain rounded-full"
                        />
                      ) : (
                        <DefaultWosmLogo size={52} />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="text-[11px] text-stone-600 font-medium leading-tight">
                        Default: Lambang Pandu Dunia WOSM Ungu. Format PNG/JPG/WebP transparan disarankan.
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="file"
                          ref={fileInputKananRef}
                          accept="image/*"
                          onChange={(e) => handleLogoUpload(e, setLogoKananUrl)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputKananRef.current?.click()}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah Logo Kanan</span>
                        </button>
                        {logoKananUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoKananUrl(undefined)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                            title="Kembalikan ke lambang WOSM bawaan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PENGISIAN 3 BARIS KOP SURAT */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-3">
                <div className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Teks Kop Surat (3 Baris)</span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-semibold lowercase">
                    sesuai contoh gambar kop resmi
                  </span>
                </div>

                {/* Baris 1 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                      Baris 1 — Judul Instansi Utama
                    </label>
                    <span className="text-[10px] text-stone-500 font-mono">Font Besar &amp; Tebal</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={kopBaris1}
                    onChange={(e) => setKopBaris1(e.target.value)}
                    placeholder="GERAKAN PRAMUKA"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-black text-stone-900 uppercase focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Contoh: <code>GERAKAN PRAMUKA</code>
                  </p>
                </div>

                {/* Baris 2 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                      Baris 2 — Kwartir / Lembaga Pelaksana
                    </label>
                    <span className="text-[10px] text-stone-500 font-mono">Font Sedang &amp; Tebal</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={kopBaris2}
                    onChange={(e) => setKopBaris2(e.target.value)}
                    placeholder="KWARTIR RANTING KECAMATAN KEMRANJEN"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold text-stone-900 uppercase focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Contoh: <code>KWARTIR RANTING KECAMATAN KEMRANJEN</code>
                  </p>
                </div>

                {/* Baris 3 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                      Baris 3 — Alamat Sekretariat &amp; Kontak / Kode Pos
                    </label>
                    <span className="text-[10px] text-stone-500 font-mono">Font Ramping Normal</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={kopBaris3}
                    onChange={(e) => setKopBaris3(e.target.value)}
                    placeholder="Alamat: Jalan Pramuka Nomor 17 Karangjati Kemranjen Banyumas Kode Pos 53194"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Contoh: <code>Alamat: Jalan Pramuka Nomor 17 Karangjati Kemranjen Banyumas Kode Pos 53194</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA KWARTIR & KEGIATAN */}
          {activeSubTab === 'umum' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Kwartir Cabang *
                  </label>
                  <input
                    type="text"
                    required
                    value={kwartirCabang}
                    onChange={(e) => setKwartirCabang(e.target.value)}
                    placeholder="KWARTIR CABANG BANYUMAS"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Kwartir Ranting *
                  </label>
                  <input
                    type="text"
                    required
                    value={kwarran}
                    onChange={(e) => setKwarran(e.target.value)}
                    placeholder="KWARRAN KEMRANJEN"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Golongan Pramuka *
                  </label>
                  <select
                    value={golongan}
                    onChange={(e) => setGolongan(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="GOLONGAN PENGGALANG">GOLONGAN PENGGALANG</option>
                    <option value="GOLONGAN SIAGA">GOLONGAN SIAGA</option>
                    <option value="GOLONGAN PENEGAK">GOLONGAN PENEGAK</option>
                    <option value="GOLONGAN PANDEGA">GOLONGAN PANDEGA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Tahun Kegiatan *
                  </label>
                  <input
                    type="text"
                    required
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    placeholder="2026"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-mono font-bold text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Tempat Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value)}
                    placeholder="Kemranjen, Banyumas"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Ketua Tim Penguji / Panitia
                  </label>
                  <input
                    type="text"
                    value={ketuaPanitia}
                    onChange={(e) => setKetuaPanitia(e.target.value)}
                    placeholder="Drs. H. Achmad Supriyanto, M.Pd."
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Backup & Reset Box */}
              <div className="pt-3 border-t border-stone-200">
                <div className="text-xs font-bold text-stone-700 mb-2 uppercase tracking-wider">
                  Cadangan &amp; Pemulihan Data Sistem
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-stone-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Cadangan JSON</span>
                  </button>

                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-rose-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset ke Data Bawaan</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-100/90 p-1 rounded-lg border border-rose-300 animate-in fade-in">
                      <span className="text-[11px] font-bold text-rose-900 px-1">
                        Yakin pulihkan data?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetConfirm(false);
                          onResetDefault();
                        }}
                        className="px-2 py-0.5 bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-black rounded-md transition-colors"
                      >
                        Ya, Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-2 py-0.5 bg-white text-stone-700 text-[11px] font-semibold rounded-md border border-stone-300"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGO PRAMUKA GARUDA (EMBLEM LINGKARAN) */}
          {activeSubTab === 'garuda' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <PramukaBadge
                    size={88}
                    customLogoUrl={customLogoUrl}
                    kwarranText={kwarran}
                    year={tahun}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-amber-950 uppercase tracking-wide">
                        Badge Garuda Lingkaran Resmi
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                        {customLogoUrl ? 'Kustom' : 'Standar Kemranjen'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-snug">
                      Pita Bawah: <span className="font-bold text-stone-800">{kwarran}</span> • Tahun: {tahun}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Digunakan pada lembar sertifikat SKHP, halaman login, dan sidebar aplikasi.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
                  <input
                    type="file"
                    ref={fileInputGarudaRef}
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, setCustomLogoUrl)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputGarudaRef.current?.click()}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti Badge Garuda</span>
                  </button>
                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomLogoUrl(undefined)}
                      className="px-2 py-1 text-[11px] text-stone-600 hover:text-rose-600 font-semibold text-center"
                    >
                      Kembalikan ke Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tombol Simpan Footer */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-stone-500 hidden sm:block">
              Perubahan kop surat akan langsung diterapkan pada semua dokumen cetak &amp; PDF.
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <span>Simpan Pengaturan</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
