import React from 'react';
import { Peserta, Penguji, Kelompok, PenilaianPeserta, AppSettings, AuthUser } from '../types';
import {
  Award,
  Users,
  UserCheck,
  Shield,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileEdit,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { PramukaBadge } from './PramukaBadge';
import { exportRekapitulasiToExcel } from '../utils/exportExcel';

interface DashboardViewProps {
  pesertaList: Peserta[];
  pengujiList: Penguji[];
  kelompokList: Kelompok[];
  penilaianMap: Record<string, PenilaianPeserta>;
  settings: AppSettings;
  currentUser?: AuthUser | null;
  onNavigateToTab: (tab: 'dashboard' | 'peserta' | 'penguji' | 'kelompok' | 'penilaian' | 'rekap') => void;
  onNavigateToNilai: (pesertaId: string) => void;
  onOpenPrintPreview: (pesertaId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  pesertaList,
  pengujiList,
  kelompokList,
  penilaianMap,
  settings,
  currentUser,
  onNavigateToTab,
  onNavigateToNilai,
  onOpenPrintPreview,
}) => {
  const isPenguji = currentUser?.role === 'penguji';
  const totalPeserta = pesertaList.length;
  const sudahDinilaiCount = pesertaList.filter((p) => !!penilaianMap[p.id]).length;
  const lulusList = pesertaList.filter((p) => {
    const pen = penilaianMap[p.id];
    if (!pen) return false;
    const skor = pen.wawancara.reduce((s, w) => s + (w.poin || 0), 0);
    return (skor / 55) * 100 >= 80;
  });
  const belumLulusCount = sudahDinilaiCount - lulusList.length;
  const graduationRate = sudahDinilaiCount > 0 ? ((lulusList.length / sudahDinilaiCount) * 100).toFixed(1) : '0';

  const handleExportAll = () => {
    const rows = pesertaList.map((p) => ({
      peserta: p,
      kelompok: kelompokList.find((k) => k.id === p.kelompokId),
      penilaian: penilaianMap[p.id],
      penguji: penilaianMap[p.id] ? pengujiList.find((pj) => pj.id === penilaianMap[p.id].pengujiId) : undefined,
    }));
    exportRekapitulasiToExcel(rows, settings);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-6 sm:p-8 shadow-xl border border-amber-900/40">
        <div className="absolute right-4 -bottom-6 opacity-15 pointer-events-none transform rotate-12">
          <PramukaBadge
            size={280}
            customLogoUrl={settings.customLogoUrl}
            kwarranText={settings.kwarran || 'KWARRAN KEMRANJEN'}
            year={settings.tahun}
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold tracking-wider uppercase mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>Sistem Penilaian Resmi Garuda Banyumas</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Penilaian Pencapaian Pramuka Garuda
            </h1>
            <p className="text-amber-200/90 font-medium text-sm sm:text-base mt-1">
              {settings.kwarran || 'KWARRAN KEMRANJEN'} • {settings.kwartirCabang} • Tahun {settings.tahun}
            </p>
            <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
              Format penilaian terstandarisasi dengan 14 butir Administrasi (SKU Ramu-Rakit-Terap, TKK 25 macam, hasta karya, surat kelakuan baik) dan 11 butir Wawancara/Bakat (skor maksimal 55, kelulusan minimal 80%).
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateToTab('penilaian')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Mulai Lembar Penilaian</span>
              </button>

              {!isPenguji && (
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 backdrop-blur-xs transition-all border border-white/20 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Ekspor Excel (.xlsx)</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-stone-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-amber-600/30 text-center shrink-0 self-start md:self-center">
            <PramukaBadge
              size={110}
              customLogoUrl={settings.customLogoUrl}
              kwarranText={settings.kwarran || 'KWARRAN KEMRANJEN'}
              year={settings.tahun}
              className="mx-auto"
            />
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mt-2">
              {settings.kwarran || 'KWARRAN KEMRANJEN'}
            </div>
            <div className="text-sm font-black text-white">{settings.kwartirCabang}</div>
            <div className="text-[11px] text-stone-400">Tahun {settings.tahun}</div>
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => {
            if (!isPenguji) {
              onNavigateToTab('peserta');
            } else {
              onNavigateToTab('penilaian');
            }
          }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 hover:border-amber-400 transition-all cursor-pointer group"
          title={isPenguji ? 'Buka Form Penilaian' : 'Kelola Data Peserta'}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Calon</span>
            <Users className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            {totalPeserta}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
            <span>{sudahDinilaiCount} telah diuji</span>
            <span className="text-[11px] font-bold text-amber-700 flex items-center gap-0.5">
              {isPenguji ? 'Nilai' : 'Detail'}
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div
          onClick={() => {
            if (!isPenguji) {
              onNavigateToTab('rekap');
            }
          }}
          className={`bg-white p-5 rounded-2xl shadow-sm border border-stone-200 transition-all ${
            !isPenguji ? 'hover:border-emerald-400 cursor-pointer group' : 'cursor-default'
          }`}
          title={!isPenguji ? 'Buka Rekapitulasi & Ekspor' : 'Statistik Kelulusan'}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Lulus (≥ 80%)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {lulusList.length}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center justify-between">
            <span>Tingkat Kelulusan: {graduationRate}%</span>
            {!isPenguji && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('penguji')}
          className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tim Penguji</span>
            <UserCheck className="w-5 h-5 text-amber-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            {pengujiList.length}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
            <span>Andalan & Pelatih</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('kelompok')}
          className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tim Penilai</span>
            <Shield className="w-5 h-5 text-amber-800 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            {kelompokList.length}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
            <span>Penguji, Andik & Rekap</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          </div>
        </div>
      </div>

      {/* Format Penilaian Explainer Card (Matches uploaded photos) */}
      <div className="bg-linear-to-br from-amber-50 to-orange-50/50 rounded-2xl p-6 border border-amber-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-extrabold text-stone-900 uppercase tracking-wide">
              Format Standar Penilaian Pencapaian Pramuka Garuda (Sesuai Foto)
            </h3>
            <p className="text-xs sm:text-sm text-stone-700 mt-1 leading-relaxed">
              Berdasarkan instrumen Kriteria Kelulusan Pencapaian Pramuka Garuda Kwarcab Banyumas:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white p-4 rounded-xl border border-amber-300/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm text-stone-900">
                    A. ADMINISTRASI (14 Butir)
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Ya / Tidak
                  </span>
                </div>
                <ul className="text-xs text-stone-600 mt-2 space-y-1 list-disc list-inside">
                  <li>SKU Ramu, Rakit, Terap beserta Fotokopi STL (6 butir).</li>
                  <li>SKK 25 TKK (min. 2 Tingkat Utama &amp; 3 Madya) (3 butir).</li>
                  <li>Foto hasta karya sekurang-kurangnya 6 macam (1 butir).</li>
                  <li>Surat keterangan berkelakuan baik: Orang Tua, RT/RW, Pembina Gudep, dan Kamabigus (4 butir).</li>
                </ul>
                <div className="mt-2 text-[11px] text-amber-800 italic">
                  * Butir yang belum lengkap diberi waktu toleransi 3 hari sebelum wawancara.
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-300/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm text-stone-900">
                    B. WAWANCARA &amp; KEMAMPUAN (11 Butir)
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Skala 1 - 5 (Maks. 55)
                  </span>
                </div>
                <ul className="text-xs text-stone-600 mt-2 space-y-1 list-disc list-inside">
                  <li>Perkenalan diri berbahasa Inggris/Internasional.</li>
                  <li>Penjelasan tingkatan TKU &amp; 5 bidang TKK.</li>
                  <li>Arti lambang kiasan Pramuka Garuda &amp; keteladanan.</li>
                  <li>Praktik 2 hasta karya, uji bakat minat, simpul &amp; ikatan.</li>
                  <li>Pemanfaatan IT &amp; publikasi video kegiatan di Instagram.</li>
                </ul>
                <div className="mt-2 text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  Rumus: (Poin / 55) × 100% | LULUS jika tercapai minimal 80% (Skor ≥ 44).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Evaluations Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-stone-900 tracking-wide uppercase">
              Peserta &amp; Penilaian Terbaru
            </h3>
            <p className="text-xs text-stone-500">
              Daftar peserta terkini beserta status kelulusan hasil ujian
            </p>
          </div>

          {!isPenguji ? (
            <button
              type="button"
              onClick={() => onNavigateToTab('rekap')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Semua Rekap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateToTab('penilaian')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Form Penilaian</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                <th className="py-2.5 px-3">NO. PESERTA</th>
                <th className="py-2.5 px-3">NAMA PESERTA</th>
                <th className="py-2.5 px-3">PANGKALAN</th>
                <th className="py-2.5 px-3 text-center">SKOR WAWANCARA</th>
                <th className="py-2.5 px-3 text-center">PERSENTASE</th>
                <th className="py-2.5 px-3 text-center">STATUS</th>
                <th className="py-2.5 px-3 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pesertaList.slice(0, 5).map((p) => {
                const pen = penilaianMap[p.id];
                let skor = 0;
                let pct = 0;
                let isLulus = false;

                if (pen) {
                  skor = pen.wawancara.reduce((s, w) => s + (w.poin || 0), 0);
                  pct = Number(((skor / 55) * 100).toFixed(2));
                  isLulus = pct >= 80;
                }

                return (
                  <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-900 text-xs">
                      {p.nomorPeserta}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-stone-900">
                      {p.nama}
                    </td>
                    <td className="py-3 px-3 text-stone-600 text-xs">
                      {p.pangkalan}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      {pen ? `${skor} / 55` : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      {pen ? `${pct}%` : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {pen ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isLulus
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isLulus ? 'LULUS' : 'BELUM LULUS'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">
                          Belum Dinilai
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigateToNilai(p.id)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          {pen ? 'Edit Nilai' : 'Nilai'}
                        </button>
                        {pen && (
                          <button
                            onClick={() => onOpenPrintPreview(p.id)}
                            className="p-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                            title="Cetak PDF Resmi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
