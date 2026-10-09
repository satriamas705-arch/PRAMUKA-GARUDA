import React, { useState, useEffect } from 'react';
import {
  Peserta,
  Penguji,
  Kelompok,
  PenilaianPeserta,
  AppSettings,
  AuthUser,
} from './types';
import {
  loadPeserta,
  savePeserta,
  loadPenguji,
  savePenguji,
  loadKelompok,
  saveKelompok,
  loadPenilaian,
  savePenilaian,
  loadSettings,
  saveSettings,
  resetAllDataToDefault,
} from './utils/storage';
import { loadCurrentAuthUser, saveCurrentAuthUser, clearAuthUser } from './utils/auth';
import {
  DEFAULT_ADMINISTRASI_TEMPLATE,
  DEFAULT_WAWANCARA_TEMPLATE,
} from './data/initialData';
import { Sidebar, TopHeader, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PesertaView } from './components/PesertaView';
import { PengujiView } from './components/PengujiView';
import { KelompokView } from './components/KelompokView';
import { PenilaianForm } from './components/PenilaianForm';
import { RekapitulasiView } from './components/RekapitulasiView';
import { LembarPenilaianPrint } from './components/LembarPenilaianPrint';
import { SettingsModal } from './components/SettingsModal';
import { LoginForm } from './components/LoginForm';
import { LogOut, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Application State
  const [pesertaList, setPesertaList] = useState<Peserta[]>(() => loadPeserta());
  const [pengujiList, setPengujiList] = useState<Penguji[]>(() => loadPenguji());
  const [kelompokList, setKelompokList] = useState<Kelompok[]>(() => loadKelompok());
  const [penilaianMap, setPenilaianMap] = useState<Record<string, PenilaianPeserta>>(() =>
    loadPenilaian()
  );
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => loadCurrentAuthUser());

  // Interactive / Modal States
  const [selectedPesertaId, setSelectedPesertaId] = useState<string | null>(() => {
    const list = loadPeserta();
    return list.length > 0 ? list[0].id : null;
  });
  const [printPesertaId, setPrintPesertaId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    savePeserta(pesertaList);
  }, [pesertaList]);

  useEffect(() => {
    savePenguji(pengujiList);
  }, [pengujiList]);

  useEffect(() => {
    saveKelompok(kelompokList);
  }, [kelompokList]);

  useEffect(() => {
    savePenilaian(penilaianMap);
  }, [penilaianMap]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Strict role-based navigation guard
  // Penguji only has access to: dashboard, form penilaian, data penguji, and data kelompok
  useEffect(() => {
    if (currentUser?.role === 'penguji') {
      const allowedTabs: NavTab[] = ['dashboard', 'penilaian', 'penguji', 'kelompok'];
      if (!allowedTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser, activeTab]);

  const handleSelectTab = (tab: NavTab) => {
    if (currentUser?.role === 'penguji') {
      const allowedTabs: NavTab[] = ['dashboard', 'penilaian', 'penguji', 'kelompok'];
      if (!allowedTabs.includes(tab)) {
        setActiveTab('dashboard');
        return;
      }
    }
    setActiveTab(tab);
  };

  // Auth Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    saveCurrentAuthUser(user);
    if (user.role === 'penguji') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    try {
      clearAuthUser();
      saveCurrentAuthUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    setIsLogoutModalOpen(false);
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Peserta Handlers
  const handleAddPeserta = (p: Peserta) => {
    setPesertaList((prev) => [p, ...prev]);
    setSelectedPesertaId(p.id);
  };

  const handleUpdatePeserta = (p: Peserta) => {
    setPesertaList((prev) => prev.map((item) => (item.id === p.id ? p : item)));
  };

  const handleDeletePeserta = (id: string) => {
    setPesertaList((prev) => prev.filter((p) => p.id !== id));
    setPenilaianMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (selectedPesertaId === id) {
      const remaining = pesertaList.filter((p) => p.id !== id);
      setSelectedPesertaId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleBatchImportPeserta = (newList: Peserta[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setPesertaList(newList);
      setSelectedPesertaId(newList.length > 0 ? newList[0].id : null);
    } else {
      setPesertaList((prev) => {
        const updated = [...prev];
        newList.forEach((newP) => {
          const idx = updated.findIndex(
            (p) => p.nomorPeserta.trim().toLowerCase() === newP.nomorPeserta.trim().toLowerCase()
          );
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], ...newP, id: updated[idx].id };
          } else {
            updated.push(newP);
          }
        });
        return updated;
      });
      if (newList.length > 0 && !selectedPesertaId) {
        setSelectedPesertaId(newList[0].id);
      }
    }
  };

  // Penguji Handlers
  const handleAddPenguji = (pj: Penguji) => {
    setPengujiList((prev) => [...prev, pj]);
  };

  const handleUpdatePenguji = (pj: Penguji) => {
    setPengujiList((prev) => prev.map((item) => (item.id === pj.id ? pj : item)));
  };

  const handleDeletePenguji = (id: string) => {
    setPengujiList((prev) => prev.filter((pj) => pj.id !== id));
  };

  const handleBatchImportPenguji = (newList: Penguji[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setPengujiList(newList);
    } else {
      setPengujiList((prev) => {
        const updated = [...prev];
        newList.forEach((newP) => {
          const idx = updated.findIndex(
            (p) =>
              (p.nipNta && newP.nipNta && p.nipNta.trim().toLowerCase() === newP.nipNta.trim().toLowerCase()) ||
              p.nama.trim().toLowerCase() === newP.nama.trim().toLowerCase()
          );
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], ...newP, id: updated[idx].id };
          } else {
            updated.push(newP);
          }
        });
        return updated;
      });
    }
  };

  // Kelompok Handlers
  const handleAddKelompok = (k: Kelompok) => {
    setKelompokList((prev) => [...prev, k]);
  };

  const handleUpdateKelompok = (k: Kelompok) => {
    setKelompokList((prev) => prev.map((item) => (item.id === k.id ? k : item)));
  };

  const handleDeleteKelompok = (id: string) => {
    setKelompokList((prev) => prev.filter((k) => k.id !== id));
  };

  const handleAssignAndikToKelompok = (pesertaIds: string[], kelompokId: string) => {
    setPesertaList((prev) =>
      prev.map((p) => {
        if (pesertaIds.includes(p.id)) {
          return { ...p, kelompokId };
        }
        if (p.kelompokId === kelompokId && !pesertaIds.includes(p.id)) {
          return { ...p, kelompokId: undefined };
        }
        return p;
      })
    );
  };

  // Penilaian Handlers
  const handleSavePenilaian = (pen: PenilaianPeserta) => {
    setPenilaianMap((prev) => ({
      ...prev,
      [pen.pesertaId]: pen,
    }));
  };

  const handleBatchSavePenilaian = (newMap: Record<string, PenilaianPeserta>) => {
    setPenilaianMap((prev) => ({
      ...prev,
      ...newMap,
    }));
  };

  // Navigation shortcuts
  const handleNavigateToNilai = (pesertaId: string) => {
    setSelectedPesertaId(pesertaId);
    setActiveTab('penilaian');
  };

  const handleOpenPrintPreview = (pesertaId: string) => {
    setPrintPesertaId(pesertaId);
  };

  const handleResetData = () => {
    resetAllDataToDefault();
    setPesertaList(loadPeserta());
    setPengujiList(loadPenguji());
    setKelompokList(loadKelompok());
    setPenilaianMap(loadPenilaian());
    setSettings(loadSettings());
    setIsSettingsOpen(false);
  };

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return (
      <LoginForm
        pengujiList={pengujiList}
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Participant for print preview
  const printPeserta = printPesertaId
    ? pesertaList.find((p) => p.id === printPesertaId)
    : null;
  const printPenilaian = printPesertaId
    ? penilaianMap[printPesertaId] || {
        pesertaId: printPesertaId,
        pengujiId: pengujiList[0]?.id || '',
        tanggalPenilaian: settings.tanggalDefault || new Date().toISOString().split('T')[0],
        administrasi: DEFAULT_ADMINISTRASI_TEMPLATE.map((item) => ({
          ...item,
          tersedia: false,
          catatan: '',
        })),
        wawancara: DEFAULT_WAWANCARA_TEMPLATE.map((item) => ({
          ...item,
          poin: 0,
          catatan: '',
        })),
        catatanUmum: '',
        updatedAt: new Date().toISOString(),
      }
    : null;
  const printPenguji = printPenilaian?.pengujiId
    ? pengujiList.find((pj) => pj.id === printPenilaian.pengujiId) || pengujiList[0]
    : pengujiList[0];
  const printKelompok = printPeserta
    ? kelompokList.find((k) => k.id === printPeserta.kelompokId)
    : undefined;

  const sudahDinilaiCount = Object.keys(penilaianMap).length;

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex font-sans">
      {/* Sidebar: Menu di Samping Kiri */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        settings={settings}
        pesertaCount={pesertaList.length}
        sudahDinilaiCount={sudahDinilaiCount}
        currentUser={currentUser}
        onOpenSettings={() => {
          if (currentUser.role === 'admin') {
            setIsSettingsOpen(true);
          }
        }}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Kolom Konten Utama: Header Atas (Nama & Logout) + Main View */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          activeTab={activeTab}
          currentUser={currentUser}
          settings={settings}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onTriggerLogout={() => setIsLogoutModalOpen(true)}
          onOpenSettings={() => {
            if (currentUser.role === 'admin') {
              setIsSettingsOpen(true);
            }
          }}
        />

        {/* Main Content Area (hidden during print when printPesertaId modal is active) */}
        <main
          className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 ${
            printPesertaId ? 'print:hidden' : ''
          }`}
        >
        {activeTab === 'dashboard' && (
          <DashboardView
            pesertaList={pesertaList}
            pengujiList={pengujiList}
            kelompokList={kelompokList}
            penilaianMap={penilaianMap}
            settings={settings}
            currentUser={currentUser}
            onNavigateToTab={handleSelectTab}
            onNavigateToNilai={handleNavigateToNilai}
            onOpenPrintPreview={handleOpenPrintPreview}
          />
        )}

        {activeTab === 'penilaian' && (
          <PenilaianForm
            pesertaList={pesertaList}
            pengujiList={pengujiList}
            penilaianMap={penilaianMap}
            selectedPesertaId={selectedPesertaId}
            settings={settings}
            currentUser={currentUser}
            onSavePenilaian={handleSavePenilaian}
            onOpenPrintPreview={handleOpenPrintPreview}
            onSelectPeserta={setSelectedPesertaId}
          />
        )}

        {/* Data Peserta: STRICTLY ADMIN ONLY */}
        {activeTab === 'peserta' && currentUser.role === 'admin' && (
          <PesertaView
            pesertaList={pesertaList}
            kelompokList={kelompokList}
            penilaianMap={penilaianMap}
            onAddPeserta={handleAddPeserta}
            onUpdatePeserta={handleUpdatePeserta}
            onDeletePeserta={handleDeletePeserta}
            onBatchImportPeserta={handleBatchImportPeserta}
            onNavigateToNilai={handleNavigateToNilai}
            onOpenPrintPreview={handleOpenPrintPreview}
          />
        )}

        {activeTab === 'penguji' && (
          <PengujiView
            pengujiList={pengujiList}
            penilaianMap={penilaianMap}
            currentUser={currentUser}
            onAddPenguji={handleAddPenguji}
            onUpdatePenguji={handleUpdatePenguji}
            onDeletePenguji={handleDeletePenguji}
            onBatchImportPenguji={handleBatchImportPenguji}
          />
        )}

        {activeTab === 'kelompok' && (
          <KelompokView
            kelompokList={kelompokList}
            pesertaList={pesertaList}
            pengujiList={pengujiList}
            penilaianMap={penilaianMap}
            settings={settings}
            currentUser={currentUser}
            onAddKelompok={handleAddKelompok}
            onUpdateKelompok={handleUpdateKelompok}
            onDeleteKelompok={handleDeleteKelompok}
            onNavigateToNilai={handleNavigateToNilai}
            onBatchSavePenilaian={handleBatchSavePenilaian}
            onAssignAndikToKelompok={handleAssignAndikToKelompok}
          />
        )}

        {/* Rekapitulasi & Ekspor: STRICTLY ADMIN ONLY */}
        {activeTab === 'rekap' && currentUser.role === 'admin' && (
          <RekapitulasiView
            pesertaList={pesertaList}
            pengujiList={pengujiList}
            kelompokList={kelompokList}
            penilaianMap={penilaianMap}
            settings={settings}
            onOpenPrintPreview={handleOpenPrintPreview}
            onNavigateToNilai={handleNavigateToNilai}
          />
        )}

        {/* Fallback if a penguji somehow accesses unauthorized tabs */}
        {(activeTab === 'peserta' || activeTab === 'rekap') && currentUser.role === 'penguji' && (
          <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center max-w-lg mx-auto my-12 shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-stone-900">Akses Dibatasi</h2>
            <p className="text-xs text-stone-600 mt-2">
              Akun Penguji hanya memiliki izin untuk mengakses Dashboard, Form Penilaian, Data Penguji, dan Data Tim Penilai.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="mt-5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              Kembali ke Dashboard
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-5 border-t border-stone-800 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-white">
              Sistem Penilaian Pencapaian Pramuka Garuda
            </span>
            <span className="mx-2">•</span>
            <span>{settings.kwartirCabang}</span>
            <span className="mx-2">•</span>
            <span>{settings.golongan}</span>
          </div>

          <div className="text-stone-400">
            {settings.kwarran || 'KWARRAN KEMRANJEN'} • Tahun {settings.tahun}
          </div>
        </div>
      </footer>
      </div>

      {/* Printable Sheet Modal (Official 2-Page layout matching user photos) */}
      {printPeserta && printPenilaian && (
        <LembarPenilaianPrint
          peserta={printPeserta}
          penilaian={printPenilaian}
          penguji={printPenguji}
          kelompok={printKelompok}
          settings={settings}
          onClose={() => setPrintPesertaId(null)}
        />
      )}

      {/* Settings Modal (Strictly Admin Only) */}
      {isSettingsOpen && currentUser.role === 'admin' && (
        <SettingsModal
          settings={settings}
          onSaveSettings={setSettings}
          onResetDefault={handleResetData}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Top-level Logout Confirmation Modal (Never clipped by header stacking context) */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLogoutModalOpen(false);
          }}
        >
          <div className="bg-white text-stone-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-stone-200 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <LogOut className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-center text-stone-900">
              Konfirmasi Keluar Aplikasi
            </h3>
            <p className="text-xs text-stone-600 text-center mt-2 leading-relaxed">
              Apakah Anda yakin ingin keluar dari sesi sebagai{' '}
              <span className="font-bold text-stone-900">{currentUser.displayName}</span>?
            </p>

            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
