import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Layers,
  BookOpen,
  UserCheck,
  Eye,
  EyeOff,
  Play,
  KeyRound,
  School,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Mail,
  CheckCircle2,
  ChevronDown,
  Volume2,
  VolumeX,
  Volume1,
  Minus,
  Plus,
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  AppBrandingConfig,
  ExamConfig,
  Student,
  TeacherAccount,
} from '../types/cbt';
import { sound } from '../utils/soundEffects';
import {
  validateToken,
  verifyProktorPassword,
  verifyActivatedTeacherEmail,
} from '../utils/cbtLogic';

interface LoginPageProps {
  testSessions: ExamConfig[];
  branding: AppBrandingConfig;
  customProktorPassword?: string;
  students: Student[];
  teacherAccounts: TeacherAccount[];
  onLoginProktor: (loggedInTeacher: TeacherAccount) => void;
  onLoginTeacher: (loggedInTeacher: TeacherAccount) => void;
  onLoginStudent: (student: Student, selectedSession: ExamConfig) => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  onChangeFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  soundVolume: number;
  onChangeSoundVolume: (volume: number) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  testSessions,
  branding,
  customProktorPassword,
  students,
  teacherAccounts,
  onLoginProktor,
  onLoginTeacher,
  onLoginStudent,
  fontSize,
  onChangeFontSize,
  soundEnabled,
  onToggleSound,
  soundVolume,
  onChangeSoundVolume,
}) => {
  // Active sessions available for students to select
  const activeSessions = testSessions.filter((s) => s.status === 'active');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    activeSessions[0]?.id || testSessions[0]?.id || ''
  );

  const selectedSession =
    activeSessions.find((s) => s.id === selectedSessionId) ||
    activeSessions[0] ||
    testSessions[0];

  // Dropdown state for "Login Sebagai:" (3 distinct roles: Admin/Proktor, Guru Mapel, Siswa)
  const [role, setRole] = useState<'proktor' | 'guru_google' | 'student'>(
    'proktor'
  );

  // Admin/Proktor Password is NOT prefilled by default
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Activated Google Teacher Auth states (email entered directly by the teacher)
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('');
  const [googleAuthError, setGoogleAuthError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Student login fields
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[1]?.id || students[0]?.id || ''
  );
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');

  const handleProktorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const check = verifyProktorPassword(password, customProktorPassword);
    if (!check.isValid) {
      setPasswordError(check.message);
      return;
    }

    setPasswordError('');
    sound.playSuccess();
    const adminProktorAccount: TeacherAccount = teacherAccounts.find(
      (t) => t.role === 'proktor'
    ) || {
      id: 'teacher-1',
      name: 'Marhan, S.Pd.I., M.Pd.',
      email: 'marhaniza05@gmail.com',
      subject: 'Administrator & Proktor Utama',
      grade: 'Semua Kelas',
      role: 'proktor',
      status: 'active',
      activatedAt: '26 Okt 2026',
    };
    onLoginProktor(adminProktorAccount);
  };

  // Real Firebase Google Popup Sign-In with Activated Teacher Verification
  const handleFirebaseGooglePopup = async () => {
    sound.playClick();
    setGoogleAuthError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInEmail = result.user.email || '';
      const check = verifyActivatedTeacherEmail(signedInEmail, teacherAccounts);
      if (!check.isValid || !check.teacher) {
        setGoogleAuthError(check.message);
        setIsGoogleLoading(false);
        return;
      }
      sound.playSuccess();
      setIsGoogleLoading(false);
      // Route based on whether the Google account is proktor or guru_mapel
      if (check.teacher.role === 'proktor') {
        onLoginProktor(check.teacher);
      } else {
        onLoginTeacher({
          ...check.teacher,
          role: 'guru_mapel',
        });
      }
    } catch {
      setIsGoogleLoading(false);
      if (googleEmailInput.trim()) {
        const fallbackCheck = verifyActivatedTeacherEmail(
          googleEmailInput,
          teacherAccounts
        );
        if (fallbackCheck.isValid && fallbackCheck.teacher) {
          sound.playSuccess();
          if (fallbackCheck.teacher.role === 'proktor') {
            onLoginProktor(fallbackCheck.teacher);
          } else {
            onLoginTeacher({
              ...fallbackCheck.teacher,
              role: 'guru_mapel',
            });
          }
          return;
        }
      }
      setGoogleAuthError(
        'Masukkan alamat email Google Guru Mapel yang telah diaktivasi pada kolom di bawah ini.'
      );
    }
  };

  // Verified Google Email Login for Activated Subject Teachers
  const handleGoogleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const check = verifyActivatedTeacherEmail(googleEmailInput, teacherAccounts);
    if (!check.isValid || !check.teacher) {
      setGoogleAuthError(check.message);
      return;
    }
    setGoogleAuthError('');
    sound.playSuccess();
    if (check.teacher.role === 'proktor') {
      onLoginProktor(check.teacher);
    } else {
      onLoginTeacher({
        ...check.teacher,
        role: 'guru_mapel',
      });
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!selectedSession || selectedSession.status !== 'active') {
      setTokenError(
        'Belum ada Kode Tes yang aktif. Silakan tunggu arahan dari Guru/Proktor.'
      );
      return;
    }

    // Validate token specifically against the selected test session's token
    const tokenValidation = validateToken(
      tokenInput,
      selectedSession.token,
      selectedSession.isTokenActive,
      selectedSession.testCode
    );

    if (!tokenValidation.isValid) {
      setTokenError(tokenValidation.message);
      return;
    }

    setTokenError('');

    const currentStudent = students.find((s) => s.id === selectedStudentId);
    if (!currentStudent) {
      setTokenError('Pilih nama peserta ujian yang terdaftar.');
      return;
    }

    sound.playSuccess();
    onLoginStudent(currentStudent, selectedSession);
  };

  return (
    <div className="min-h-screen bg-[#77DD77] relative flex flex-col justify-between overflow-x-hidden text-stone-900 font-sans selection:bg-amber-400 selection:text-stone-900">
      {/* SDN 4 Lalembuu Photo Background with 14% Opacity */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.14]"
        style={{
          backgroundImage: `url('/assets/aistudio/SDN_4_Lalembuu_2_12e252b3.jpg')`,
        }}
      />

      {/* Subtle Bright Grid / Dots Pattern on #77DD77 */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #FFFFFF 1.4px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Header Bar matching School Identity (With Global Font Size & Audio Volume Controls for All Users) */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-3.5 border-b border-emerald-600/20 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 overflow-hidden">
              {branding.logoDataUrl ? (
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1">
                  <img
                    src={branding.logoDataUrl}
                    alt="Logo SD Negeri 4 Lalembuu"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-[#1B4D2E] rounded-[14px] flex items-center justify-center text-amber-300">
                  <School className="w-6 h-6" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-[15px] font-semibold tracking-normal text-[#11331F] uppercase">
                  SD NEGERI 4 LALEMBUU
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  Konawe Selatan
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium">
                APLIKASI ANBK – SIMULASI CBT / TKA KELAS SD
              </p>
            </div>
          </div>

          {/* Global Font Size & Audio Volume Controls accessible to all users */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Font Size A- / A / A+ */}
            <div
              className="flex items-center bg-[#F4FBF6] border border-emerald-200 rounded-full p-1 text-xs font-extrabold"
              role="group"
              aria-label="Pengaturan Ukuran Font Aplikasi"
            >
              <button
                type="button"
                data-testid="login-font-normal"
                onClick={() => {
                  onChangeFontSize('normal');
                  sound.playClick();
                }}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  fontSize === 'normal'
                    ? 'bg-[#173F28] text-amber-300 shadow-xs'
                    : 'text-[#173F28] hover:bg-emerald-100/70'
                }`}
                title="Ukuran Font Kecil / Normal (A-)"
              >
                A-
              </button>
              <button
                type="button"
                data-testid="login-font-large"
                onClick={() => {
                  onChangeFontSize('large');
                  sound.playClick();
                }}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  fontSize === 'large'
                    ? 'bg-[#173F28] text-amber-300 shadow-xs'
                    : 'text-[#173F28] hover:bg-emerald-100/70'
                }`}
                title="Ukuran Font Sedang (A)"
              >
                A
              </button>
              <button
                type="button"
                data-testid="login-font-xlarge"
                onClick={() => {
                  onChangeFontSize('xlarge');
                  sound.playClick();
                }}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  fontSize === 'xlarge'
                    ? 'bg-[#173F28] text-amber-300 shadow-xs'
                    : 'text-[#173F28] hover:bg-emerald-100/70'
                }`}
                title="Ukuran Font Besar (A+)"
              >
                A+
              </button>
            </div>

            {/* Audio Mute & Volume Controls (- / % / +) */}
            <div className="flex items-center gap-1 bg-[#F4FBF6] border border-emerald-200 rounded-full px-2 py-1">
              <button
                type="button"
                data-testid="login-audio-mute-btn"
                onClick={onToggleSound}
                className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  soundEnabled && soundVolume > 0
                    ? 'bg-white text-[#143B25] border border-emerald-200 shadow-2xs'
                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}
                title={
                  soundEnabled && soundVolume > 0
                    ? 'Mute Suara Aplikasi'
                    : 'Aktifkan Suara Aplikasi'
                }
              >
                {!soundEnabled || soundVolume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                ) : soundVolume < 50 ? (
                  <Volume1 className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>
                  {!soundEnabled || soundVolume === 0
                    ? 'Mute'
                    : 'Suara Aktif'}
                </span>
              </button>

              <button
                type="button"
                data-testid="login-volume-down-btn"
                onClick={() => {
                  const next = Math.max(0, soundVolume - 20);
                  onChangeSoundVolume(next);
                  if (next > 0) sound.playClick();
                }}
                className="w-6 h-6 rounded-full bg-white hover:bg-emerald-100 text-[#153C25] border border-emerald-200 flex items-center justify-center cursor-pointer"
                title="Perkecil Volume Audio (-20%)"
              >
                <Minus className="w-3 h-3" />
              </button>

              <span
                data-testid="login-volume-label"
                className="text-[11px] font-mono font-bold text-[#143B25] min-w-[34px] text-center"
              >
                {soundEnabled ? `${soundVolume}%` : '0%'}
              </span>

              <button
                type="button"
                data-testid="login-volume-up-btn"
                onClick={() => {
                  const next = Math.min(100, soundVolume + 20);
                  onChangeSoundVolume(next);
                  sound.playClick();
                }}
                className="w-6 h-6 rounded-full bg-white hover:bg-emerald-100 text-[#153C25] border border-emerald-200 flex items-center justify-center cursor-pointer"
                title="Perbesar Volume Audio (+20%)"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[500px]">
          <div className="card-3d rounded-3xl p-6 sm:p-8 relative text-stone-800">
            {/* Top Icon / Custom Logo Badge */}
            <div className="flex justify-center -mt-14 mb-4">
              {branding.logoDataUrl ? (
                <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center p-1.5 overflow-hidden">
                  <img
                    src={branding.logoDataUrl}
                    alt="Logo Aplikasi CBT"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#23633B] to-[#174629] border-4 border-white shadow-xl flex items-center justify-center text-amber-300">
                  <GraduationCap className="w-9 h-9" />
                </div>
              )}
            </div>

            {/* Title & Active Kode Tes Badge */}
            <div className="text-center mb-5">
              <h2 className="text-lg sm:text-xl font-semibold text-[#132F20] tracking-normal">
                {branding.loginAppTitle || 'Simulasi CBT / TKA'}
              </h2>
              <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-[#183D29]">
                <span>Kode Tes:</span>
                <span className="font-mono text-amber-700 font-semibold">
                  {selectedSession ? selectedSession.testCode : 'BELUM ADA TES'}
                </span>
              </div>
            </div>

            {/* Locked Info Section reflecting the selected Kode Tes */}
            {selectedSession && (
              <div className="space-y-2.5 mb-5">
                <div className="bg-[#F6F9F7] rounded-xl p-3 border border-emerald-100/90 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-100/80 text-[#1A412B]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-stone-500 block leading-tight">
                        Jenjang Pendidikan:
                      </span>
                      <span className="text-xs font-bold text-[#132E1F]">
                        {selectedSession.educationLevel} ({selectedSession.grade})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-stone-700" />
                    <span>Terkunci</span>
                  </div>
                </div>

                <div className="bg-[#F6F9F7] rounded-xl p-3 border border-emerald-100/90 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-100/80 text-[#1A412B]">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-stone-500 block leading-tight">
                        Mata Pelajaran:
                      </span>
                      <span className="text-xs font-bold text-[#132E1F]">
                        {selectedSession.subject} • {selectedSession.questionCount} Soal (
                        {selectedSession.durationMinutes} Menit)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-stone-700" />
                    <span>Terkunci</span>
                  </div>
                </div>
              </div>
            )}

            {/* Login Sebagai Dropdown (3 Distinct Roles: Admin/Proktor, Guru Mapel, Siswa) */}
            <div className="mb-5">
              <label
                htmlFor="login-role-select"
                className="flex items-center gap-1.5 text-xs font-bold text-[#1A3D29] mb-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-800" />
                <span>Login Sebagai:</span>
              </label>
              <div className="relative">
                <select
                  id="login-role-select"
                  data-testid="login-role-select"
                  value={role}
                  onChange={(e) => {
                    sound.playSelect();
                    const nextRole = e.target.value as
                      | 'proktor'
                      | 'guru_google'
                      | 'student';
                    setRole(nextRole);
                    setPasswordError('');
                    setGoogleAuthError('');
                    setTokenError('');
                  }}
                  className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border-2 border-emerald-300/90 hover:border-emerald-500 focus:border-[#1E4D34] focus:ring-2 focus:ring-[#1E4D34]/20 outline-none text-xs sm:text-sm font-extrabold text-[#122E1F] bg-white shadow-xs transition-all cursor-pointer"
                >
                  <option value="proktor">
                    Login Admin / Proktor (Kontrol Penuh Sistem)
                  </option>
                  <option value="guru_google">
                    Login Guru Mapel (Autentikasi Akun Google)
                  </option>
                  <option value="student">
                    Login Siswa (Peserta Ujian CBT)
                  </option>
                </select>
                <ChevronDown className="w-4 h-4 text-emerald-900 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 1. Admin / Proktor Password Form */}
            {role === 'proktor' && (
              <div className="space-y-4">
                <form onSubmit={handleProktorSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="proktor-password-input"
                      className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-1"
                    >
                      <Lock className="w-3.5 h-3.5 text-stone-500" />
                      <span>Password Admin / Proktor:</span>
                    </label>
                    <div className="relative">
                      <input
                        id="proktor-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError('');
                        }}
                        placeholder="Masukkan password resmi Admin / Proktor"
                        autoComplete="off"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 focus:border-[#1E4D34] focus:ring-2 focus:ring-[#1E4D34]/20 outline-none text-sm text-stone-900 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-rose-600 text-xs mt-1.5 font-semibold flex items-center gap-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{passwordError}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-3d w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#173C27] to-[#204F34] hover:from-[#1D4830] hover:to-[#265F3E] text-amber-300 border border-amber-400/40 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-amber-300" />
                    <span>Masuk Mode Admin / Proktor</span>
                  </button>
                </form>
              </div>
            )}

            {/* 2. Guru Mapel (Autentikasi Google Teraktivasi) */}
            {role === 'guru_google' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950">
                  <div className="font-extrabold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Akses Khusus Guru Mata Pelajaran</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Masuk menggunakan Akun Google Guru yang telah diaktivasi oleh Admin/Proktor untuk mengelola soal, memantau peserta, dan melihat nilai mata pelajaran Anda.
                  </p>
                </div>

                {/* Official Google Sign-In Popup Button */}
                <button
                  type="button"
                  onClick={handleFirebaseGooglePopup}
                  disabled={isGoogleLoading}
                  className="btn-3d w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-50 text-stone-900 border-2 border-stone-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>
                    {isGoogleLoading
                      ? 'Memverifikasi Akun Google...'
                      : 'Sign in with Google (Guru Mapel)'}
                  </span>
                </button>

                {/* Activated Google Email Verification Form */}
                <form onSubmit={handleGoogleTeacherSubmit} className="space-y-3 pt-1">
                  <div>
                    <label
                      htmlFor="teacher-google-email-input"
                      className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-1"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Email Akun Google Guru Teraktivasi:</span>
                    </label>
                    <input
                      id="teacher-google-email-input"
                      type="email"
                      value={googleEmailInput}
                      onChange={(e) => {
                        setGoogleEmailInput(e.target.value);
                        setGoogleAuthError('');
                      }}
                      placeholder="Masukkan email Google guru yang telah diaktivasi"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold text-stone-900 bg-white outline-none focus:border-[#1E4D34]"
                    />
                  </div>

                  {googleAuthError && (
                    <p className="text-rose-600 text-xs font-semibold flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{googleAuthError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    data-testid="submit-google-teacher-btn"
                    className="btn-3d w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#173C27] to-[#204F34] hover:from-[#1D4830] hover:to-[#265F3E] text-amber-300 border border-amber-400/40 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>Masuk Halaman Guru Mapel</span>
                  </button>
                </form>
              </div>
            )}

            {/* 3. Student Form (Allows selecting Kode Tes directed by Teacher) */}
            {role === 'student' && (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                {/* 1. Pilih Kode Tes yang Diarahkan Guru */}
                <div>
                  <label
                    htmlFor="student-testcode-select"
                    className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between"
                  >
                    <span>1. Pilih Kode Tes (Sesuai Arahan Guru):</span>
                    <span className="text-[11px] font-bold text-emerald-800">
                      {activeSessions.length} Tes Aktif
                    </span>
                  </label>
                  {activeSessions.length > 0 ? (
                    <div className="relative">
                      <select
                        id="student-testcode-select"
                        value={selectedSession?.id || ''}
                        onChange={(e) => {
                          sound.playSelect();
                          setSelectedSessionId(e.target.value);
                          setTokenError('');
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 focus:border-[#1E4D34] focus:ring-2 focus:ring-[#1E4D34]/20 outline-none text-xs font-bold text-[#122E1F] bg-emerald-50/50"
                      >
                        {activeSessions.map((sess) => (
                          <option key={sess.id} value={sess.id}>
                            {sess.testCode} — {sess.subject} ({sess.grade})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold">
                      Belum ada Kode Tes yang diaktifkan oleh Proktor.
                    </div>
                  )}
                </div>

                {/* 2. Pilih Nama Siswa */}
                <div>
                  <label
                    htmlFor="student-name-select"
                    className="block text-xs font-bold text-stone-700 mb-1"
                  >
                    2. Pilih Nama Peserta (SD Negeri 4 Lalembuu):
                  </label>
                  <select
                    id="student-name-select"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-[#1E4D34] focus:ring-2 focus:ring-[#1E4D34]/20 outline-none text-xs text-stone-900 bg-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nisn} - {s.name} ({s.grade})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Masukkan Token Sesuai Kode Tes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="student-token-input"
                      className="text-xs font-bold text-stone-700"
                    >
                      3. Token Ujian ({selectedSession?.testCode}):
                    </label>
                    <span
                      className={`text-[11px] font-bold ${
                        selectedSession?.isTokenActive
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {selectedSession?.isTokenActive
                        ? '● Token Siap Diverifikasi'
                        : '○ Token Belum Rilis'}
                    </span>
                  </div>

                  <input
                    id="student-token-input"
                    type="text"
                    maxLength={6}
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value.toUpperCase());
                      setTokenError('');
                    }}
                    placeholder="Masukkan 6 digit token dari Guru/Proktor"
                    className="w-full px-3.5 py-2.5 font-mono tracking-widest text-center text-base font-bold rounded-xl border border-stone-300 focus:border-[#1E4D34] focus:ring-2 focus:ring-[#1E4D34]/20 outline-none uppercase text-[#122E1F] bg-white"
                  />

                  <p className="text-[11px] text-stone-500 mt-1.5 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>
                      Masukkan token resmi untuk kode tes{' '}
                      <strong>{selectedSession?.testCode}</strong>
                    </span>
                  </p>

                  {tokenError && (
                    <p className="text-rose-600 text-xs mt-1.5 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                      {tokenError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedSession || activeSessions.length === 0}
                  className="btn-3d w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 border border-amber-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Mulai Kerjakan Ujian CBT</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer (Bright 3D White Pill on #77DD77 Background) */}
      <footer className="relative z-10 py-5 text-center px-4">
        <div className="max-w-xl mx-auto px-5 py-2.5 rounded-full card-3d text-xs text-[#11331F] font-semibold">
          <span>Copyright © 2026 SD Negeri 4 Lalembuu. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};
