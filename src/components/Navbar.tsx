import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCheck,
  Shield,
  FileSpreadsheet,
  Settings,
  Menu,
  X,
  Award,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { PramukaBadge } from './PramukaBadge';
import { AppSettings, AuthUser } from '../types';

export type NavTab = 'dashboard' | 'penilaian' | 'peserta' | 'penguji' | 'kelompok' | 'rekap';

interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: number;
  badgeText?: string;
  adminOnly?: boolean;
}

export const getNavItems = (
  pesertaCount: number,
  sudahDinilaiCount: number,
  isPenguji: boolean
): NavItemConfig[] => {
  const allItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Ringkasan & Statistik',
      icon: LayoutDashboard,
    },
    {
      id: 'penilaian',
      label: 'Form Penilaian',
      description: 'Administrasi & Wawancara',
      icon: ClipboardList,
    },
    {
      id: 'peserta',
      label: 'Data Peserta',
      description: 'Kelola Calon Garuda',
      icon: Users,
      badge: pesertaCount,
      adminOnly: true,
    },
    {
      id: 'penguji',
      label: 'Data Penguji',
      description: 'Daftar Tim Penguji',
      icon: UserCheck,
    },
    {
      id: 'kelompok',
      label: 'Data Tim Penilai',
      description: 'Penguji, Andik & Nilai',
      icon: Shield,
    },
    {
      id: 'rekap',
      label: 'Rekap & Ekspor',
      description: 'Hasil Akhir & Berita Acara',
      icon: FileSpreadsheet,
      badgeText: `${sudahDinilaiCount}/${pesertaCount}`,
      adminOnly: true,
    },
  ];

  // Penguji restricted to: dashboard, form penilaian, data penguji, data kelompok
  return isPenguji ? allItems.filter((item) => !item.adminOnly) : allItems;
};

/* ========================================================
 * 1. SIDEBAR COMPONENT (Menu di samping kiri)
 * ======================================================== */
interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  settings: AppSettings;
  pesertaCount: number;
  sudahDinilaiCount: number;
  currentUser?: AuthUser | null;
  onOpenSettings?: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  settings,
  pesertaCount,
  sudahDinilaiCount,
  currentUser,
  onOpenSettings,
  mobileOpen,
  onCloseMobile,
}) => {
  const isPenguji = currentUser?.role === 'penguji';
  const navItems = getNavItems(pesertaCount, sudahDinilaiCount, isPenguji);

  const handleItemClick = (tab: NavTab) => {
    if (isPenguji && (tab === 'peserta' || tab === 'rekap')) {
      return;
    }
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-none">
      {/* Branding Header */}
      <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between gap-3">
        <div
          onClick={() => handleItemClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
        >
          <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform shrink-0">
            <PramukaBadge
              size={42}
              customLogoUrl={settings.customLogoUrl}
              kwarranText={settings.kwarran || 'KWARRAN KEMRANJEN'}
              year={settings.tahun}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-sm tracking-tight text-white group-hover:text-amber-400 transition-colors uppercase truncate">
                Pramuka Garuda
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                {settings.tahun}
              </span>
            </div>
            <div className="text-[11px] text-stone-400 font-medium truncate">
              {settings.kwarran || 'KWARRAN KEMRANJEN'}
            </div>
            <div className="text-[10px] text-stone-400/80 truncate">
              {settings.kwartirCabang || 'Kwartir Cabang Banyumas'}
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Menu Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
          Menu Navigasi
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item.id)}
              className={`w-full group px-3.5 py-2.5 rounded-xl text-left font-semibold text-xs sm:text-sm flex items-center justify-between gap-3 transition-all relative ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-amber-700/60 text-white'
                      : 'bg-stone-800 text-stone-400 group-hover:text-amber-400 group-hover:bg-stone-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className="truncate leading-tight">{item.label}</div>
                  {item.description && (
                    <div
                      className={`text-[10px] font-normal truncate ${
                        isActive ? 'text-amber-100' : 'text-stone-400'
                      }`}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Badge indicators */}
              <div className="shrink-0 flex items-center gap-1.5">
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-amber-950 text-amber-200 border border-amber-800'
                        : 'bg-stone-800 text-stone-300 border border-stone-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.badgeText && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-amber-950 text-amber-200 border border-amber-800'
                        : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                    }`}
                  >
                    {item.badgeText}
                  </span>
                )}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-white' : 'text-stone-500 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </div>
            </button>
          );
        })}

        {/* Settings button in sidebar for admin */}
        {!isPenguji && onOpenSettings && (
          <div className="pt-3 mt-3 border-t border-stone-800">
            <div className="px-3 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Sistem
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenSettings();
                onCloseMobile();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left font-semibold text-xs sm:text-sm flex items-center gap-3 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-stone-800 text-stone-400">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <div className="leading-tight">Pengaturan Kwartir</div>
                <div className="text-[10px] text-stone-400 font-normal">Nama, TTD & Logo</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info in Sidebar */}
      <div className="p-3.5 border-t border-stone-800 bg-stone-950/40 text-[11px] text-stone-400">
        <div className="flex items-center justify-between text-stone-400 text-[10px] mb-1 font-semibold">
          <span>PORTAL GARUDA</span>
          <span className="text-amber-500 font-mono">v2.4</span>
        </div>
        <p className="text-[10px] text-stone-400 leading-relaxed truncate">
          {settings.kwarran || 'Kwarran Kemranjen'} • Banyumas
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-stone-800 shrink-0 sticky top-0 h-screen z-30 print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-over from left) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Sliding panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

