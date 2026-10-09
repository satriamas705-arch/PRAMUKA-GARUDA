import React, { useState, useEffect } from 'react';
import {
  Peserta,
  Penguji,
  PenilaianPeserta,
  AppSettings,
  ItemAdministrasi,
  ItemWawancara,
  AuthUser,
} from '../types';
import {
  DEFAULT_ADMINISTRASI_TEMPLATE,
  DEFAULT_WAWANCARA_TEMPLATE,
} from '../data/initialData';
import {
  CheckCircle2,
  XCircle,
  Save,
  Printer,
  RotateCcw,
  Sparkles,
  ChevronRight,
  FileSpreadsheet,
  Award,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { exportLembarIndividuToExcel } from '../utils/exportExcel';

interface PenilaianFormProps {
  pesertaList: Peserta[];
  pengujiList: Penguji[];
  penilaianMap: Record<string, PenilaianPeserta>;
  selectedPesertaId: string | null;
  settings: AppSettings;
  currentUser?: AuthUser | null;
  onSavePenilaian: (penilaian: PenilaianPeserta) => void;
  onOpenPrintPreview: (pesertaId: string) => void;
  onSelectPeserta: (pesertaId: string) => void;
}

export const PenilaianForm: React.FC<PenilaianFormProps> = ({
  pesertaList,
  pengujiList,
  penilaianMap,
  selectedPesertaId,
  settings,
  currentUser,
  onSavePenilaian,
  onOpenPrintPreview,
  onSelectPeserta,
}) => {
  const currentPeserta = pesertaList.find((p) => p.id === selectedPesertaId) || pesertaList[0];

  const existingPenilaian = currentPeserta ? penilaianMap[currentPeserta.id] : undefined;

  // Form states
  const defaultPengujiId =
    currentUser?.role === 'penguji' && currentUser.pengujiId
      ? currentUser.pengujiId
      : pengujiList[0]?.id || '';

  const [pengujiId, setPengujiId] = useState<string>(
    existingPenilaian?.pengujiId || defaultPengujiId
  );
  const [tanggal, setTanggal] = useState<string>(
    existingPenilaian?.tanggalPenilaian || settings.tanggalDefault || new Date().toISOString().split('T')[0]
  );
  const [catatanUmum, setCatatanUmum] = useState<string>(existingPenilaian?.catatanUmum || '');

  const [administrasi, setAdministrasi] = useState<ItemAdministrasi[]>(() => {
    if (existingPenilaian?.administrasi) {
      return existingPenilaian.administrasi;
    }
    return DEFAULT_ADMINISTRASI_TEMPLATE.map((item) => ({
      ...item,
      tersedia: false,
      catatan: '',
    }));
  });

  const [wawancara, setWawancara] = useState<ItemWawancara[]>(() => {
    if (existingPenilaian?.wawancara) {
      return existingPenilaian.wawancara;
    }
    return DEFAULT_WAWANCARA_TEMPLATE.map((item) => ({
      ...item,
      poin: 0,
      catatan: '',
    }));
  });

  const [activeTab, setActiveTab] = useState<'administrasi' | 'wawancara' | 'semua'>('semua');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // Synchronize when currentPeserta changes
  useEffect(() => {
    if (!currentPeserta) return;
    const pen = penilaianMap[currentPeserta.id];
    if (pen) {
      setPengujiId(pen.pengujiId || pengujiList[0]?.id || '');
      setTanggal(pen.tanggalPenilaian || settings.tanggalDefault);
      setCatatanUmum(pen.catatanUmum || '');
      setAdministrasi(pen.administrasi);
      setWawancara(pen.wawancara);
    } else {
      setPengujiId(pengujiList[0]?.id || '');
      setTanggal(settings.tanggalDefault);
      setCatatanUmum('');
      setAdministrasi(
        DEFAULT_ADMINISTRASI_TEMPLATE.map((item) => ({
          ...item,
          tersedia: false,
          catatan: '',
        }))
      );
      setWawancara(
        DEFAULT_WAWANCARA_TEMPLATE.map((item) => ({
          ...item,
          poin: 0,
          catatan: '',
        }))
      );
    }
  }, [currentPeserta?.id, penilaianMap, pengujiList, settings.tanggalDefault]);

  // Calculations
  const adminYaCount = administrasi.filter((a) => a.tersedia).length;
  const totalPoinWawancara = wawancara.reduce((sum, w) => sum + (w.poin || 0), 0);
  const persentase = Number(((totalPoinWawancara / 55) * 100).toFixed(2));
  const isLulus = persentase >= 80;

  // Handlers for Administrasi
  const handleToggleAdmin = (id: number, val: boolean) => {
    setAdministrasi((prev) =>
      prev.map((item) => (item.id === id ? { ...item, tersedia: val } : item))
    );
  };

  const handleChangeAdminCatatan = (id: number, text: string) => {
    setAdministrasi((prev) =>
      prev.map((item) => (item.id === id ? { ...item, catatan: text } : item))
    );
  };

  const handleMarkAllAdmin = (val: boolean) => {
    setAdministrasi((prev) =>
      prev.map((item) => ({
        ...item,
        tersedia: val,
        catatan: val ? 'Lengkap & Terverifikasi' : '',
      }))
    );
  };

  // Handlers for Wawancara
  const handleSetPoinWawancara = (id: number, poinVal: number) => {
    setWawancara((prev) =>
      prev.map((item) => (item.id === id ? { ...item, poin: poinVal } : item))
    );
  };

  const handleChangeWawancaraCatatan = (id: number, text: string) => {
    setWawancara((prev) =>
      prev.map((item) => (item.id === id ? { ...item, catatan: text } : item))
    );
  };

  const handleSetAllWawancaraPoin = (poinVal: number) => {
    setWawancara((prev) =>
      prev.map((item) => ({
        ...item,
        poin: poinVal,
      }))
    );
  };

  const handleSave = () => {
    if (!currentPeserta) return;
    const payload: PenilaianPeserta = {
      pesertaId: currentPeserta.id,
      pengujiId,
      tanggalPenilaian: tanggal,
      administrasi,
      wawancara,
      catatanUmum,
      updatedAt: new Date().toISOString(),
    };
    onSavePenilaian(payload);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 3000);
  };

  const handleExportExcel = () => {
    if (!currentPeserta) return;
    const pengujiObj = pengujiList.find((p) => p.id === pengujiId);
    const mockPayload: PenilaianPeserta = {
      pesertaId: currentPeserta.id,
      pengujiId,
      tanggalPenilaian: tanggal,
      administrasi,
      wawancara,
      catatanUmum,
      updatedAt: new Date().toISOString(),
    };
    exportLembarIndividuToExcel(currentPeserta, mockPayload, pengujiObj, settings);
  };

  if (!currentPeserta) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-amber-200 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-stone-800">Belum Ada Data Peserta</h3>
        <p className="text-stone-600 text-sm mt-1">
          Silakan tambahkan data peserta terlebih dahulu di menu Data Peserta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Selector & Participant Identity Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-900/10 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-1.5">
              Pilih Peserta yang Dinilai
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={currentPeserta.id}
                onChange={(e) => onSelectPeserta(e.target.value)}
                className="bg-amber-50/50 border border-amber-300 font-semibold text-stone-900 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-w-[260px]"
              >
                {pesertaList.map((p) => {
                  const hasPen = !!penilaianMap[p.id];
                  return (
                    <option key={p.id} value={p.id}>
                      {p.nomorPeserta} - {p.nama} ({p.pangkalan}) {hasPen ? '✓' : ''}
                    </option>
                  );
                })}
              </select>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg">
                  {currentPeserta.golongan}
                </span>
                <span className="px-2.5 py-1 bg-stone-100 text-stone-700 font-medium rounded-lg">
                  TKU: {currentPeserta.tingkatTKU}
                </span>
                <span className="px-2.5 py-1 bg-stone-100 text-stone-700 font-medium rounded-lg">
                  {currentPeserta.jenisKelamin === 'L' ? 'Putra (L)' : 'Putri (P)'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Examiner & Date pickers */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Tim Penguji
              </label>
              <select
                value={pengujiId}
                onChange={(e) => setPengujiId(e.target.value)}
                className="bg-white border border-stone-300 text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500"
              >
                {pengujiList.map((pj) => (
                  <option key={pj.id} value={pj.id}>
                    {pj.nama} ({pj.jabatan})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Tanggal Ujian
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="bg-white border border-stone-300 text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Live Scorecard Banner */}
        <div className="mt-5 pt-4 border-t border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              1. Berkas Administrasi
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-amber-950">
                {adminYaCount}
              </span>
              <span className="text-xs text-stone-600 font-semibold">/ 14 Butir</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
              {adminYaCount === 14 ? '✓ Semua Terpenuhi' : `${14 - adminYaCount} belum terpenuhi`}
            </span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              2. Poin Wawancara
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-stone-900">
                {totalPoinWawancara}
              </span>
              <span className="text-xs text-stone-600 font-semibold">/ 55 Maks</span>
            </div>
            <span className="text-[11px] text-stone-500 font-medium mt-0.5 block">
              Formula: Poin / 55
            </span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              3. % Pencapaian
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-stone-900">
                {persentase}%
              </span>
            </div>
            <span className="text-[11px] text-stone-600 font-medium mt-0.5 block">
              Target Lulus: Min. 80.00%
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isLulus
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
              Hasil Kelulusan
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {isLulus ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-black text-base sm:text-lg leading-tight">
                {isLulus ? 'LULUS' : 'BELUM LULUS'}
              </span>
            </div>
            <span className="text-[10px] mt-0.5 font-semibold">
              {isLulus ? 'Syarat 80% terpenuhi' : 'Kurang dari 80%'}
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('semua')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'semua'
                  ? 'bg-amber-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Tampilkan Semua
            </button>
            <button
              onClick={() => setActiveTab('administrasi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'administrasi'
                  ? 'bg-amber-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              A. Administrasi ({adminYaCount}/14)
            </button>
            <button
              onClick={() => setActiveTab('wawancara')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'wawancara'
                  ? 'bg-amber-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              B. Wawancara ({totalPoinWawancara}/55)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center gap-1.5 transition-colors border border-stone-200"
              title="Unduh Lembar Ini ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={() => onOpenPrintPreview(currentPeserta.id)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1.5 transition-colors border border-amber-300"
              title="Cetak format asli foto / Simpan PDF"
            >
              <Printer className="w-4 h-4 text-amber-800" />
              <span>Cetak / PDF Resmi</span>
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Penilaian</span>
            </button>
          </div>
        </div>

        {showSavedFeedback && (
          <div className="mt-3 p-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Penilaian untuk {currentPeserta.nama} berhasil disimpan ke database lokal!</span>
          </div>
        )}
      </div>

      {/* ================= SECTION A: ADMINISTRASI ================= */}
      {(activeTab === 'semua' || activeTab === 'administrasi') && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-stone-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm">
                A
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                  A. ADMINISTRASI (14 Butir Penilaian)
                </h3>
                <p className="text-xs text-stone-300">
                  Centang YA jika berkas tersedia, atau TIDAK jika belum lengkap.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAllAdmin(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tandai Semua YA</span>
              </button>
              <button
                type="button"
                onClick={() => handleMarkAllAdmin(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-stone-200 text-stone-700 font-bold bg-stone-50">
                    <th className="py-2.5 px-3 w-12 text-center">NO</th>
                    <th className="py-2.5 px-3">PENCAPAIAN ADMINISTRASI</th>
                    <th className="py-2.5 px-3 w-36 text-center">KETERSEDIAAN DATA</th>
                    <th className="py-2.5 px-3 w-64 sm:w-80">KETERANGAN / CATATAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {administrasi.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        item.tersedia ? 'bg-emerald-50/20' : 'bg-stone-50/30'
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-bold text-stone-500 align-top">
                        {item.id}
                      </td>
                      <td className="py-3 px-3 text-stone-900 font-medium leading-relaxed align-top">
                        {item.pencapaian}
                      </td>
                      <td className="py-3 px-3 text-center align-top">
                        <div className="inline-flex rounded-xl p-1 bg-stone-200/80 border border-stone-300">
                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(item.id, true)}
                            className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                              item.tersedia
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            YA
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(item.id, false)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                              !item.tersedia
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            TIDAK
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3 align-top">
                        <input
                          type="text"
                          value={item.catatan}
                          onChange={(e) => handleChangeAdminCatatan(item.id, e.target.value)}
                          placeholder="Catatan berkas (opsional)..."
                          className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-stone-700 italic flex items-start gap-2">
              <span className="font-bold shrink-0 text-amber-800">Catatan Resmi:</span>
              <span>
                Point - point yang belum terpenuhi diberikan waktu 3 hari sebelum pelaksanaan Wawancara.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION B: WAWANCARA ================= */}
      {(activeTab === 'semua' || activeTab === 'wawancara') && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-stone-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm">
                B
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                  B. WAWANCARA (11 Butir Pencapaian & Keterampilan)
                </h3>
                <p className="text-xs text-stone-300">
                  Skala poin kemampuan: 1 (Sangat Kurang), 2 (Kurang), 3 (Cukup), 4 (Baik), 5 (Sangat Baik).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetAllWawancaraPoin(4)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 transition-colors"
                title="Beri skor 4 (Baik) untuk semua butir"
              >
                <span>Preset Nilai 4</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetAllWawancaraPoin(5)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors"
                title="Beri skor 5 (Sangat Baik) untuk semua butir"
              >
                <span>Preset Nilai 5</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetAllWawancaraPoin(0)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-stone-200 text-stone-700 font-bold bg-stone-50">
                    <th className="py-2.5 px-3 w-12 text-center">NO</th>
                    <th className="py-2.5 px-3">PENCAPAIAN UJI WAWANCARA & BAKAT</th>
                    <th className="py-2.5 px-3 w-56 text-center">POIN KEMAMPUAN (1 - 5)</th>
                    <th className="py-2.5 px-3 w-64 sm:w-80">KETERANGAN / CATATAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {wawancara.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-stone-500 align-top">
                        {item.id}
                      </td>
                      <td className="py-3 px-3 text-stone-900 font-medium leading-relaxed align-top">
                        {item.pencapaian}
                      </td>
                      <td className="py-2 px-3 text-center align-top">
                        <div className="inline-flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-300">
                          {[1, 2, 3, 4, 5].map((scale) => {
                            const isSelected = item.poin === scale;
                            return (
                              <button
                                key={scale}
                                type="button"
                                onClick={() => handleSetPoinWawancara(item.id, scale)}
                                className={`w-8 h-8 rounded-lg font-black text-xs transition-all ${
                                  isSelected
                                    ? scale >= 4
                                      ? 'bg-amber-600 text-white shadow-md scale-105'
                                      : scale === 3
                                      ? 'bg-amber-500 text-white shadow-md'
                                      : 'bg-rose-500 text-white shadow-md'
                                    : 'text-stone-700 hover:bg-stone-200'
                                }`}
                                title={`Nilai ${scale}`}
                              >
                                {scale}
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-1 font-semibold">
                          {item.poin === 1 && 'Sangat Kurang'}
                          {item.poin === 2 && 'Kurang'}
                          {item.poin === 3 && 'Cukup'}
                          {item.poin === 4 && 'Baik'}
                          {item.poin === 5 && 'Sangat Baik'}
                          {item.poin === 0 && 'Belum dinilai'}
                        </div>
                      </td>
                      <td className="py-2 px-3 align-top">
                        <input
                          type="text"
                          value={item.catatan}
                          onChange={(e) => handleChangeWawancaraCatatan(item.id, e.target.value)}
                          placeholder="Catatan penguji saat wawancara..."
                          className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Scale legend */}
            <div className="mt-4 p-3 bg-stone-100 rounded-xl text-xs text-stone-700 font-medium flex flex-wrap gap-4 items-center">
              <span className="font-bold text-stone-900">Keterangan Skala Poin:</span>
              <span>1 = Sangat Kurang</span>
              <span>2 = Kurang</span>
              <span>3 = Cukup</span>
              <span>4 = Baik</span>
              <span>5 = Sangat Baik</span>
            </div>

            {/* General examiner notes */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Catatan Umum Penguji & Rekomendasi:
              </label>
              <textarea
                rows={2}
                value={catatanUmum}
                onChange={(e) => setCatatanUmum(e.target.value)}
                placeholder="Tuliskan rekomendasi atau catatan khusus untuk peserta ini..."
                className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Footer Bottom Save Bar */}
            <div className="mt-5 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-stone-600">
                Formula resmi: <span className="font-bold">({totalPoinWawancara} / 55) × 100% = {persentase}%</span>. Ambang kelulusan: <span className="font-bold text-stone-900">80.00%</span> (min. 44 poin).
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenPrintPreview(currentPeserta.id)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1.5 transition-colors border border-amber-300"
                >
                  <Printer className="w-4 h-4" />
                  <span>Preview Cetak / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 text-sm font-extrabold rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-md shadow-amber-600/25 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Nilai Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
