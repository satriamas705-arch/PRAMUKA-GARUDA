import React, { useState } from 'react';
import { AuthUser, Penguji, AppSettings } from '../types';
import { attemptLogin, getPengujiPasswordCandidates } from '../utils/auth';
import { PramukaBadge } from './PramukaBadge';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Award,
  KeyRound,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface LoginFormProps {
  pengujiList: Penguji[];
  settings: AppSettings;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  pengujiList,
  settings,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'admin' | 'penguji'>('admin');

  const handleTabChange = (tab: 'admin' | 'penguji') => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === 'admin') {
      setUsername('admin');
      setPassword('admin');
    } else {
      setUsername('penguji');
      // Default to first penguji's simple password
      if (pengujiList.length > 0) {
        const defaultSample = getPengujiPasswordCandidates(pengujiList[0].nama)[0] || '';
        setPassword(defaultSample);
      } else {
        setPassword('sugengpriyono');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = attemptLogin(username, password, pengujiList);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMessage(result.error || 'Login gagal. Periksa kembali username dan password Anda.');
    }
  };

  const handleQuickLogin = (userStr: string, passStr: string) => {
    setUsername(userStr);
    setPassword(passStr);
    setErrorMessage(null);
    const result = attemptLogin(userStr, passStr, pengujiList);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Decorative scout badge background watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
        <PramukaBadge
          size={950}
          customLogoUrl={settings.customLogoUrl}
          kwarranText={settings.kwarran || 'KWARRAN KEMRANJEN'}
          year={settings.tahun}
        />
      </div>

      {/* Decorative subtle ambient lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main container: 2-column layout on lg screens (Text & Logo in center/left, Form on right) */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Kolom Kiri/Tengah: Logo dan Tulisan Penilaian Pramuka Garuda */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-center lg:items-center text-center justify-center space-y-4 px-2">
          {/* Logo Badge Lingkaran Resmi */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative inline-block p-1.5 rounded-full bg-stone-900 border-2 border-amber-500/60 shadow-2xl backdrop-blur-md">
              <PramukaBadge
                size={140}
                customLogoUrl={settings.customLogoUrl}
                kwarranText={settings.kwarran || 'KWARRAN KEMRANJEN'}
                year={settings.tahun}
              />
            </div>
          </div>

          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Sistem Penilaian Resmi</span>
            </div>

            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight text-white uppercase leading-tight">
              Penilaian Pramuka Garuda
            </h1>

            <p className="text-sm sm:text-base font-bold text-amber-300 tracking-wide uppercase">
              {settings.kwarran || 'KWARRAN KEMRANJEN'} • {settings.kwartirCabang}
            </p>

            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-stone-300 pt-1">
              <span className="bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60">
                Tahun {settings.tahun}
              </span>
              <span>•</span>
              <span className="bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60">
                Golongan Penggalang
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed pt-2 max-w-md mx-auto">
              Aplikasi terintegrasi untuk verifikasi portofolio administrasi, pelaksanaan uji wawancara, perekapan nilai, dan pencetakan berita acara penetapan Pramuka Garuda.
            </p>
          </div>

          {/* Badge Fitur Singkat */}
          <div className="grid grid-cols-2 gap-2 w-full max-w-sm pt-2 text-left">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-stone-300">Penilaian Real-time</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/50">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[11px] font-semibold text-stone-300">Cetak & Unduh Dokumen</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Login */}
        <div className="lg:col-span-6 xl:col-span-5 w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-stone-200">
            {/* Header Form Kecil */}
            <div className="mb-5 pb-3 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-stone-900 tracking-tight">
                  Silakan Masuk
                </h2>
                <p className="text-xs text-stone-500">
                  Pilih peran akses Anda di bawah ini
                </p>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {activeTab === 'admin' ? 'Admin Portal' : 'Penguji Portal'}
              </span>
            </div>

            {/* Role Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-stone-100 border border-stone-200 mb-5">
              <button
                type="button"
                onClick={() => handleTabChange('admin')}
                className={`py-2 px-3 text-xs sm:text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('penguji')}
                className={`py-2 px-3 text-xs sm:text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'penguji'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Penguji</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin / penguji"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-stone-500">
                    {activeTab === 'admin' ? 'admin' : 'nama penguji'}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      activeTab === 'admin'
                        ? 'admin'
                        : 'nama penguji huruf kecil'
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="leading-snug">{errorMessage}</div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 transition-all mt-2"
              >
                <span>Masuk Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Access / Petunjuk Login Sesuai Format Permintaan */}
            <div className="mt-5 pt-4 border-t border-stone-200 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Petunjuk Akses Akun:</span>
              </div>

              {activeTab === 'admin' ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Akses Administrator</span>
                  </div>
                  <div className="text-[11px] text-stone-700">
                    Username: <code className="bg-amber-100 font-bold px-1 rounded">admin</code> • Password: <code className="bg-amber-100 font-bold px-1 rounded">admin</code>
                  </div>
                  <div className="text-[10px] text-stone-500 italic pt-1">
                    * Akses penuh ke seluruh menu (Data Peserta, Penguji, Tim Penilai, Penilaian, Rekap, dan Pengaturan).
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-700" />
                    <span>Akses Tim Penguji</span>
                  </div>
                  <div className="text-[11px] text-stone-700">
                    Username: <code className="bg-amber-100 font-bold px-1 rounded">penguji</code>
                  </div>
                  <div className="text-[11px] text-stone-700">
                    Password: <span className="font-bold">nama penguji huruf kecil dan disambung</span>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60">
                    <div className="text-[10px] font-bold text-stone-600 uppercase mb-1">
                      Klik Cepat Sebagai Penguji:
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {pengujiList.map((p) => {
                        const candidate = getPengujiPasswordCandidates(p.nama)[0] || '';
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleQuickLogin('penguji', candidate)}
                            className="px-2 py-1 bg-white hover:bg-amber-100 text-[10px] font-bold text-stone-800 rounded-md border border-amber-300 transition-colors"
                            title={`Login sebagai ${p.nama} (pass: ${candidate})`}
                          >
                            {p.nama.split(',')[0]} ({candidate})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer info di bawah form */}
          <div className="text-center text-[11px] text-stone-400 mt-4 font-medium">
            Sistem Penilaian Pencapaian Pramuka Garuda © {settings.tahun}
          </div>
        </div>
      </div>
    </div>
  );
};
