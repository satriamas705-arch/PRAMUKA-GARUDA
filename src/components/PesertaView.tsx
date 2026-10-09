import React, { useState, useRef } from 'react';
import { Peserta, Kelompok, PenilaianPeserta } from '../types';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileEdit,
  Printer,
  School,
  Users,
  Download,
  Upload,
  FileSpreadsheet,
  FileUp,
  AlertCircle,
  AlertTriangle,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  exportPesertaToExcel,
  downloadPesertaTemplate,
  parsePesertaFile,
  ParsePesertaResult,
} from '../utils/dataIo';

interface PesertaViewProps {
  pesertaList: Peserta[];
  kelompokList: Kelompok[];
  penilaianMap: Record<string, PenilaianPeserta>;
  onAddPeserta: (peserta: Peserta) => void;
  onUpdatePeserta: (peserta: Peserta) => void;
  onDeletePeserta: (id: string) => void;
  onBatchImportPeserta?: (newList: Peserta[], mode: 'merge' | 'replace') => void;
  onNavigateToNilai: (pesertaId: string) => void;
  onOpenPrintPreview: (pesertaId: string) => void;
}

export const PesertaView: React.FC<PesertaViewProps> = ({
  pesertaList,
  kelompokList,
  penilaianMap,
  onAddPeserta,
  onUpdatePeserta,
  onDeletePeserta,
  onBatchImportPeserta,
  onNavigateToNilai,
  onOpenPrintPreview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LULUS' | 'BELUM_LULUS' | 'BELUM_DINILAI'>('ALL');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeserta, setEditingPeserta] = useState<Peserta | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Peserta | null>(null);

  // Modal State for Export & Import
  const [isIoModalOpen, setIsIoModalOpen] = useState(false);
  const [ioTab, setIoTab] = useState<'import' | 'export'>('import');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsePesertaResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [formNomor, setFormNomor] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formJK, setFormJK] = useState<'L' | 'P'>('L');
  const [formPangkalan, setFormPangkalan] = useState('');
  const [formGudep, setFormGudep] = useState('');
  const [formKelompokId, setFormKelompokId] = useState('');
  const [formGolongan, setFormGolongan] = useState<'Penggalang' | 'Siaga' | 'Penegak' | 'Pandega'>('Penggalang');
  const [formTingkatTKU, setFormTingkatTKU] = useState<'Ramu' | 'Rakit' | 'Terap' | 'Bantara' | 'Laksana' | 'Mula' | 'Bantu' | 'Tata'>('Terap');
  const [formHp, setFormHp] = useState('');
  const [formPembina, setFormPembina] = useState('');

  const openAddModal = () => {
    setEditingPeserta(null);
    const nextNum = (pesertaList.length + 1).toString().padStart(2, '0');
    setFormNomor(`PG-${nextNum}/BMS/2026`);
    setFormNama('');
    setFormJK('L');
    setFormPangkalan('SMP Negeri 1 Purwokerto');
    setFormGudep('02.001 - 02.002');
    setFormKelompokId(kelompokList[0]?.id || '');
    setFormGolongan('Penggalang');
    setFormTingkatTKU('Terap');
    setFormHp('');
    setFormPembina('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Peserta) => {
    setEditingPeserta(p);
    setFormNomor(p.nomorPeserta);
    setFormNama(p.nama);
    setFormJK(p.jenisKelamin);
    setFormPangkalan(p.pangkalan);
    setFormGudep(p.gudep || '');
    setFormKelompokId(p.kelompokId || '');
    setFormGolongan(p.golongan);
    setFormTingkatTKU(p.tingkatTKU);
    setFormHp(p.kontakHp || '');
    setFormPembina(p.namaPembina || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formNomor.trim()) return;

    if (editingPeserta) {
      onUpdatePeserta({
        ...editingPeserta,
        nomorPeserta: formNomor,
        nama: formNama,
        jenisKelamin: formJK,
        pangkalan: formPangkalan,
        gudep: formGudep,
        kelompokId: formKelompokId,
        golongan: formGolongan,
        tingkatTKU: formTingkatTKU,
        kontakHp: formHp,
        namaPembina: formPembina,
      });
    } else {
      const newPeserta: Peserta = {
        id: `peserta-${Date.now()}`,
        nomorPeserta: formNomor,
        nama: formNama,
        jenisKelamin: formJK,
        pangkalan: formPangkalan,
        gudep: formGudep,
        kelompokId: formKelompokId,
        golongan: formGolongan,
        tingkatTKU: formTingkatTKU,
        kontakHp: formHp,
        namaPembina: formPembina,
      };
      onAddPeserta(newPeserta);
    }
    setIsModalOpen(false);
  };

  // Filtered List
  const filteredList = pesertaList.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nomorPeserta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pangkalan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchKelompok =
      filterKelompok === 'ALL' || p.kelompokId === filterKelompok;

    const pen = penilaianMap[p.id];
    let matchStatus = true;
    if (filterStatus === 'BELUM_DINILAI') {
      matchStatus = !pen;
    } else if (filterStatus === 'LULUS') {
      if (!pen) matchStatus = false;
      else {
        const skor = pen.wawancara.reduce((sum, w) => sum + (w.poin || 0), 0);
        matchStatus = (skor / 55) * 100 >= 80;
      }
    } else if (filterStatus === 'BELUM_LULUS') {
      if (!pen) matchStatus = false;
      else {
        const skor = pen.wawancara.reduce((sum, w) => sum + (w.poin || 0), 0);
        matchStatus = (skor / 55) * 100 < 80;
      }
    }

    return matchSearch && matchKelompok && matchStatus;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseResult(null);
    try {
      const res = await parsePesertaFile(file, kelompokList);
      setParseResult(res);
    } catch (err: any) {
      setParseResult({
        valid: [],
        errors: [`Gagal membaca berkas: ${err?.message || 'Format tidak didukung'}`],
        totalParsed: 0,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyImport = () => {
    if (!parseResult || parseResult.valid.length === 0) return;

    if (onBatchImportPeserta) {
      onBatchImportPeserta(parseResult.valid, importMode);
    } else {
      parseResult.valid.forEach((p) => onAddPeserta(p));
    }

    setImportNotification(
      `Berhasil mengimpor ${parseResult.valid.length} data peserta ke dalam sistem (${
        importMode === 'merge' ? 'Gabung / Perbarui' : 'Ganti Total'
      }).`
    );
    setTimeout(() => setImportNotification(null), 5000);

    setIsIoModalOpen(false);
    setParseResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Import / Action Notification */}
      {importNotification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{importNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportNotification(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top action bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-stone-900 tracking-wide uppercase">
            Data Peserta Uji Garuda
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kelola data calon Pramuka Garuda Banyumas (Total: {pesertaList.length} Peserta)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export / Import Button */}
          <button
            type="button"
            onClick={() => {
              setIoTab('export');
              setIsIoModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 border border-stone-200 hover:border-emerald-300 transition-all cursor-pointer"
            title="Ekspor Data Peserta ke Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIoTab('import');
              setParseResult(null);
              setIsIoModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-stone-100 hover:bg-indigo-50 hover:text-indigo-800 text-stone-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 border border-stone-200 hover:border-indigo-300 transition-all cursor-pointer"
            title="Impor Data Peserta dari Excel / CSV"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Impor</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Peserta Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, nomor peserta, pangkalan..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Filter className="w-3.5 h-3.5 text-amber-700" />
            <span className="font-semibold">Regu:</span>
            <select
              value={filterKelompok}
              onChange={(e) => setFilterKelompok(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 font-medium"
            >
              <option value="ALL">Semua Regu</option>
              {kelompokList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <span className="font-semibold">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="LULUS">Lulus (≥ 80%)</option>
              <option value="BELUM_LULUS">Belum Lulus (&lt; 80%)</option>
              <option value="BELUM_DINILAI">Belum Dinilai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participant Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                <th className="py-3 px-3 w-12 text-center">NO</th>
                <th className="py-3 px-3">NO. PESERTA</th>
                <th className="py-3 px-3">NAMA PESERTA</th>
                <th className="py-3 px-3">PANGKALAN & GUDEP</th>
                <th className="py-3 px-3">REGU / KELOMPOK</th>
                <th className="py-3 px-3 text-center">NILAI & STATUS</th>
                <th className="py-3 px-3 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400 italic">
                    Tidak ditemukan peserta yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((p, idx) => {
                  const kel = kelompokList.find((k) => k.id === p.kelompokId);
                  const pen = penilaianMap[p.id];
                  let skorWawancara = 0;
                  let persentase = 0;
                  let isLulus = false;

                  if (pen) {
                    skorWawancara = pen.wawancara.reduce((sum, w) => sum + (w.poin || 0), 0);
                    persentase = Number(((skorWawancara / 55) * 100).toFixed(2));
                    isLulus = persentase >= 80;
                  }

                  return (
                    <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3.5 px-3 text-center font-bold text-stone-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-amber-900 text-xs">
                        {p.nomorPeserta}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-stone-900">{p.nama}</div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                          <span>{p.jenisKelamin === 'L' ? 'Putra (L)' : 'Putri (P)'}</span>
                          <span>•</span>
                          <span>TKU: {p.tingkatTKU}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-stone-800">{p.pangkalan}</div>
                        <div className="text-[11px] text-stone-500">
                          {p.gudep ? `Gudep: ${p.gudep}` : 'Gudep Belum Diisi'}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        {kel ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-medium text-xs">
                            {kel.nama}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {pen ? (
                          <div>
                            <div className="font-extrabold text-stone-900 text-sm">
                              {skorWawancara}/55{' '}
                              <span className="text-xs font-semibold text-stone-600">
                                ({persentase}%)
                              </span>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-black ${
                                isLulus
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isLulus ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> LULUS
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> BELUM LULUS
                                </>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 bg-stone-100 text-stone-500 text-[11px] font-semibold rounded-lg">
                            Belum Dinilai
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigateToNilai(p.id)}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                            title="Buka Form Penilaian"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>Nilai</span>
                          </button>

                          {pen && (
                            <button
                              onClick={() => onOpenPrintPreview(p.id)}
                              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                              title="Cetak Lembar Resmi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                            title="Edit Data Peserta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteCandidate(p)}
                            className="p-1.5 bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Hapus Peserta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-stone-900 tracking-wide uppercase mb-4 pb-2 border-b border-stone-200">
              {editingPeserta ? 'Edit Data Peserta' : 'Tambah Peserta Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nomor Peserta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNomor}
                    onChange={(e) => setFormNomor(e.target.value)}
                    placeholder="PG-01/BMS/2026"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formJK}
                    onChange={(e) => setFormJK(e.target.value as 'L' | 'P')}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="L">Laki-laki (Putra)</option>
                    <option value="P">Perempuan (Putri)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nama Lengkap Peserta *
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Satria Pratama"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Pangkalan / Sekolah *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPangkalan}
                    onChange={(e) => setFormPangkalan(e.target.value)}
                    placeholder="Contoh: SMP Negeri 1 Purwokerto"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nomor Gudep
                  </label>
                  <input
                    type="text"
                    value={formGudep}
                    onChange={(e) => setFormGudep(e.target.value)}
                    placeholder="02.001 - 02.002"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Regu / Kelompok
                  </label>
                  <select
                    value={formKelompokId}
                    onChange={(e) => setFormKelompokId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- Tanpa Regu --</option>
                    {kelompokList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tingkat TKU Terakhir
                  </label>
                  <select
                    value={formTingkatTKU}
                    onChange={(e) => setFormTingkatTKU(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 font-semibold"
                  >
                    <option value="Terap">Penggalang Terap (Syarat Garuda)</option>
                    <option value="Rakit">Penggalang Rakit</option>
                    <option value="Ramu">Penggalang Ramu</option>
                    <option value="Tata">Siaga Tata</option>
                    <option value="Laksana">Penegak Laksana</option>
                    <option value="Bantara">Penegak Bantara</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kontak HP / WA Peserta
                  </label>
                  <input
                    type="text"
                    value={formHp}
                    onChange={(e) => setFormHp(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Pembina Pendamping
                  </label>
                  <input
                    type="text"
                    value={formPembina}
                    onChange={(e) => setFormPembina(e.target.value)}
                    placeholder="Nama Pembina Gudep"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/20 transition-all"
                >
                  {editingPeserta ? 'Simpan Perubahan' : 'Tambahkan Peserta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-center text-stone-900">
              Hapus Data Peserta?
            </h3>
            <p className="text-xs text-stone-600 text-center mt-1">
              Apakah Anda yakin ingin menghapus calon peserta{' '}
              <span className="font-bold text-stone-900">"{deleteCandidate.nama}"</span> ({deleteCandidate.nomorPeserta})? Tindakan ini tidak dapat dibatalkan.
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
                  onDeletePeserta(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/25 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ekspor & Impor Data Peserta Modal */}
      {isIoModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-stone-200 my-8 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    Ekspor &amp; Impor Data Peserta
                  </h3>
                  <p className="text-xs text-stone-500">
                    Unggah atau unduh berkas spreadsheet Excel (.xlsx) / CSV
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsIoModalOpen(false);
                  setParseResult(null);
                }}
                className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-stone-100 border border-stone-200 mt-4 mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setIoTab('import')}
                className={`py-2 px-3 text-xs sm:text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  ioTab === 'import'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Impor dari Excel / CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setIoTab('export')}
                className={`py-2 px-3 text-xs sm:text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  ioTab === 'export'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Ekspor ke Excel</span>
              </button>
            </div>

            {/* Modal Tab Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {ioTab === 'import' ? (
                <div className="space-y-4">
                  {/* Template download notice */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                        <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                        <span>Unduh Format Template Resmi</span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        Gunakan susunan kolom standar: No Peserta, Nama, L/P, Pangkalan, Gudep, Regu, Golongan, TKU, HP, Pembina.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={downloadPesertaTemplate}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Template (.xlsx)</span>
                    </button>
                  </div>

                  {/* File Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-stone-50/50 hover:bg-amber-50/30"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-stone-800">
                      Klik untuk memilih berkas Excel atau CSV
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      Mendukung format .xlsx, .xls, dan .csv
                    </div>
                  </div>

                  {isParsing && (
                    <div className="p-4 rounded-xl bg-stone-100 text-center text-xs font-semibold text-stone-600 animate-pulse">
                      Membaca dan memproses berkas spreadsheet...
                    </div>
                  )}

                  {/* Parse Results Preview */}
                  {parseResult && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-stone-700">
                          Pratinjau Data ({parseResult.valid.length} Peserta Terbaca)
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Siap Diimpor
                        </span>
                      </div>

                      {parseResult.errors.length > 0 && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                          <div className="font-bold flex items-center gap-1 text-rose-900">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Peringatan / Catatan Baris:</span>
                          </div>
                          <ul className="list-disc list-inside text-[11px] space-y-0.5 max-h-24 overflow-y-auto">
                            {parseResult.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Preview Table */}
                      <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-stone-100 text-stone-700 sticky top-0">
                            <tr>
                              <th className="py-2 px-2.5">NO</th>
                              <th className="py-2 px-2.5">NO. PESERTA</th>
                              <th className="py-2 px-2.5">NAMA</th>
                              <th className="py-2 px-2.5">L/P</th>
                              <th className="py-2 px-2.5">PANGKALAN</th>
                              <th className="py-2 px-2.5">TKU</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {parseResult.valid.slice(0, 8).map((p, idx) => (
                              <tr key={p.id} className="hover:bg-amber-50/20">
                                <td className="py-1.5 px-2.5 text-stone-500">{idx + 1}</td>
                                <td className="py-1.5 px-2.5 font-mono font-bold text-amber-900">
                                  {p.nomorPeserta}
                                </td>
                                <td className="py-1.5 px-2.5 font-bold text-stone-900">{p.nama}</td>
                                <td className="py-1.5 px-2.5">{p.jenisKelamin}</td>
                                <td className="py-1.5 px-2.5 text-stone-600">{p.pangkalan}</td>
                                <td className="py-1.5 px-2.5 font-semibold text-stone-700">
                                  {p.tingkatTKU}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {parseResult.valid.length > 8 && (
                        <div className="text-[10px] text-stone-500 text-center italic">
                          Menampilkan 8 dari total {parseResult.valid.length} peserta yang siap diimpor.
                        </div>
                      )}

                      {/* Import Mode Selector */}
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                        <div className="text-xs font-bold text-stone-700">Pilih Mode Impor:</div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                            <input
                              type="radio"
                              name="pesertaImportMode"
                              checked={importMode === 'merge'}
                              onChange={() => setImportMode('merge')}
                              className="text-amber-600 focus:ring-amber-500"
                            />
                            <span>
                              <strong>Gabungkan &amp; Perbarui (Merge)</strong> — Tambahkan ke data yang sudah ada dan perbarui jika nomor peserta sama.
                            </span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                            <input
                              type="radio"
                              name="pesertaImportMode"
                              checked={importMode === 'replace'}
                              onChange={() => setImportMode('replace')}
                              className="text-amber-600 focus:ring-amber-500"
                            />
                            <span>
                              <strong>Ganti Total (Replace All)</strong> — Hapus data peserta saat ini dan ganti seluruhnya dengan data berkas ini.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Export Tab */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                    <div className="font-extrabold text-sm text-stone-900">
                      Ekspor Laporan &amp; Data Peserta ke Spreadsheet
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Unduh seluruh basis data peserta dalam format Excel (.xlsx) lengkap dengan informasi pangkalan, regu, nomor gudep, kontak pembina, dan status penilaian terkini.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-white border border-stone-200 text-center">
                        <div className="text-2xl font-black text-stone-900">{pesertaList.length}</div>
                        <div className="text-[11px] text-stone-500 font-bold uppercase mt-0.5">
                          Total Seluruh Peserta
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-stone-200 text-center">
                        <div className="text-2xl font-black text-amber-700">{filteredList.length}</div>
                        <div className="text-[11px] text-stone-500 font-bold uppercase mt-0.5">
                          Sesuai Filter Aktif
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => exportPesertaToExcel(pesertaList, kelompokList, penilaianMap)}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Seluruh Data ({pesertaList.length} Peserta)</span>
                    </button>

                    {filteredList.length !== pesertaList.length && (
                      <button
                        type="button"
                        onClick={() => exportPesertaToExcel(filteredList, kelompokList, penilaianMap, 'Data_Peserta_Tersaring.xlsx')}
                        className="py-3 px-4 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh Hasil Filter ({filteredList.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={downloadPesertaTemplate}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center justify-center gap-1 mx-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Format Template Kosong (.xlsx)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsIoModalOpen(false);
                  setParseResult(null);
                }}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>

              {ioTab === 'import' && parseResult && parseResult.valid.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan Impor ({parseResult.valid.length} Peserta)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
