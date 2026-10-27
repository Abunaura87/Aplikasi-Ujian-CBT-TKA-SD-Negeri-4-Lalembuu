import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  FileSpreadsheet,
  Check,
  KeyRound,
  Lock,
  PlusCircle,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Trash2,
  GraduationCap,
  UserCheck,
  Smartphone,
  Laptop,
  Download,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { ExamConfig, AppBrandingConfig, TeacherAccount } from '../types/cbt';
import {
  generateUniqueTestCode,
  validateTestCodeUniqueness,
  getCurriculumTopics,
  getGradesForEducationLevel,
  getDefaultGradeForLevel,
  normalizeBrandingConfig,
} from '../utils/cbtLogic';
import { sound } from '../utils/soundEffects';
import { GoogleDriveIcon } from './GoogleDriveArchiveModal';

interface ProktorPanelProps {
  examConfig: ExamConfig;
  allSessions: ExamConfig[];
  usedTestCodes: string[];
  onSelectSession: (sessionId: string) => void;
  onUpdateConfig: (newConfig: ExamConfig, isNewTestCode: boolean) => void;
  onToggleTokenActive: () => void;
  onReleaseNewToken: () => void;
  onNavigateTab: (tab: 'aktivasi' | 'soal') => void;
  customProktorPassword?: string;
  onUpdateProktorPassword: (newPass: string) => void;
  branding: AppBrandingConfig;
  onUpdateBranding: (newBranding: AppBrandingConfig) => void;
  onOpenGoogleDrive: () => void;
  onOpenInstallModal?: () => void;
  loggedInTeacher: TeacherAccount;
}