/* ========================================================
 * 2. TOP HEADER COMPONENT (Hanya Nama & Tombol Logout)
 * ======================================================== */
interface TopHeaderProps {
  activeTab: NavTab;
  currentUser?: AuthUser | null;
  settings: AppSettings;
  onOpenMobileMenu: () => void;
  onTriggerLogout: () => void;
  onOpenSettings?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  currentUser,
  settings,
  onOpenMobileMenu,
  onTriggerLogout,
  onOpenSettings,
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard Utama', subtitle: 'Ringkasan & Statistik Penilaian Garuda' };
      case 'penilaian':
        return { title: 'Form Penilaian', subtitle: 'Penilaian Administrasi & Wawancara' };
      case 'peserta':
        return { title: 'Data Calon Garuda', subtitle: 'Kelola Data & Kelompok Peserta' };
      case 'penguji':
        return { title: 'Data Tim Penguji', subtitle: 'Daftar Penguji & Kwartir Ranting' };
      case 'kelompok':
        return { title: 'Data Tim Penilai', subtitle: 'Nama Tim, Penguji, Andik, Pangkalan & Rekap Nilai' };
      case 'rekap':
        return { title: 'Rekapitulasi Nilai', subtitle: 'Hasil Akhir & Cetak Berita Acara' };
      default:
        return { title: 'Pramuka Garuda', subtitle: settings.kwarran || 'Kwarran Kemranjen' };
    }
  };

  const { title, subtitle } = getTabTitle(activeTab);
  const isPenguji = currentUser?.role === 'penguji';

  return (
    <header className="sticky top-0 z-20 bg-stone-900 text-white shadow-md border-b border-amber-900/40 print:hidden">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left: Mobile hamburger & Page Title / Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700"
              aria-label="Buka menu samping"
              title="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white leading-tight">
                  {title}
                </h1>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-amber-400 border border-stone-700">
                  {settings.kwarran || 'Kemranjen'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block leading-tight">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right: Nama Pengguna & Tombol Logout (Sesuai Permintaan) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Session Info (Nama) */}
            {currentUser && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-stone-800/90 border border-stone-700 shadow-inner">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Award className="w-4 h-4" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-bold text-white text-xs sm:text-sm max-w-[120px] sm:max-w-[160px] md:max-w-[200px] truncate leading-tight">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider leading-none">
                    {currentUser.role === 'admin' ? 'Administrator' : 'Penguji'}
                  </div>
                </div>
              </div>
            )}

            {/* Admin Settings Button (optional quick button in header) */}
            {!isPenguji && onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="hidden md:flex p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700"
                title="Pengaturan Kwartir & Data"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Tombol Logout (Keluar) */}
            <button
              type="button"
              onClick={onTriggerLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 border border-rose-500"
              title="Keluar dari Aplikasi (Logout)"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-bold">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

/* ========================================================
 * 3. BACKWARD-COMPATIBLE WRAPPER NAVBAR
 * ======================================================== */
export interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  pesertaCount: number;
  sudahDinilaiCount: number;
  currentUser?: AuthUser | null;
  onTriggerLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = (props) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <>
      <Sidebar
        activeTab={props.activeTab}
        onSelectTab={props.onSelectTab}
        settings={props.settings}
        pesertaCount={props.pesertaCount}
        sudahDinilaiCount={props.sudahDinilaiCount}
        currentUser={props.currentUser}
        onOpenSettings={props.onOpenSettings}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <TopHeader
        activeTab={props.activeTab}
        currentUser={props.currentUser}
        settings={props.settings}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onTriggerLogout={props.onTriggerLogout}
        onOpenSettings={props.onOpenSettings}
      />
    </>
  );
};
