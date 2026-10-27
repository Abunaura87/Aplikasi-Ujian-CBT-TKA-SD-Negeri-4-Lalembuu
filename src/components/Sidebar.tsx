import React from 'react';
import {
  GraduationCap,
  Users,
  Trophy,
  Sliders,
  Volume2,
  VolumeX,
  LogOut,
  Eye,
  KeyRound,
  BookOpen,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  CheckCircle2,
  Download,
} from 'lucide-react';
import {
  ProktorTabType,
  TeacherAccount,
  AppBrandingConfig,
} from '../types/cbt';
import { resolveBrandIcons } from '../utils/cbtLogic';
import { GoogleDriveIcon } from './GoogleDriveArchiveModal';
import { sound } from '../utils/soundEffects';

interface SidebarProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  currentTab: ProktorTabType;
  onSelectTab: (tab: ProktorTabType) => void;
  onOpenStudentExam: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  onChangeFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  soundVolume: number;
  onChangeSoundVolume: (vol: number) => void;
  onLogout: () => void;
  testCode: string;
  activeSubject: string;
  activeGrade: string;
  activeTestCount: number;
  activeTeacherCount: number;
  loggedInTeacher: TeacherAccount;
  branding: AppBrandingConfig;
  onOpenGoogleDrive: () => void;
  onOpenInstallModal?: () => void;
  firebaseUser?: { email: string | null; uid: string } | null;
  onConnectFirebaseAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggleOpen,
  currentTab,
  onSelectTab,
  onOpenStudentExam,
  fontSize,
  onChangeFontSize,
  soundEnabled,
  onToggleSound,
  soundVolume,
  onChangeSoundVolume,
  onLogout,
  testCode,
  activeSubject,
  activeGrade,
  activeTestCount,
  activeTeacherCount,
  loggedInTeacher,
  branding,
  onOpenGoogleDrive,
  onOpenInstallModal,
  firebaseUser,
  onConnectFirebaseAuth,
}) => {
  const isProktorAdmin = loggedInTeacher.role === 'proktor';
  const { navbarIconUrl } = resolveBrandIcons(branding);

  const allNavItems: {
    id: ProktorTabType;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge?: string | number;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'panel',
      label: isProktorAdmin ? 'Panel Admin / Proktor' : 'Panel Guru Mapel',
      sublabel: isProktorAdmin
        ? 'Kontrol Sistem, Logo & Token'
        : 'Parameter & Materi Mapel',
      icon: <Sliders className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'aktivasi',
      label: 'Pengaktifan Kode Tes',
      sublabel: 'Multi-Sesi & Anti-Ganda',
      icon: <KeyRound className="w-4 h-4 shrink-0" />,
      badge: `${activeTestCount} Aktif`,
      adminOnly: true,
    },
    {
      id: 'soal',
      label: isProktorAdmin ? 'Kelola Bank Soal' : 'Kelola Soal Mapel',
      sublabel: 'Format & Upload Kunci',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'akun',
      label: 'Akun Guru & Demo',
      sublabel: 'Aktivasi Google & Demo',
      icon: <UserCheck className="w-4 h-4 shrink-0" />,
      badge: `${activeTeacherCount} Guru`,
      adminOnly: true,
    },
    {
      id: 'peserta',
      label: 'Status Peserta',
      sublabel: 'Pantau Lab Real-Time',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'rangking',
      label: isProktorAdmin ? 'Rangking & Berita Acara' : 'Rangking & Nilai',
      sublabel: 'Rekap Nilai Simulasi',
      icon: <Trophy className="w-4 h-4 shrink-0" />,
    },
  ];

  const visibleNavItems = allNavItems.filter(
    (item) => !item.adminOnly || isProktorAdmin
  );

  return (
    <>
      {/* Mobile Backdrop Overlay when Sidebar is open on small screens */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          aria-hidden="true"
          className="fixed inset-0 z-20 bg-stone-950/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* Floating Reopen Button when Sidebar is Hidden */}
      {!isOpen && (
        <div className="fixed top-4 left-4 z-40">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onToggleOpen();
            }}
            data-testid="sidebar-open-button"
            title="Tampilkan Sidebar Menu"
            className="btn-3d flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#143923] hover:bg-[#1B4C2F] text-amber-300 border-2 border-amber-400/60 font-extrabold text-xs cursor-pointer shadow-xl"
          >
            <PanelLeftOpen className="w-4 h-4 text-amber-300" />
            <span>Tampilkan Menu</span>
          </button>
        </div>
      )}

      {/* Left Collapsible Sidebar (Fixed Drawer on Mobile, Sticky Column on Desktop) */}
      <aside
        aria-label="Sidebar Navigasi Utama"
        className={`fixed lg:sticky top-0 left-0 h-screen z-30 shrink-0 transition-all duration-300 ease-in-out flex flex-col bg-white/95 backdrop-blur-md border-r-2 border-emerald-500/30 shadow-2xl overflow-hidden ${
          isOpen
            ? 'w-72 opacity-100 translate-x-0'
            : 'w-0 opacity-0 -translate-x-full lg:translate-x-0 pointer-events-none border-r-0'
        }`}
      >
        <div className="w-72 h-full flex flex-col justify-between overflow-y-auto">
          {/* Top Brand & Role Identity */}
          <div className="p-4 border-b border-emerald-100 bg-gradient-to-b from-emerald-50/70 to-white">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-0.5 shadow-md shrink-0">
                  {navbarIconUrl ? (
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1">
                      <img
                        src={navbarIconUrl}
                        alt="Ikon Navbar SDN 4 Lalembuu"
                        data-testid="sidebar-brand-icon"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div
                      data-testid="sidebar-brand-icon-default"
                      className="w-full h-full bg-[#153C25] rounded-[14px] flex items-center justify-center text-amber-300"
                    >
                      <GraduationCap className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="font-semibold tracking-normal text-[#11331F] text-[13px] leading-snug">
                    SDN 4 LALEMBUU
                  </h1>
                  <p className="text-[11px] font-medium text-emerald-800 leading-tight mt-0.5 truncate max-w-[140px]">
                    {branding.loginAppTitle || 'Simulasi CBT / TKA'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onToggleOpen();
                }}
                data-testid="sidebar-hide-button"
                title="Sembunyikan Sidebar"
                className="p-2 rounded-xl bg-emerald-100/80 hover:bg-emerald-200 text-[#133822] border border-emerald-300 transition-colors cursor-pointer shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Role Badge Pill */}
            <div className="mt-3">
              {isProktorAdmin ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100 border border-amber-300 text-[10px] font-semibold text-amber-950 uppercase tracking-wide w-full justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Hak Akses: Admin / Proktor Utama</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-[10px] font-semibold text-emerald-950 uppercase tracking-wide w-full justify-center">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Hak Akses: Guru Mata Pelajaran</span>
                </div>
              )}
            </div>

            {/* Active Session Pill inside Sidebar */}
            <div className="mt-2.5 p-2.5 rounded-2xl bg-[#143923] text-white border border-amber-400/40 shadow-inner">
              <div className="flex items-center justify-between text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">
                <span>Kode Tes Aktif</span>
                <span className="text-amber-300">{activeTestCount} Sesi</span>
              </div>
              <div className="font-mono text-xs font-semibold text-amber-300 mt-0.5 truncate">
                {testCode}
              </div>
              <div className="text-[11px] text-emerald-100 font-normal truncate mt-0.5">
                {activeSubject} ({activeGrade})
              </div>
            </div>
          </div>

          {/* Center Navigation Menu Items (Filtered by Role) */}
          <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              {isProktorAdmin ? 'Menu Kontrol Proktor' : 'Menu Kerja Guru Mapel'}
            </div>

            {visibleNavItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSelectTab(item.id);
                    if (
                      typeof window !== 'undefined' &&
                      window.innerWidth < 1024 &&
                      isOpen
                    ) {
                      onToggleOpen();
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#153A24] to-[#1E5233] text-amber-300 shadow-md border border-amber-400/50 translate-x-0.5'
                      : 'text-stone-700 hover:bg-emerald-50/90 hover:text-[#12331F] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl ${
                        isActive
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : 'bg-emerald-100/70 text-[#153A24]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-amber-300' : 'text-[#11301E]'
                        }`}
                      >
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-emerald-100/90' : 'text-stone-500'
                        }`}
                      >
                        {item.sublabel}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        isActive
                          ? 'bg-amber-400/20 text-amber-200 border border-amber-300/40'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Pratinjau Tes, Install Aplikasi & Arsip Google Drive Quick Actions */}
            <div className="pt-3 mt-3 border-t border-stone-200/80 space-y-2">
              {onOpenInstallModal && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onOpenInstallModal();
                  }}
                  data-testid="sidebar-install-app-btn"
                  className="btn-3d w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#143923] hover:bg-[#1E4F31] text-amber-300 font-semibold text-xs border border-amber-400/50 cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Install Aplikasi (Semua Device)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenGoogleDrive();
                }}
                data-testid="sidebar-google-drive-btn"
                className="btn-3d w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-[#11331F] font-semibold text-xs border-2 border-emerald-300 cursor-pointer"
              >
                <GoogleDriveIcon className="w-4 h-4 shrink-0" />
                <span>Google Drive (Arsip ANBK)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenStudentExam();
                }}
                className="btn-3d w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-stone-950 font-semibold text-xs border border-amber-600/30 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-stone-950" />
                <span>Pratinjau Layar Ujian Siswa</span>
              </button>
            </div>
          </div>

          {/* Bottom Controls: Font Size, Audio Volume/Mute, Logged-in Role Profile & Logout */}
          <div className="p-3.5 border-t border-emerald-100 bg-[#F6FAF7] space-y-2.5">
            {/* Row 1: Font Size (A- | A | A+) & Mute/Unmute Toggle */}
            <div className="flex items-center justify-between gap-2">
              <div
                className="flex items-center bg-white rounded-full border border-emerald-200 p-1 text-xs text-emerald-950 shadow-2xs"
                role="group"
                aria-label="Pengaturan Ukuran Font Aplikasi"
              >
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onChangeFontSize('normal');
                  }}
                  className={`px-2.5 py-1 rounded-full font-semibold cursor-pointer transition-all ${
                    fontSize === 'normal'
                      ? 'bg-[#153A24] text-amber-300 shadow-xs'
                      : 'hover:bg-emerald-50 text-stone-700'
                  }`}
                  title="Perkecil Ukuran Huruf (A-)"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onChangeFontSize('large');
                  }}
                  className={`px-2.5 py-1 rounded-full font-semibold cursor-pointer transition-all ${
                    fontSize === 'large'
                      ? 'bg-[#153A24] text-amber-300 shadow-xs'
                      : 'hover:bg-emerald-50 text-stone-700'
                  }`}
                  title="Ukuran Huruf Standar (A)"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onChangeFontSize('xlarge');
                  }}
                  className={`px-2.5 py-1 rounded-full font-semibold cursor-pointer transition-all ${
                    fontSize === 'xlarge'
                      ? 'bg-[#153A24] text-amber-300 shadow-xs'
                      : 'hover:bg-emerald-50 text-stone-700'
                  }`}
                  title="Perbesar Ukuran Huruf (A+)"
                >
                  A+
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onToggleSound();
                  if (!soundEnabled) {
                    setTimeout(() => sound.playClick(), 20);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
                  soundEnabled && soundVolume > 0
                    ? 'bg-white hover:bg-emerald-50 text-[#11331F] border-emerald-200'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
                title={
                  soundEnabled && soundVolume > 0
                    ? 'Klik untuk Mute Suara'
                    : 'Klik untuk Aktifkan Suara'
                }
              >
                {soundEnabled && soundVolume > 0 ? (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Suara Aktif</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Mute</span>
                  </>
                )}
              </button>
            </div>

            {/* Row 2: Audio Volume Slider & - / + Buttons */}
            <div className="px-2.5 py-2 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(0, soundVolume - 20);
                  onChangeSoundVolume(next);
                  setTimeout(() => sound.playClick(), 20);
                }}
                aria-label="Perkecil Volume Audio"
                title="Perkecil Volume Audio (-)"
                className="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#133822] border border-emerald-200 font-bold text-xs flex items-center justify-center cursor-pointer shrink-0"
              >
                -
              </button>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={soundEnabled ? soundVolume : 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChangeSoundVolume(val);
                }}
                aria-label="Slider Volume Audio"
                className="w-full accent-[#153A24] h-1.5 bg-emerald-100 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(100, (soundEnabled ? soundVolume : 0) + 20);
                  onChangeSoundVolume(next);
                  setTimeout(() => sound.playClick(), 20);
                }}
                aria-label="Perbesar Volume Audio"
                title="Perbesar Volume Audio (+)"
                className="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#133822] border border-emerald-200 font-bold text-xs flex items-center justify-center cursor-pointer shrink-0"
              >
                +
              </button>
              <span className="text-[10px] font-mono font-semibold text-emerald-900 w-9 text-right shrink-0">
                {soundEnabled ? `${soundVolume}%` : '0%'}
              </span>
            </div>

            {/* Active Teacher / Proktor Card with Firebase Auth Status */}
            <div className="p-2.5 rounded-2xl bg-white border border-emerald-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl font-semibold text-xs flex items-center justify-center shrink-0 ${
                    isProktorAdmin
                      ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-stone-950'
                      : 'bg-emerald-800 text-amber-300'
                  }`}
                >
                  {loggedInTeacher.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-[#11331F] truncate">
                      {loggedInTeacher.name}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-[10px] font-semibold text-amber-700 truncate">
                    {isProktorAdmin
                      ? 'Admin / Proktor Utama'
                      : `Guru Mapel • ${loggedInTeacher.subject}`}
                  </div>
                  <div className="text-[10px] text-stone-500 truncate">
                    {loggedInTeacher.email}
                  </div>
                </div>
              </div>

              {/* Firebase Auth Verification Badge */}
              {firebaseUser ? (
                <div
                  data-testid="sidebar-firebase-verified"
                  className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[10px] font-bold text-emerald-900"
                >
                  <span className="flex items-center gap-1 truncate">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Firebase Auth: {firebaseUser.email}
                    </span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-1" />
                </div>
              ) : (
                onConnectFirebaseAuth && (
                  <button
                    type="button"
                    data-testid="sidebar-connect-firebase-btn"
                    onClick={() => {
                      sound.playClick();
                      onConnectFirebaseAuth();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-950 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Verifikasi Sesi dengan Firebase Google</span>
                  </button>
                )
              )}
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar ke Halaman Login</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