export const ProktorPanel: React.FC<ProktorPanelProps> = ({
  examConfig,
  allSessions,
  usedTestCodes,
  onSelectSession,
  onUpdateConfig,
  onToggleTokenActive,
  onReleaseNewToken,
  onNavigateTab,
  customProktorPassword,
  onUpdateProktorPassword,
  branding,
  onUpdateBranding,
  onOpenGoogleDrive,
  onOpenInstallModal,
  loggedInTeacher,
}) => {
  const isProktorAdmin = loggedInTeacher.role === 'proktor';
  const [testCode, setTestCode] = useState(examConfig.testCode);
  const [educationLevel, setEducationLevel] = useState(examConfig.educationLevel);
  const [grade, setGrade] = useState(examConfig.grade);
  const [subject, setSubject] = useState(examConfig.subject);
  const [questionCount, setQuestionCount] = useState(examConfig.questionCount);
  const [durationMinutes, setDurationMinutes] = useState(examConfig.durationMinutes);
  const [determinationMode, setDeterminationMode] = useState<'auto' | 'manual'>(
    examConfig.determinationMode
  );
  const [materialTopics, setMaterialTopics] = useState<[string, string, string]>(
    examConfig.materialTopics
  );

  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Password change state
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSavedMsg, setPasswordSavedMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Branding (Logo Login, Navbar Icon, Installed App Icon, App Title & Short Name) state
  const [appTitleInput, setAppTitleInput] = useState(branding.loginAppTitle);
  const [pwaShortNameInput, setPwaShortNameInput] = useState(
    branding.pwaShortName || 'CBT SDN 4'
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    branding.logoDataUrl
  );
  const [navbarIconPreview, setNavbarIconPreview] = useState<string | null>(
    branding.navbarIconDataUrl || null
  );
  const [pwaIconPreview, setPwaIconPreview] = useState<string | null>(
    branding.pwaIconDataUrl || null
  );
  const [brandingSavedMsg, setBrandingSavedMsg] = useState('');
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const navbarIconInputRef = useRef<HTMLInputElement | null>(null);
  const pwaIconInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAppTitleInput(branding.loginAppTitle);
    setPwaShortNameInput(branding.pwaShortName || 'CBT SDN 4');
    setLogoPreview(branding.logoDataUrl);
    setNavbarIconPreview(branding.navbarIconDataUrl || null);
    setPwaIconPreview(branding.pwaIconDataUrl || null);
  }, [branding]);

  // Sync local form state when switching active session
  useEffect(() => {
    setTestCode(examConfig.testCode);
    setEducationLevel(examConfig.educationLevel);
    setGrade(examConfig.grade);
    setSubject(examConfig.subject);
    setQuestionCount(examConfig.questionCount);
    setDurationMinutes(examConfig.durationMinutes);
    setDeterminationMode(examConfig.determinationMode);
    setMaterialTopics(examConfig.materialTopics);
  }, [examConfig]);

  // Check if the typed testCode is a new code or the current session's own code
  const isSameAsCurrent =
    testCode.trim().toUpperCase() === examConfig.testCode.trim().toUpperCase();
  const otherUsedCodes = usedTestCodes.filter(
    (c) => c.trim().toUpperCase() !== examConfig.testCode.trim().toUpperCase()
  );
  const codeValidation = isSameAsCurrent
    ? {
        isUnique: true,
        cleanCode: examConfig.testCode,
        message: 'Kode tes aktif pada sesi ini (terkunci dari duplikasi).',
      }
    : validateTestCodeUniqueness(testCode, usedTestCodes);

  const handleRefreshTestCode = () => {
    sound.playClick();
    const freshCode = generateUniqueTestCode(subject, grade, usedTestCodes);
    setTestCode(freshCode);
    setSaveMessage(null);
  };

  const handleEducationLevelChange = (nextLevel: string) => {
    sound.playSelect();
    setEducationLevel(nextLevel);
    const validGrades = getGradesForEducationLevel(nextLevel);
    const isCurrentGradeValid = validGrades.some((g) => g.value === grade);
    const syncedGrade = isCurrentGradeValid
      ? grade
      : getDefaultGradeForLevel(nextLevel);
    setGrade(syncedGrade);
    if (determinationMode === 'auto') {
      setMaterialTopics(getCurriculumTopics(subject, syncedGrade));
    }
  };

  const handleSubjectOrGradeChange = (newSub: string, newGrd: string) => {
    setSubject(newSub);
    setGrade(newGrd);
    if (determinationMode === 'auto') {
      const autoTopics = getCurriculumTopics(newSub, newGrd);
      setMaterialTopics(autoTopics);
    }
  };

  const handleSaveParameters = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!codeValidation.isUnique) {
      setSaveMessage({
        type: 'error',
        text: codeValidation.message,
      });
      return;
    }

    sound.playSuccess();
    const isNewCode = !isSameAsCurrent;
    const updated: ExamConfig = {
      ...examConfig,
      testCode: codeValidation.cleanCode,
      educationLevel,
      grade,
      subject,
      questionCount,
      durationMinutes,
      determinationMode,
      materialTopics,
    };
    onUpdateConfig(updated, isNewCode);
    setSaveMessage({
      type: 'success',
      text: isNewCode
        ? `Kode tes baru "${codeValidation.cleanCode}" berhasil disimpan sebagai paket tes baru dengan token unik!`
        : `Pengaturan parameter untuk kode tes "${codeValidation.cleanCode}" berhasil diperbarui!`,
    });
    setTimeout(() => {
      setSaveMessage(null);
    }, 5000);
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = newPasswordInput.trim();
    if (cleanPass.length < 4) {
      setPasswordSavedMsg({
        type: 'error',
        text: 'Password baru minimal harus terdiri dari 4 karakter.',
      });
      return;
    }
    sound.playSuccess();
    onUpdateProktorPassword(cleanPass);
    setNewPasswordInput('');
    setPasswordSavedMsg({
      type: 'success',
      text: `Password login Admin/Proktor berhasil diubah dan disimpan permanen! Gunakan password baru ini saat login berikutnya (tetap aktif meskipun halaman di-refresh).`,
    });
    setTimeout(() => setPasswordSavedMsg(null), 6000);
  };

  const handleResetDefaultPassword = () => {
    sound.playClick();
    onUpdateProktorPassword('');
    setNewPasswordInput('');
    setPasswordSavedMsg({
      type: 'success',
      text: 'Password proktor berhasil dikembalikan ke sandi default sistem (marhan123 / proktor123).',
    });
    setTimeout(() => setPasswordSavedMsg(null), 5000);
  };

  const persistBrandingState = (
    overrides: Partial<AppBrandingConfig>,
    successMsg: string
  ) => {
    const nextConfig = normalizeBrandingConfig({
      loginAppTitle: appTitleInput.trim() || 'Simulasi CBT / TKA',
      pwaShortName: pwaShortNameInput.trim() || 'CBT SDN 4',
      logoDataUrl: logoPreview,
      navbarIconDataUrl: navbarIconPreview,
      pwaIconDataUrl: pwaIconPreview,
      ...overrides,
    });
    onUpdateBranding(nextConfig);
    sound.playSuccess();
    setBrandingSavedMsg(successMsg);
    setTimeout(() => setBrandingSavedMsg(''), 5000);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      setLogoPreview(dataUrl);
      persistBrandingState(
        { logoDataUrl: dataUrl },
        'Logo Halaman Login berhasil diunggah & disimpan permanen!'
      );
    };
    reader.readAsDataURL(file);
  };

  const handleNavbarIconFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      setNavbarIconPreview(dataUrl);
      persistBrandingState(
        { navbarIconDataUrl: dataUrl },
        'Ikon Navbar, Sidebar & Tab Browser berhasil diperbarui!'
      );
    };
    reader.readAsDataURL(file);
  };

  const handlePwaIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      setPwaIconPreview(dataUrl);
      persistBrandingState(
        { pwaIconDataUrl: dataUrl },
        'Ikon Instalasi Aplikasi (Laptop, Android & iPhone/iPad) berhasil diperbarui!'
      );
    };
    reader.readAsDataURL(file);
  };

  const handleApplyIconToAll = (sourceDataUrl: string | null) => {
    if (!sourceDataUrl) return;
    setLogoPreview(sourceDataUrl);
    setNavbarIconPreview(sourceDataUrl);
    setPwaIconPreview(sourceDataUrl);
    persistBrandingState(
      {
        logoDataUrl: sourceDataUrl,
        navbarIconDataUrl: sourceDataUrl,
        pwaIconDataUrl: sourceDataUrl,
      },
      'Ikon berhasil disinkronkan ke Halaman Login, Navbar/Sidebar, dan Ikon Instalasi Aplikasi di semua perangkat!'
    );
  };

  const handleResetLogo = () => {
    sound.playClick();
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
    persistBrandingState(
      { logoDataUrl: null },
      'Logo halaman login dikembalikan ke ikon standar.'
    );
  };

  const handleResetNavbarIcon = () => {
    sound.playClick();
    setNavbarIconPreview(null);
    if (navbarIconInputRef.current) navbarIconInputRef.current.value = '';
    persistBrandingState(
      { navbarIconDataUrl: null },
      'Ikon Navbar & Sidebar dikembalikan ke ikon standar.'
    );
  };

  const handleResetPwaIcon = () => {
    sound.playClick();
    setPwaIconPreview(null);
    if (pwaIconInputRef.current) pwaIconInputRef.current.value = '';
    persistBrandingState(
      { pwaIconDataUrl: null },
      'Ikon Instalasi Aplikasi dikembalikan ke ikon standar.'
    );
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = appTitleInput.trim() || 'Simulasi CBT / TKA';
    const cleanShort = (pwaShortNameInput.trim() || 'CBT SDN 4').slice(0, 12);
    setAppTitleInput(cleanTitle);
    setPwaShortNameInput(cleanShort);
    persistBrandingState(
      {
        loginAppTitle: cleanTitle,
        pwaShortName: cleanShort,
      },
      `Pengaturan identitas aplikasi ("${cleanTitle}") & ikon berhasil disimpan permanen!`
    );
  };

  const tokenCharacters =
    examConfig.isTokenActive && examConfig.token
      ? examConfig.token.split('')
      : ['-', '-', '-', '-', '-', '-'];

  return (
    <div className="space-y-6">
      {/* Hero Header Card matching Image 1 with Multi-Session Switcher */}
      <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-50/70 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Titles & Session Selector */}
          <div className="space-y-2">
            {isProktorAdmin ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-[11px] font-semibold text-amber-950">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Mode Administrator / Proktor Utama (Kontrol Penuh Sistem)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-[11px] font-semibold text-[#143E26]">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  Mode Guru Mata Pelajaran • {loggedInTeacher.name} ({loggedInTeacher.subject})
                </span>
              </div>
            )}
            <h2 className="text-lg sm:text-xl font-semibold text-[#102D1D] tracking-normal">
              {isProktorAdmin
                ? 'Panel Proktor & Administrator CBT'
                : `Dashboard Guru Mapel: ${loggedInTeacher.subject}`}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              {isProktorAdmin
                ? 'Kontrol penuh sesi ujian, kode tes, rilis token ruang lab, serta pengaturan identitas & keamanan aplikasi'
                : `Kelola parameter ujian, materi kurikulum, dan bank soal untuk mata pelajaran ${loggedInTeacher.subject} (${loggedInTeacher.grade})`}
            </p>

            {/* Quick Multi-Session Switcher */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold text-[#133621]">
                Sesi Kode Tes Aktif:
              </label>
              <select
                value={examConfig.id}
                onChange={(e) => {
                  sound.playSelect();
                  onSelectSession(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/70 text-xs font-bold text-[#122E1F] outline-none"
              >
                {allSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.testCode} — {s.subject} ({s.grade}) [Token: {s.token}]
                  </option>
                ))}
              </select>

              {isProktorAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onNavigateTab('aktivasi');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Kelola & Aktifkan Multi-Tes ({allSessions.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenGoogleDrive();
                }}
                data-testid="panel-google-drive-btn"
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#11331F] border-2 border-emerald-300 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <GoogleDriveIcon className="w-3.5 h-3.5" />
                <span>Google Drive</span>
              </button>
            </div>
          </div>


          {/* Right: Token Box for Selected Test Session */}
          <div className="bg-stone-50/90 rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-inner flex flex-col items-center sm:items-end min-w-[320px]">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[11px] font-bold text-stone-600 tracking-wider uppercase">
                TOKEN RUANG ({examConfig.testCode})
              </span>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                  examConfig.isTokenActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {examConfig.isTokenActive ? 'Aktif' : 'Non-Aktif'}
              </span>
            </div>

            {/* Token Letters Display Tiles */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-2 w-full">
              {tokenCharacters.map((char, index) => (
                <div
                  key={index}
                  className={`w-9 h-11 sm:w-11 sm:h-12 rounded-xl flex items-center justify-center font-mono text-lg sm:text-xl font-black transition-all ${
                    examConfig.isTokenActive
                      ? 'bg-[#143A24] text-amber-300 shadow-md border border-amber-400/30'
                      : 'bg-white text-stone-400 border border-stone-200'
                  }`}
                >
                  {char}
                </div>
              ))}
            </div>

            {/* Token Action Buttons */}
            <div className="flex items-center gap-2 mt-2 w-full justify-end">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onToggleTokenActive();
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  examConfig.isTokenActive
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    examConfig.isTokenActive ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
                <span>Pengaktifan Tes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playTokenRelease();
                  onReleaseNewToken();
                }}
                disabled={!examConfig.isTokenActive}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                  examConfig.isTokenActive
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Rilis Token</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Pengaturan Parameter Ujian CBT */}
      <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#133A24] mt-0.5">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#102C1D]">
                Pengaturan Parameter Ujian CBT
              </h3>
              <p className="text-xs text-stone-500">
                Atur kode tes unik, jenjang pendidikan, kelas, mata pelajaran, jumlah soal, dan durasi pengerjaan untuk peserta di lab
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRefreshTestCode}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-stone-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              <span>Segarkan Kode Tes Baru</span>
            </button>
          </div>
        </div>

        {/* Active Settings Preview Bar */}
        <div className="my-5 p-3.5 bg-[#F6FAF7] rounded-2xl border border-emerald-100/80 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold mr-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>PENGATURAN AKTIF SAAT INI:</span>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-[#133822] font-mono font-bold text-xs border border-emerald-300">
            {examConfig.testCode}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
            {examConfig.educationLevel} ({examConfig.grade})
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-emerald-100 font-bold text-xs">
            {examConfig.subject}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#12311E] font-semibold text-xs border border-emerald-200">
            {examConfig.questionCount} Butir Soal
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 font-semibold text-xs border border-amber-200">
            {examConfig.durationMinutes} Menit
          </span>

          <span className="text-[11px] text-stone-500 italic ml-auto hidden md:inline">
            (Token Sesi: {examConfig.token})
          </span>
        </div>

        {saveMessage && (
          <div
            className={`mb-5 p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              saveMessage.type === 'success'
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        {/* Parameter Form Grid */}
        <form onSubmit={handleSaveParameters} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Kode Tes (Anti-Duplicate Protected) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700">
                  1. Kode Tes (Proteksi Anti-Ganda):
                </label>
                <button
                  type="button"
                  onClick={handleRefreshTestCode}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Segarkan Unik</span>
                </button>
              </div>
              <input
                type="text"
                value={testCode}
                onChange={(e) => {
                  setTestCode(e.target.value.toUpperCase());
                  setSaveMessage(null);
                }}
                className={`w-full px-3.5 py-2.5 font-mono text-xs font-bold rounded-xl border outline-none bg-white ${
                  codeValidation.isUnique
                    ? 'border-stone-300 focus:border-[#1E4D34] text-[#122E1F]'
                    : 'border-rose-400 text-rose-800 bg-rose-50/40'
                }`}
              />
              {codeValidation.isUnique ? (
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{codeValidation.message}</span>
                </div>
              ) : (
                <div className="flex items-start gap-1 text-[11px] text-rose-600 font-bold mt-1">
                  <Lock className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                  <span>{codeValidation.message}</span>
                </div>
              )}

              {/* Locked Historical Codes Indicator */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-stone-400">Kode Terkunci (Tidak Bisa Dipakai Lagi):</span>
                {otherUsedCodes.slice(0, 3).map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200 font-mono line-through"
                    title="Kode tes ini sudah pernah dipakai dan tidak bisa digunakan kembali"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Jenjang Pendidikan */}
            <div>
              <label
                htmlFor="proktor-education-level-select"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                2. Jenjang Pendidikan:
              </label>
              <select
                id="proktor-education-level-select"
                data-testid="proktor-education-level-select"
                value={educationLevel}
                onChange={(e) => handleEducationLevelChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none bg-white text-stone-800"
              >
                <option value="Jenjang SD/MI">Jenjang SD/MI (Sekolah Dasar)</option>
                <option value="Jenjang SMP/MTs">Jenjang SMP/MTs (Sekolah Menengah Pertama)</option>
                <option value="Jenjang SMA/MA">Jenjang SMA/MA (Sekolah Menengah Atas)</option>
              </select>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Otomatis menyinkronkan daftar pilihan Kelas ({educationLevel})
              </span>
            </div>

            {/* 3. Kelas (Dynamically synchronized with Jenjang Pendidikan) */}
            <div>
              <label
                htmlFor="proktor-grade-select"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                3. Kelas ({educationLevel.replace('Jenjang ', '')}):
              </label>
              <select
                id="proktor-grade-select"
                data-testid="proktor-grade-select"
                value={grade}
                onChange={(e) => handleSubjectOrGradeChange(subject, e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none bg-white text-stone-800"
              >
                {getGradesForEducationLevel(educationLevel).map((grdOption) => (
                  <option key={grdOption.value} value={grdOption.value}>
                    {grdOption.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Tingkat rombel peserta ujian sesuai {educationLevel}
              </span>
            </div>

            {/* 4. Mata Pelajaran */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                4. Mata Pelajaran:
              </label>
              <select
                value={subject}
                onChange={(e) => handleSubjectOrGradeChange(e.target.value, grade)}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none bg-white text-stone-800"
              >
                <option value="Literasi & Numerasi">Literasi & Numerasi (ANBK Standar)</option>
                <option value="Literasi Membaca">Literasi Membaca (Bahasa Indonesia)</option>
                <option value="Numerasi Matematika">Numerasi Matematika</option>
                <option value="IPAS">IPAS (Ilmu Pengetahuan Alam & Sosial)</option>
                <option value="Pendidikan Agama Islam">Pendidikan Agama Islam (PAI)</option>
                <option value="Pendidikan Pancasila">Pendidikan Pancasila & Kewarganegaraan</option>
              </select>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Materi kurikulum asesmen
              </span>
            </div>

            {/* 5. Jumlah Soal */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                5. Jumlah Soal:
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none bg-white text-stone-800"
              >
                <option value={15}>15 Butir Soal (Latihan Singkat)</option>
                <option value={20}>20 Butir Soal</option>
                <option value={25}>25 Butir Soal</option>
                <option value={30}>30 Butir Soal (Standar Nasional)</option>
                <option value={40}>40 Butir Soal (Ujian Lengkap)</option>
              </select>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Tersedia {examConfig.questions.length} butir di Bank Soal sesi ini
              </span>
            </div>

            {/* 6. Waktu Pengerjaan */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                6. Waktu Pengerjaan:
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none bg-white text-stone-800"
              >
                <option value={30}>30 Menit</option>
                <option value={45}>45 Menit (Standar SD)</option>
                <option value={60}>60 Menit (1 Jam Penuh)</option>
                <option value={90}>90 Menit</option>
              </select>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Hitungan mundur otomatis pada layar siswa
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-stone-500">
              Jika Anda mengganti Kode Tes dengan kode unik baru, sistem otomatis membuat sesi tes baru dengan token berbeda.
            </p>

            <button
              type="submit"
              disabled={!codeValidation.isUnique}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs shadow-md border flex items-center justify-center gap-2 transition-all ${
                codeValidation.isUnique
                  ? 'bg-[#153822] hover:bg-[#1C4B2E] text-amber-300 border-amber-400/50 cursor-pointer'
                  : 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Simpan & Terapkan Pengaturan Ujian</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Pengaturan Materi Ujian CBT */}
      <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#133A24] mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#102C1D]">
                Pengaturan Materi Ujian CBT
              </h3>
              <p className="text-xs text-stone-500">
                Pilih mode penentuan materi ujian: otomatis sesuai kurikulum mapel & kelas, atau input manual per paragraf oleh guru
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-stone-600 whitespace-nowrap">
              Mode Penentuan:
            </span>
            <select
              value={determinationMode}
              onChange={(e) => {
                const mode = e.target.value as 'auto' | 'manual';
                setDeterminationMode(mode);
                if (mode === 'auto') {
                  setMaterialTopics(getCurriculumTopics(subject, grade));
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:border-[#1E4D34] outline-none"
            >
              <option value="auto">Otomatis (Sesuai Kurikulum Merdeka)</option>
              <option value="manual">Input Manual Guru/Proktor</option>
            </select>
          </div>
        </div>

        <div className="my-5 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Mode Otomatis Aktif:</strong> Sistem menyesuaikan 3 cakupan materi pokok secara otomatis berdasarkan Mata Pelajaran (<strong>{subject}</strong>) dan Kelas (<strong>{grade}</strong>).
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onNavigateTab('soal');
            }}
            className="px-3 py-1 rounded-lg bg-[#153822] text-amber-300 font-bold text-xs cursor-pointer"
          >
            Buka Bank & Upload Soal &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {materialTopics.map((topic, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:border-emerald-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#12311E] font-extrabold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <h4 className="font-bold text-xs text-stone-800">
                    Materi Pokok Bagian {index + 1}
                  </h4>
                </div>

                {determinationMode === 'manual' ? (
                  <textarea
                    rows={4}
                    value={topic}
                    onChange={(e) => {
                      const newTopics = [...materialTopics] as [string, string, string];
                      newTopics[index] = e.target.value;
                      setMaterialTopics(newTopics);
                    }}
                    className="w-full p-2.5 text-xs text-stone-700 border border-stone-300 rounded-xl outline-none focus:border-[#1E4D34]"
                  />
                ) : (
                  <p className="text-xs text-stone-600 leading-relaxed">{topic}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 text-[10px] text-stone-400 flex items-center justify-between">
                <span>CBT SD Negeri 4 Lalembuu</span>
                <span className="font-medium text-emerald-800">Bagian {index + 1}/3</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3 & 4: Khusus Admin / Proktor Utama (Logo, Ikon Navbar, Ikon Instalasi Multi-Device & Sandi Proktor) */}
      {isProktorAdmin && (
        <>
          <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100/90 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900 mt-0.5">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#102C1D]">
                    Pengaturan Identitas, Ikon Navbar & Ikon Instalasi Aplikasi (Khusus Admin / Proktor)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Atur Logo Halaman Login, Ikon Navbar/Sidebar, serta Ikon Aplikasi ketika diinstal di Laptop/PC, Android, dan iPhone/iPad
                  </p>
                </div>
              </div>

              {onOpenInstallModal && (
                <button
                  type="button"
                  data-testid="proktor-open-pwa-modal-btn"
                  onClick={() => {
                    sound.playClick();
                    onOpenInstallModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#143923] hover:bg-[#1E4F31] text-amber-300 border border-amber-400/50 text-xs font-extrabold flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Buka Ekstensi Install Aplikasi (Semua Device)</span>
                </button>
              )}
            </div>

            {brandingSavedMsg && (
              <div
                data-testid="branding-saved-banner"
                className="mt-4 p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{brandingSavedMsg}</span>
              </div>
            )}

            {/* 3 Icon Configuration Cards: Login Logo, Navbar Icon, Multi-Device PWA Install Icon */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 1. Logo Halaman Login */}
              <div className="p-4 rounded-2xl bg-[#F6FAF7] border border-emerald-100 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#18452B] flex items-center justify-center shadow-md border-2 border-amber-400/80 overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Preview Logo Login"
                        className="w-full h-full object-contain bg-white p-1"
                      />
                    ) : (
                      <GraduationCap className="w-7 h-7 text-amber-300" />
                    )}
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-[#12331F] text-[10px] font-bold mb-1">
                      1. Kartu Login Utama
                    </span>
                    <h4 className="text-xs font-bold text-[#102C1D]">
                      Logo Halaman Login
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Tampil di tengah atas kartu Login Siswa, Guru & Proktor.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                    id="upload-login-logo"
                  />
                  <label
                    htmlFor="upload-login-logo"
                    className="px-3 py-1.5 rounded-xl bg-[#153822] hover:bg-[#1E4F31] text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti Logo Login</span>
                  </label>

                  {logoPreview && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApplyIconToAll(logoPreview)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-[11px] cursor-pointer"
                        title="Gunakan gambar ini juga untuk Ikon Navbar & Ikon Install Aplikasi"
                      >
                        Terapkan ke Semua
                      </button>
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                        title="Reset Logo Login"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 2. Ikon Navbar & Sidebar */}
              <div className="p-4 rounded-2xl bg-[#F6FAF7] border border-emerald-100 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#18452B] flex items-center justify-center shadow-md border-2 border-emerald-400/80 overflow-hidden shrink-0">
                    {navbarIconPreview || logoPreview ? (
                      <img
                        src={navbarIconPreview || logoPreview || ''}
                        alt="Preview Ikon Navbar"
                        data-testid="proktor-navbar-icon-preview"
                        className="w-full h-full object-contain bg-white p-1"
                      />
                    ) : (
                      <GraduationCap className="w-7 h-7 text-amber-300" />
                    )}
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-[#12331F] text-[10px] font-bold mb-1">
                      2. Header Navbar & Sidebar
                    </span>
                    <h4 className="text-xs font-bold text-[#102C1D]">
                      Ikon Navbar & Favicon Tab
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Tampil di pojok kiri atas Navbar, Sidebar menu, dan ikon Tab Browser.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100">
                  <input
                    ref={navbarIconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleNavbarIconFileChange}
                    className="hidden"
                    id="upload-navbar-icon"
                    data-testid="upload-navbar-icon-input"
                  />
                  <label
                    htmlFor="upload-navbar-icon"
                    className="px-3 py-1.5 rounded-xl bg-[#153822] hover:bg-[#1E4F31] text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti Ikon Navbar</span>
                  </label>

                  {navbarIconPreview && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApplyIconToAll(navbarIconPreview)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-[11px] cursor-pointer"
                      >
                        Terapkan ke Semua
                      </button>
                      <button
                        type="button"
                        onClick={handleResetNavbarIcon}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                        title="Reset Ikon Navbar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 3. Ikon Aplikasi Saat Diinstal (Laptop, Android, iPhone/iPad) */}
              <div className="p-4 rounded-2xl bg-[#F6FAF7] border border-emerald-100 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md border-2 border-amber-500 overflow-hidden shrink-0 p-1">
                    <img
                      src={
                        pwaIconPreview ||
                        navbarIconPreview ||
                        logoPreview ||
                        '/pwa-192x192.png'
                      }
                      alt="Preview Ikon Install Aplikasi"
                      data-testid="proktor-pwa-icon-preview"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-950 text-[10px] font-bold mb-1">
                      <Laptop className="w-3 h-3" />
                      <Smartphone className="w-3 h-3" />
                      <span>3. Laptop, Android & iPhone</span>
                    </span>
                    <h4 className="text-xs font-bold text-[#102C1D]">
                      Ikon Aplikasi Saat Diinstal
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Ikon aplikasi ketika diinstal di Desktop Laptop/PC, HP Android, dan iPhone/iPad.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100">
                  <input
                    ref={pwaIconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePwaIconFileChange}
                    className="hidden"
                    id="upload-pwa-icon"
                    data-testid="upload-pwa-icon-input"
                  />
                  <label
                    htmlFor="upload-pwa-icon"
                    className="px-3 py-1.5 rounded-xl bg-[#153822] hover:bg-[#1E4F31] text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti Ikon Install</span>
                  </label>

                  {pwaIconPreview && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApplyIconToAll(pwaIconPreview)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-[11px] cursor-pointer"
                      >
                        Terapkan ke Semua
                      </button>
                      <button
                        type="button"
                        onClick={handleResetPwaIcon}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                        title="Reset Ikon Instalasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Form Nama Aplikasi Login & Nama Pintasan Ikon Aplikasi */}
            <form
              onSubmit={handleSaveBranding}
              className="mt-4 p-4 rounded-2xl bg-[#F6FAF7] border border-emerald-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
            >
              <div className="md:col-span-5">
                <label
                  htmlFor="admin-app-title-input"
                  className="block text-xs font-bold text-[#102C1D] mb-1"
                >
                  Nama Judul Aplikasi di Halaman Login:
                </label>
                <input
                  id="admin-app-title-input"
                  type="text"
                  value={appTitleInput}
                  onChange={(e) => setAppTitleInput(e.target.value)}
                  placeholder="Simulasi CBT / TKA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-[#122E1F] outline-none focus:border-[#1E4D34]"
                />
              </div>

              <div className="md:col-span-4">
                <label
                  htmlFor="admin-pwa-short-name-input"
                  className="block text-xs font-bold text-[#102C1D] mb-1"
                >
                  Nama Ikon Saat Diinstal (Maks. 12 Karakter):
                </label>
                <input
                  id="admin-pwa-short-name-input"
                  type="text"
                  maxLength={12}
                  value={pwaShortNameInput}
                  onChange={(e) => setPwaShortNameInput(e.target.value)}
                  placeholder="CBT SDN 4"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-[#122E1F] outline-none focus:border-[#1E4D34]"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  data-testid="save-branding-btn"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 font-bold text-xs border border-amber-400 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Nama & Ikon</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 4: Keamanan Otorisasi Login Admin / Proktor (Tersimpan Permanen lintas Refresh) */}
          <div className="card-3d rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm text-[#102C1D]">
                      Keamanan Otorisasi Login Admin / Proktor
                    </h4>
                    <span
                      data-testid="proktor-password-status-badge"
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        customProktorPassword &&
                        customProktorPassword.trim().length > 0
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {customProktorPassword &&
                      customProktorPassword.trim().length > 0
                        ? '● Sandi Kustom Aktif (Tersimpan Permanen)'
                        : '● Menggunakan Sandi Default Sistem'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Password baru yang Anda simpan di sini otomatis dikunci permanen di penyimpanan perangkat dan tidak akan kembali ke default meskipun halaman di-refresh.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSaveNewPassword}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2"
              >
                <div className="relative flex-1 sm:w-56">
                  <input
                    id="proktor-new-password-input"
                    data-testid="proktor-new-password-input"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => {
                      setNewPasswordInput(e.target.value);
                      setPasswordSavedMsg(null);
                    }}
                    placeholder="Ketik password proktor baru..."
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 outline-none focus:border-[#1E4D34]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                    aria-label="Tampilkan atau sembunyikan password baru"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  data-testid="save-proktor-password-btn"
                  className="px-4 py-2.5 rounded-xl bg-[#153822] hover:bg-[#1E4F31] text-amber-300 font-bold text-xs whitespace-nowrap cursor-pointer shadow-xs"
                >
                  Simpan Sandi Baru
                </button>

                {customProktorPassword &&
                  customProktorPassword.trim().length > 0 && (
                    <button
                      type="button"
                      data-testid="reset-proktor-password-btn"
                      onClick={handleResetDefaultPassword}
                      className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      title="Kembalikan ke password default sistem"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Default</span>
                    </button>
                  )}
              </form>
            </div>

            {passwordSavedMsg && (
              <div
                data-testid="proktor-password-saved-msg"
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  passwordSavedMsg.type === 'success'
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                {passwordSavedMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordSavedMsg.text}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};


