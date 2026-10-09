import React, { useState, useRef } from 'react';
import { Kelompok, Peserta, Penguji, PenilaianPeserta, AppSettings, AuthUser } from '../types';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  School,
  Award,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  FileUp,
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  exportRekapTimToExcel,
  downloadRekapTimTemplate,
  parseRekapNilaiTimFile,
  exportSemuaTimRekapToExcel,
  ParseRekapTimResult,
} from '../utils/dataIo';
import { DEFAULT_SETTINGS } from '../data/initialData';
import { KopSurat } from './KopSurat';

interface KelompokViewProps {
  kelompokList: Kelompok[];
  pesertaList: Peserta[];
  pengujiList?: Penguji[];
  penilaianMap: Record<string, PenilaianPeserta>;
  settings?: AppSettings;
  currentUser?: AuthUser | null;
  onAddKelompok: (kelompok: Kelompok) => void;
  onUpdateKelompok: (kelompok: Kelompok) => void;
  onDeleteKelompok: (id: string) => void;
  onNavigateToNilai: (pesertaId: string) => void;
  onBatchSavePenilaian?: (newMap: Record<string, PenilaianPeserta>) => void;
  onAssignAndikToKelompok?: (pesertaIds: string[], kelompokId: string) => void;
}

export const KelompokView: React.FC<KelompokViewProps> = ({
  kelompokList,
  pesertaList,
  pengujiList = [],
  penilaianMap,
  settings = DEFAULT_SETTINGS,
  currentUser,
  onAddKelompok,
  onUpdateKelompok,
  onDeleteKelompok,
  onNavigateToNilai,
  onBatchSavePenilaian,
  onAssignAndikToKelompok,
}) => {
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJK, setFilterJK] = useState<'ALL' | 'Putra' | 'Putri'>('ALL');

  // Collapse / Expand list andik per tim
  const [expandedTimIds, setExpandedTimIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    kelompokList.forEach((k) => {
      initial[k.id] = true; // Default expanded
    });
    return initial;
  });

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKelompok, setEditingKelompok] = useState<Kelompok | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Kelompok | null>(null);

  // Form Fields
  const [formNama, setFormNama] = useState('');
  const [formJK, setFormJK] = useState<'Putra' | 'Putri'>('Putra');
  const [formPangkalan, setFormPangkalan] = useState('');
  const [formNamaPenguji, setFormNamaPenguji] = useState('');
  const [selectedPengujiIds, setSelectedPengujiIds] = useState<string[]>([]);
  const [selectedAndikIds, setSelectedAndikIds] = useState<string[]>([]);
  const [formPembina, setFormPembina] = useState('');

  // Modal Impor Rekap Nilai Tim
  const [importTargetTim, setImportTargetTim] = useState<Kelompok | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseRekapTimResult | null>(null);
  const [importNotification, setImportNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Cetak / Preview Rekap Tim
  const [printTargetTim, setPrintTargetTim] = useState<Kelompok | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const toggleExpand = (timId: string) => {
    setExpandedTimIds((prev) => ({
      ...prev,
      [timId]: !prev[timId],
    }));
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingKelompok(null);
    const nextNum = kelompokList.length + 1;
    setFormNama(`Tim Penilai ${nextNum}`);
    setFormJK('Putra');
    setFormPangkalan(pesertaList[0]?.pangkalan || 'SMP Negeri 1 Purwokerto');
    setFormNamaPenguji(
      pengujiList.length > 0 ? pengujiList[0].nama : 'Tim Penguji Pramuka Garuda'
    );
    setSelectedPengujiIds(pengujiList.length > 0 ? [pengujiList[0].id] : []);
    setSelectedAndikIds([]);
    setFormPembina('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (k: Kelompok) => {
    setEditingKelompok(k);
    setFormNama(k.nama);
    setFormJK(k.jenisKelamin || 'Putra');
    setFormPangkalan(k.pangkalan);
    setFormNamaPenguji(k.namaPenguji || '');
    setSelectedPengujiIds(k.pengujiIds || []);
    // Member andik that currently have this kelompokId
    const currentMemberIds = pesertaList
      .filter((p) => p.kelompokId === k.id)
      .map((p) => p.id);
    setSelectedAndikIds(currentMemberIds);
    setFormPembina(k.pembinaPendamping || '');
    setIsModalOpen(true);
  };

  // Penguji toggle in Form
  const handleTogglePenguji = (pj: Penguji) => {
    if (selectedPengujiIds.includes(pj.id)) {
      const nextIds = selectedPengujiIds.filter((id) => id !== pj.id);
      setSelectedPengujiIds(nextIds);
      // Auto-update namaPenguji text
      const nextNames = pengujiList
        .filter((p) => nextIds.includes(p.id))
        .map((p) => p.nama)
        .join(' & ');
      setFormNamaPenguji(nextNames);
    } else {
      const nextIds = [...selectedPengujiIds, pj.id];
      setSelectedPengujiIds(nextIds);
      const nextNames = pengujiList
        .filter((p) => nextIds.includes(p.id))
        .map((p) => p.nama)
        .join(' & ');
      setFormNamaPenguji(nextNames);
    }
  };

  // Andik toggle in Form
  const handleToggleAndik = (pesertaId: string) => {
    if (selectedAndikIds.includes(pesertaId)) {
      setSelectedAndikIds((prev) => prev.filter((id) => id !== pesertaId));
    } else {
      setSelectedAndikIds((prev) => [...prev, pesertaId]);
    }
  };

  // Submit Add / Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    // Get andik names for storage convenience
    const selectedAndikNames = pesertaList
      .filter((p) => selectedAndikIds.includes(p.id))
      .map((p) => p.nama);

    if (editingKelompok) {
      const updated: Kelompok = {
        ...editingKelompok,
        nama: formNama.trim(),
        jenisKelamin: formJK,
        pangkalan: formPangkalan.trim(),
        namaPenguji: formNamaPenguji.trim() || 'Tim Penguji',
        pengujiIds: selectedPengujiIds,
        namaAndik: selectedAndikNames,
        pesertaIds: selectedAndikIds,
        pembinaPendamping: formPembina.trim(),
      };
      onUpdateKelompok(updated);

      if (onAssignAndikToKelompok) {
        onAssignAndikToKelompok(selectedAndikIds, updated.id);
      }
      showToast(`Tim Penilai "${updated.nama}" berhasil diperbarui.`);
    } else {
      const newTimId = `tim-${Date.now()}`;
      const newTim: Kelompok = {
        id: newTimId,
        nama: formNama.trim(),
        jenisKelamin: formJK,
        pangkalan: formPangkalan.trim(),
        namaPenguji: formNamaPenguji.trim() || 'Tim Penguji',
        pengujiIds: selectedPengujiIds,
        namaAndik: selectedAndikNames,
        pesertaIds: selectedAndikIds,
        pembinaPendamping: formPembina.trim(),
      };
      onAddKelompok(newTim);

      if (onAssignAndikToKelompok && selectedAndikIds.length > 0) {
        onAssignAndikToKelompok(selectedAndikIds, newTimId);
      }
      showToast(`Tim Penilai baru "${newTim.nama}" berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  // Handle Export Single Team
  const handleExportSingleTim = (tim: Kelompok) => {
    const andikList = pesertaList.filter((p) => p.kelompokId === tim.id);
    if (andikList.length === 0) {
      showToast(`Perhatian: Belum ada andik terdaftar di ${tim.nama}. Rekap tetap diekspor.`);
    }
    exportRekapTimToExcel(tim, andikList, pengujiList, penilaianMap, settings);
    showToast(`Rekap nilai "${tim.nama}" berhasil diunduh (.xlsx).`);
  };

  // Handle Export All Teams
  const handleExportSemuaTim = () => {
    exportSemuaTimRekapToExcel(
      kelompokList,
      pesertaList,
      pengujiList,
      penilaianMap,
      settings
    );
    showToast(`Rekap seluruh tim penilai (${kelompokList.length} tim) berhasil diunduh (.xlsx).`);
  };

  // Open Import Modal for a Team
  const openImportModal = (tim: Kelompok) => {
    setImportTargetTim(tim);
    setParseResult(null);
    setImportNotification(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download Template for target team
  const handleDownloadTemplate = () => {
    if (!importTargetTim) return;
    const andikList = pesertaList.filter((p) => p.kelompokId === importTargetTim.id);
    downloadRekapTimTemplate(importTargetTim, andikList);
    showToast(`Template nilai untuk ${importTargetTim.nama} berhasil diunduh.`);
  };

  // Handle File Upload for Import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importTargetTim) return;

    setIsParsing(true);
    setImportNotification(null);
    try {
      const andikList = pesertaList.filter((p) => p.kelompokId === importTargetTim.id);
      const result = await parseRekapNilaiTimFile(
        file,
        importTargetTim,
        andikList,
        pengujiList,
        penilaianMap
      );
      setParseResult(result);
      if (result.successCount === 0 && result.errors.length > 0) {
        setImportNotification({
          type: 'error',
          message: 'Gagal memproses file. Pastikan format kolom sesuai dengan template.',
        });
      } else {
        setImportNotification({
          type: 'success',
          message: `Berhasil membaca nilai untuk ${result.successCount} andik dalam ${importTargetTim.nama}.`,
        });
      }
    } catch (err: any) {
      setImportNotification({
        type: 'error',
        message: `Terjadi kesalahan membaca file: ${err.message || 'Format tidak valid'}`,
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Apply Imported Penilaian
  const handleApplyImportedPenilaian = () => {
    if (!parseResult || !onBatchSavePenilaian || !importTargetTim) return;
    onBatchSavePenilaian(parseResult.updatedPenilaian);
    showToast(
      `Sukses! Nilai rekap untuk ${parseResult.successCount} andik di "${importTargetTim.nama}" telah disimpan.`
    );
    setImportTargetTim(null);
    setParseResult(null);
  };

  // Filtered Tim List
  const filteredKelompok = kelompokList.filter((k) => {
    const andikMembers = pesertaList.filter((p) => p.kelompokId === k.id);
    const andikMatch = andikMembers.some((a) =>
      a.nama.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchSearch =
      k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.pangkalan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.namaPenguji && k.namaPenguji.toLowerCase().includes(searchTerm.toLowerCase())) ||
      andikMatch;

    const matchJK =
      filterJK === 'ALL' ||
      k.jenisKelamin === filterJK;

    return matchSearch && matchJK;
  });

  // Calculate Overall Statistics
  const totalAndik = pesertaList.length;
  const totalSudahDinilai = Object.keys(penilaianMap).length;
  const totalLulus = Object.values(penilaianMap).filter((pen) => {
    const skor = pen.wawancara.reduce((s, w) => s + (w.poin || 0), 0);
    return (skor / 55) * 100 >= 80;
  }).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner / Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/10 text-amber-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  Data Tim Penilai
                </h1>
                <p className="text-xs sm:text-sm text-stone-500">
                  Daftar tim penilai resmi, nama tim penguji yang bertugas, nama andik, nama pangkalan, serta ekspor & impor rekap nilai tiap tim.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportSemuaTim}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all"
              title="Unduh rekapitulasi nilai seluruh tim penilai dalam 1 file Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Semua Rekap Tim</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tim Penilai</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-100">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Total Tim Penilai
            </span>
            <div className="text-xl font-black text-stone-900 mt-0.5">
              {kelompokList.length}{' '}
              <span className="text-xs font-semibold text-stone-500">Tim</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100/70">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Tim Penguji Terdaftar
            </span>
            <div className="text-xl font-black text-amber-900 mt-0.5">
              {pengujiList.length}{' '}
              <span className="text-xs font-semibold text-amber-700">Penguji</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100/70">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Total Andik Dikelola
            </span>
            <div className="text-xl font-black text-blue-900 mt-0.5">
              {totalAndik}{' '}
              <span className="text-xs font-semibold text-blue-700">Peserta</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/70">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Kelulusan Tim (Overall)
            </span>
            <div className="text-xl font-black text-emerald-800 mt-0.5">
              {totalLulus} / {totalSudahDinilai}{' '}
              <span className="text-xs font-semibold text-emerald-600">Lulus</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama tim, penguji, andik, atau pangkalan..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['ALL', 'Putra', 'Putri'] as const).map((jk) => (
              <button
                key={jk}
                type="button"
                onClick={() => setFilterJK(jk)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  filterJK === jk
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {jk === 'ALL' ? 'Semua Kategori' : jk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid List of Tim Penilai */}
      {filteredKelompok.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-sm">
          <Shield className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-stone-800 text-base">
            Tidak ada Tim Penilai yang cocok
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            {searchTerm
              ? `Tidak ditemukan tim penilai dengan kata kunci "${searchTerm}". Silakan ubah filter pencarian.`
              : 'Belum ada data tim penilai. Klik tombol "Tambah Tim Penilai" untuk menambahkan tim.'}
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tim Penilai Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredKelompok.map((tim) => {
            const andikMembers = pesertaList.filter((p) => p.kelompokId === tim.id);
            const assessedMembers = andikMembers.filter((p) => !!penilaianMap[p.id]);
            const lulusMembers = andikMembers.filter((p) => {
              const pen = penilaianMap[p.id];
              if (!pen) return false;
              const skor = pen.wawancara.reduce((s, w) => s + (w.poin || 0), 0);
              return (skor / 55) * 100 >= 80;
            });
            const percentAssessed =
              andikMembers.length > 0
                ? Math.round((assessedMembers.length / andikMembers.length) * 100)
                : 0;

            const isExpanded = expandedTimIds[tim.id] !== false;

            return (
              <div
                key={tim.id}
                className="bg-white rounded-3xl shadow-sm border border-stone-200 hover:border-amber-400 transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Team Card Header */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-50 to-amber-50/30 border-b border-stone-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Identitas Utama Tim Penilai */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 shadow-xs ${
                          tim.jenisKelamin === 'Putri'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-stone-900 text-base sm:text-lg">
                            {tim.nama}
                          </h3>
                          <span
                            className={`font-black text-[10px] px-2.5 py-0.5 rounded-full ${
                              tim.jenisKelamin === 'Putri'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {tim.jenisKelamin || 'Satuan Penggalang'}
                          </span>
                        </div>

                        {/* Rincian Pangkalan & Tim Penguji */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 mt-1.5">
                          {/* Nama Pangkalan */}
                          <div className="flex items-center gap-1.5">
                            <School className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="font-semibold text-stone-800">
                              Pangkalan: <span className="font-bold">{tim.pangkalan}</span>
                            </span>
                          </div>

                          {/* Nama Tim Penguji */}
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="font-semibold text-stone-800">
                              Tim Penguji:{' '}
                              <span className="font-bold text-amber-900">
                                {tim.namaPenguji || 'Tim Penguji Pramuka Garuda'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi Edit & Hapus Tim */}
                    <div className="flex items-center gap-1.5 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => openEditModal(tim)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                        title="Edit Tim Penilai"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(tim)}
                        className="p-1.5 hover:bg-rose-100 text-stone-400 hover:text-rose-600 rounded-xl transition-colors"
                        title="Hapus Tim Penilai"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Bar for this Team */}
                  <div className="mt-4 pt-3.5 border-t border-stone-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/80 p-2 rounded-xl border border-stone-200/50">
                      <span className="text-[10px] font-bold text-stone-400 uppercase block">
                        Jumlah Andik
                      </span>
                      <span className="font-black text-stone-900">
                        {andikMembers.length} Peserta
                      </span>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-stone-200/50">
                      <span className="text-[10px] font-bold text-stone-400 uppercase block">
                        Sudah Dinilai
                      </span>
                      <span className="font-black text-blue-700">
                        {assessedMembers.length} / {andikMembers.length} ({percentAssessed}%)
                      </span>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-stone-200/50">
                      <span className="text-[10px] font-bold text-stone-400 uppercase block">
                        Lulus Penilaian
                      </span>
                      <span className="font-black text-emerald-700">
                        {lulusMembers.length} Andik Lulus
                      </span>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-stone-200/50">
                      <span className="text-[10px] font-bold text-stone-400 uppercase block">
                        Pembina Pendamping
                      </span>
                      <span className="font-semibold text-stone-700 truncate block">
                        {tim.pembinaPendamping || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section: Daftar Nama Andik (Peserta) */}
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleExpand(tim.id)}
                      className="flex items-center gap-2 text-xs font-black text-stone-800 uppercase tracking-wider hover:text-amber-700 transition-colors"
                    >
                      <Users className="w-4 h-4 text-amber-600" />
                      <span>Daftar Nama Andik ({andikMembers.length})</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-stone-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(tim)}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Atur / Tambah Andik</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div>
                      {andikMembers.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-400">
                          Belum ada andik yang ditugaskan ke tim ini. Klik{' '}
                          <button
                            type="button"
                            onClick={() => openEditModal(tim)}
                            className="font-bold text-amber-700 hover:underline"
                          >
                            "Atur / Tambah Andik"
                          </button>{' '}
                          untuk memilih andik calon pramuka garuda.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-stone-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-stone-100 text-stone-600 font-extrabold uppercase text-[10px]">
                              <tr>
                                <th className="px-3.5 py-2.5">No</th>
                                <th className="px-3.5 py-2.5">No. Peserta</th>
                                <th className="px-3.5 py-2.5">Nama Lengkap Andik</th>
                                <th className="px-3.5 py-2.5">L/P</th>
                                <th className="px-3.5 py-2.5">Tingkat</th>
                                <th className="px-3.5 py-2.5">Administrasi</th>
                                <th className="px-3.5 py-2.5">Skor Wawancara</th>
                                <th className="px-3.5 py-2.5">Status Nilai</th>
                                <th className="px-3.5 py-2.5 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                              {andikMembers.map((andik, idx) => {
                                const pen = penilaianMap[andik.id];
                                let adminCount = 0;
                                let wawancaraScore = 0;
                                let pct = 0;
                                let isLulus = false;

                                if (pen) {
                                  adminCount = pen.administrasi.filter((a) => a.tersedia).length;
                                  wawancaraScore = pen.wawancara.reduce(
                                    (s, w) => s + (w.poin || 0),
                                    0
                                  );
                                  pct = Number(((wawancaraScore / 55) * 100).toFixed(1));
                                  isLulus = pct >= 80;
                                }

                                return (
                                  <tr
                                    key={andik.id}
                                    className="hover:bg-amber-50/40 transition-colors"
                                  >
                                    <td className="px-3.5 py-2.5 text-stone-400 font-mono">
                                      {idx + 1}
                                    </td>
                                    <td className="px-3.5 py-2.5 font-mono font-bold text-stone-600">
                                      {andik.nomorPeserta}
                                    </td>
                                    <td className="px-3.5 py-2.5 font-bold text-stone-900">
                                      {andik.nama}
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          andik.jenisKelamin === 'L'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {andik.jenisKelamin}
                                      </span>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-stone-600">
                                      {andik.tingkatTKU}
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      {pen ? (
                                        <span
                                          className={`font-semibold ${
                                            adminCount === 14
                                              ? 'text-emerald-700'
                                              : 'text-amber-700'
                                          }`}
                                        >
                                          {adminCount}/14 Ya
                                        </span>
                                      ) : (
                                        <span className="text-stone-400 italic">-</span>
                                      )}
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      {pen ? (
                                        <span className="font-extrabold text-stone-900">
                                          {wawancaraScore}/55{' '}
                                          <span className="text-[11px] font-normal text-stone-500">
                                            ({pct}%)
                                          </span>
                                        </span>
                                      ) : (
                                        <span className="text-stone-400 italic">Belum Diuji</span>
                                      )}
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      {pen ? (
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                                            isLulus
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-rose-100 text-rose-800'
                                          }`}
                                        >
                                          {isLulus ? (
                                            <>
                                              <CheckCircle2 className="w-3 h-3" />
                                              <span>LULUS</span>
                                            </>
                                          ) : (
                                            <>
                                              <XCircle className="w-3 h-3" />
                                              <span>BELUM LULUS</span>
                                            </>
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-stone-400 italic text-[11px]">
                                          Belum Dinilai
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right">
                                      <button
                                        type="button"
                                        onClick={() => onNavigateToNilai(andik.id)}
                                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-[11px] rounded-lg transition-colors border border-amber-200"
                                      >
                                        {pen ? 'Ubah Nilai' : 'Nilai Sekarang'} &rarr;
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Ekspor / Impor Rekap Nilai Tiap Tim */}
                <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-stone-500">
                    <span className="font-bold text-stone-700">Rekap Nilai Tim:</span> Unduh lembar
                    rekap nilai tim ini atau impor nilai dari file Excel.
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Tombol Ekspor Rekap Nilai Tim */}
                    <button
                      type="button"
                      onClick={() => handleExportSingleTim(tim)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                      title={`Ekspor Rekap Nilai ${tim.nama} (.xlsx)`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ekspor Rekap Nilai (.xlsx)</span>
                    </button>

                    {/* Tombol Impor Rekap Nilai Tim */}
                    <button
                      type="button"
                      onClick={() => openImportModal(tim)}
                      className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                      title={`Impor Rekap Nilai ${tim.nama} dari Excel`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Impor Rekap Nilai</span>
                    </button>

                    {/* Tombol Cetak Rekap Tim */}
                    <button
                      type="button"
                      onClick={() => setPrintTargetTim(tim)}
                      className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                      title={`Cetak Berita Acara Rekapitulasi ${tim.nama}`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Rekap</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
       * MODAL 1: ADD / EDIT TIM PENILAI
       * ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 tracking-wide">
                  {editingKelompok ? 'Edit Data Tim Penilai' : 'Tambah Tim Penilai Baru'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Lengkapi identitas nama tim, penguji yang bertugas, andik, dan pangkalan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Nama Tim */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Nama Tim Penilai *
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Tim Penilai 1 (Regu Rajawali Putra)"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Kategori Satuan & Nama Pangkalan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Kategori Satuan
                  </label>
                  <select
                    value={formJK}
                    onChange={(e) => setFormJK(e.target.value as 'Putra' | 'Putri')}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Putra">Putra (Penggalang)</option>
                    <option value="Putri">Putri (Penggalang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Nama Pangkalan Gugus Depan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPangkalan}
                    onChange={(e) => setFormPangkalan(e.target.value)}
                    placeholder="Contoh: SMP Negeri 1 Purwokerto"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Tim Penguji */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Nama Tim Penguji yang Bertugas *
                </label>
                <input
                  type="text"
                  required
                  value={formNamaPenguji}
                  onChange={(e) => setFormNamaPenguji(e.target.value)}
                  placeholder="Nama penguji yang bertugas menilai tim ini"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-amber-900 focus:ring-2 focus:ring-amber-500"
                />

                {/* Checklist Penguji Master */}
                {pengujiList.length > 0 && (
                  <div className="mt-2 p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] font-extrabold text-amber-900 uppercase block mb-1.5">
                      Pilih Cepat dari Master Data Penguji:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {pengujiList.map((pj) => {
                        const isChecked = selectedPengujiIds.includes(pj.id);
                        return (
                          <button
                            key={pj.id}
                            type="button"
                            onClick={() => handleTogglePenguji(pj)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                              isChecked
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-stone-700 border border-stone-200 hover:border-amber-400'
                            }`}
                          >
                            <Check
                              className={`w-3 h-3 ${isChecked ? 'opacity-100' : 'opacity-0'}`}
                            />
                            <span>{pj.nama}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Pilih & Tetapkan Nama Andik */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-800">
                    Tetapkan Nama Andik (Peserta) ke Tim Ini ({selectedAndikIds.length} Dipilih)
                  </label>
                  <span className="text-[10px] text-stone-500">
                    Centang andik yang akan dinilai oleh tim ini
                  </span>
                </div>

                <div className="max-h-44 overflow-y-auto border border-stone-200 rounded-xl p-2 divide-y divide-stone-100 bg-stone-50">
                  {pesertaList.length === 0 ? (
                    <div className="p-3 text-center text-xs text-stone-400 italic">
                      Belum ada peserta terdaftar di aplikasi.
                    </div>
                  ) : (
                    pesertaList.map((p) => {
                      const isSelected = selectedAndikIds.includes(p.id);
                      const currentTim = kelompokList.find((k) => k.id === p.kelompokId);
                      const isAnotherTim = currentTim && currentTim.id !== editingKelompok?.id;

                      return (
                        <label
                          key={p.id}
                          className="flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleAndik(p.id)}
                              className="rounded-md text-amber-600 focus:ring-amber-500 w-4 h-4"
                            />
                            <div>
                              <div className="text-xs font-bold text-stone-900">
                                {p.nama}
                              </div>
                              <div className="text-[10px] text-stone-500">
                                {p.nomorPeserta} • {p.pangkalan}
                              </div>
                            </div>
                          </div>

                          {isAnotherTim && (
                            <span className="text-[9px] font-semibold text-stone-400 bg-stone-200/70 px-1.5 py-0.5 rounded">
                              Saat ini: {currentTim.nama}
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pembina Pendamping */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Nama Pembina Pendamping (Opsional)
                </label>
                <input
                  type="text"
                  value={formPembina}
                  onChange={(e) => setFormPembina(e.target.value)}
                  placeholder="Contoh: Kak Joko Susilo, S.Pd."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="mt-6 pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/20 transition-all"
                >
                  {editingKelompok ? 'Simpan Perubahan' : 'Tambahkan Tim Penilai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
       * MODAL 2: IMPOR REKAP NILAI TIM (TIAP TIM)
       * ======================================================== */}
      {importTargetTim && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 tracking-tight">
                    Impor Rekap Nilai: {importTargetTim.nama}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Pangkalan: {importTargetTim.pangkalan} • Penguji: {importTargetTim.namaPenguji}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportTargetTim(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Petunjuk & Unduh Template */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 text-xs text-blue-950">
                  <span className="font-extrabold block text-sm">
                    Langkah 1: Unduh Format Template Tim Ini
                  </span>
                  <p className="text-blue-800/90 text-xs">
                    Template Excel sudah terisi daftar seluruh andik yang ada di{' '}
                    <span className="font-bold">{importTargetTim.nama}</span>. Anda cukup memasukkan
                    skor wawancara (1-55) dan status administrasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shrink-0 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Template (.xlsx)</span>
                </button>
              </div>

              {/* Upload File Input */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Langkah 2: Pilih File Excel / CSV Hasil Pengisian Nilai
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-stone-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-600 file:text-white hover:file:bg-amber-700 file:cursor-pointer cursor-pointer border border-stone-200 rounded-2xl p-2 bg-stone-50"
                />
              </div>

              {/* Status Parsing */}
              {isParsing && (
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  <span>Sedang memproses dan mencocokkan data nilai andik...</span>
                </div>
              )}

              {/* Notification Banner */}
              {importNotification && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                    importNotification.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {importNotification.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{importNotification.message}</span>
                </div>
              )}

              {/* Preview Tabel Hasil Parse */}
              {parseResult && parseResult.matchedAndik.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-stone-800 uppercase tracking-wider">
                      Pratinjau Nilai Andik ({parseResult.matchedAndik.length} Terdeteksi)
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">
                      Standar Lulus: Skor &ge; 44 (80%)
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto rounded-2xl border border-stone-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-stone-600 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="px-3 py-2">No. Peserta</th>
                          <th className="px-3 py-2">Nama Andik</th>
                          <th className="px-3 py-2">Administrasi</th>
                          <th className="px-3 py-2">Skor Wawancara</th>
                          <th className="px-3 py-2">Nilai Akhir (%)</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium">
                        {parseResult.matchedAndik.map((item) => (
                          <tr key={item.pesertaId} className="hover:bg-stone-50">
                            <td className="px-3 py-2 font-mono font-bold text-stone-600">
                              {item.nomorPeserta}
                            </td>
                            <td className="px-3 py-2 font-bold text-stone-900">{item.nama}</td>
                            <td className="px-3 py-2">
                              {item.adminLengkap ? (
                                <span className="text-emerald-700 font-bold">Lengkap (14/14)</span>
                              ) : (
                                <span className="text-amber-700 font-bold">Belum Lengkap</span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-black text-stone-900">
                              {item.skorWawancara}/55
                            </td>
                            <td className="px-3 py-2 font-bold">{item.persentase}%</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  item.status === 'LULUS'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setImportTargetTim(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm rounded-xl transition-colors"
              >
                Batal
              </button>

              {parseResult && parseResult.matchedAndik.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyImportedPenilaian}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Nilai ke Sistem</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
       * MODAL 3: CETAK / PREVIEW REKAP TIM
       * ======================================================== */}
      {printTargetTim && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 border border-stone-200 animate-in fade-in my-8 max-h-[90vh] overflow-y-auto">
            {/* Header Dialog */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 print:hidden">
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  Pratinjau Berita Acara Rekapitulasi Tim
                </h3>
                <p className="text-xs text-stone-500">
                  {printTargetTim.nama} • {printTargetTim.pangkalan}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintTargetTim(null)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area with Kop Surat */}
            <div className="mt-6 font-serif">
              {/* Kop Surat Resmi */}
              <KopSurat settings={settings} showDoubleBorder={true} />

              <div className="text-center mt-4">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-stone-900 uppercase">
                  BERITA ACARA REKAPITULASI PENILAIAN PRAMUKA GARUDA
                </h2>
                <p className="text-xs font-bold text-stone-700 uppercase mt-0.5">
                  {settings.golongan.toUpperCase()} • TAHUN {settings.tahun}
                </p>
              </div>

              {/* Identitas Tim */}
              <div className="mt-4 p-3 bg-stone-50 rounded-xl text-xs space-y-1 font-sans border border-stone-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block font-bold">
                      Nama Tim Penilai:
                    </span>
                    <span className="font-extrabold text-stone-900">{printTargetTim.nama}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block font-bold">
                      Nama Pangkalan:
                    </span>
                    <span className="font-extrabold text-stone-900">
                      {printTargetTim.pangkalan}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block font-bold">
                      Tim Penguji:
                    </span>
                    <span className="font-extrabold text-stone-900">
                      {printTargetTim.namaPenguji || 'Tim Penguji'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block font-bold">
                      Pembina Pendamping:
                    </span>
                    <span className="font-extrabold text-stone-900">
                      {printTargetTim.pembinaPendamping || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Printable Table */}
              <div className="mt-4 overflow-x-auto font-sans">
                <table className="w-full text-left text-xs border-collapse border border-stone-800">
                  <thead className="bg-stone-100 font-extrabold uppercase text-[10px] text-stone-900">
                    <tr>
                      <th className="border border-stone-800 px-2 py-1.5 text-center">No</th>
                      <th className="border border-stone-800 px-2 py-1.5">No. Peserta</th>
                      <th className="border border-stone-800 px-2 py-1.5">Nama Andik</th>
                      <th className="border border-stone-800 px-2 py-1.5 text-center">L/P</th>
                      <th className="border border-stone-800 px-2 py-1.5 text-center">
                        Administrasi
                      </th>
                      <th className="border border-stone-800 px-2 py-1.5 text-center">
                        Skor Wawancara
                      </th>
                      <th className="border border-stone-800 px-2 py-1.5 text-center">Nilai %</th>
                      <th className="border border-stone-800 px-2 py-1.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {pesertaList
                      .filter((p) => p.kelompokId === printTargetTim.id)
                      .map((andik, idx) => {
                        const pen = penilaianMap[andik.id];
                        let adminCount = 0;
                        let skorW = 0;
                        let pct = 0;
                        let isLulus = false;

                        if (pen) {
                          adminCount = pen.administrasi.filter((a) => a.tersedia).length;
                          skorW = pen.wawancara.reduce((s, w) => s + (w.poin || 0), 0);
                          pct = Number(((skorW / 55) * 100).toFixed(1));
                          isLulus = pct >= 80;
                        }

                        return (
                          <tr key={andik.id} className="text-stone-900">
                            <td className="border border-stone-800 px-2 py-1.5 text-center">
                              {idx + 1}
                            </td>
                            <td className="border border-stone-800 px-2 py-1.5 font-mono">
                              {andik.nomorPeserta}
                            </td>
                            <td className="border border-stone-800 px-2 py-1.5 font-bold">
                              {andik.nama}
                            </td>
                            <td className="border border-stone-800 px-2 py-1.5 text-center">
                              {andik.jenisKelamin}
                            </td>
                            <td className="border border-stone-800 px-2 py-1.5 text-center">
                              {pen ? `${adminCount}/14` : '-'}
                            </td>
                            <td className="border border-stone-800 px-2 py-1.5 text-center font-bold">
                              {pen ? `${skorW}/55` : '-'}
                            </td>
                            <td className="border border-stone-800 px-2 py-1.5 text-center font-bold">
                              {pen ? `${pct}%` : '-'}
                            </td>
                            <td className="border border-stone-800 px-2 py-1.5 text-center font-black">
                              {pen ? (isLulus ? 'LULUS' : 'BELUM LULUS') : 'BELUM UJIAN'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan */}
              <div className="mt-8 grid grid-cols-2 text-center text-xs font-sans">
                <div>
                  <p className="text-stone-500 text-[11px]">Mengetahui,</p>
                  <p className="font-bold text-stone-900 mt-1">Pembina Pendamping Pangkalan</p>
                  <div className="h-16" />
                  <p className="font-bold text-stone-900 underline">
                    {printTargetTim.pembinaPendamping || '...........................................'}
                  </p>
                </div>
                <div>
                  <p className="text-stone-500 text-[11px]">
                    {settings.tempat}, {new Date().toLocaleDateString('id-ID')}
                  </p>
                  <p className="font-bold text-stone-900 mt-1">Tim Penguji Pramuka Garuda</p>
                  <div className="h-16" />
                  <p className="font-bold text-stone-900 underline">
                    {printTargetTim.namaPenguji || 'Tim Penguji'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
       * MODAL 4: DELETE CONFIRMATION
       * ======================================================== */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-center text-stone-900">
              Hapus Data Tim Penilai?
            </h3>
            <p className="text-xs text-stone-600 text-center mt-1">
              Apakah Anda yakin ingin menghapus{' '}
              <span className="font-bold text-stone-900">"{deleteCandidate.nama}"</span>? Data andik
              tidak akan dihapus dari aplikasi.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteKelompok(deleteCandidate.id);
                  setDeleteCandidate(null);
                  showToast(`Tim Penilai "${deleteCandidate.nama}" telah dihapus.`);
                }}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/25 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
