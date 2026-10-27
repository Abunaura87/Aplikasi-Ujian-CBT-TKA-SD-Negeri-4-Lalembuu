import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Mail,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Power,
  Trash2,
  Play,
  GraduationCap,
  Users,
  BookOpen,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import { ExamConfig, Student, TeacherAccount } from '../types/cbt';
import {
  createDemoTeacherAccount,
  createDemoStudentAccount,
} from '../utils/cbtLogic';
import { sound } from '../utils/soundEffects';

interface TeacherAccountActivationTabProps {
  teacherAccounts: TeacherAccount[];
  students: Student[];
  activeExamConfig: ExamConfig;
  onAddTeacherAccount: (newTeacher: TeacherAccount) => void;
  onToggleTeacherStatus: (teacherId: string) => void;
  onDeleteTeacherAccount: (teacherId: string) => void;
  onAddDemoStudent: (demoStudent: Student) => void;
  onSwitchLoggedInTeacher: (teacher: TeacherAccount) => void;
  onStartDemoStudentExam: (student: Student) => void;
}

export const TeacherAccountActivationTab: React.FC<
  TeacherAccountActivationTabProps
> = ({
  teacherAccounts,
  students,
  activeExamConfig,
  onAddTeacherAccount,
  onToggleTeacherStatus,
  onDeleteTeacherAccount,
  onAddDemoStudent,
  onSwitchLoggedInTeacher,
  onStartDemoStudentExam,
}) => {
  // New Teacher Activation Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nip, setNip] = useState('');
  const [subject, setSubject] = useState('Literasi & Numerasi');
  const [grade, setGrade] = useState('Kelas 5');
  const [autoActivate, setAutoActivate] = useState(true);

  // Demo Creator Form State
  const [demoTeacherName, setDemoTeacherName] = useState('');
  const [demoTeacherSubject, setDemoTeacherSubject] = useState('IPAS');
  const [demoStudentName, setDemoStudentName] = useState('');
  const [demoStudentGrade, setDemoStudentGrade] = useState('Kelas 5A');

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleActivateNewTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
      setFeedback({
        type: 'error',
        message:
          'Nama lengkap guru dan alamat email Akun Google (@gmail.com / @guru.sd.belajar.id) wajib diisi dengan benar.',
      });
      return;
    }

    const exists = teacherAccounts.some(
      (t) => t.email.trim().toLowerCase() === cleanEmail
    );
    if (exists) {
      setFeedback({
        type: 'error',
        message: `Email Google "${cleanEmail}" sudah terdaftar dalam sistem.`,
      });
      return;
    }

    const newTeacher: TeacherAccount = {
      id: `teacher-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      nip: nip.trim() || '-',
      subject,
      grade,
      role: 'guru_mapel',
      status: autoActivate ? 'active' : 'inactive',
      isDemo: false,
      activatedAt: new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
    };

    sound.playSuccess();
    onAddTeacherAccount(newTeacher);
    setName('');
    setEmail('');
    setNip('');
    setFeedback({
      type: 'success',
      message: `Akun Google Guru Mapel "${cleanName}" (${cleanEmail}) berhasil ditambahkan dan ${
        autoActivate ? 'diaktifkan untuk Login Google!' : 'disimpan sebagai draft.'
      }`,
    });
  };

  const handleCreateQuickDemoTeacher = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playSuccess();
    const demoTeacher = createDemoTeacherAccount(
      teacherAccounts,
      demoTeacherName,
      demoTeacherSubject,
      'Kelas 5'
    );
    onAddTeacherAccount(demoTeacher);
    setDemoTeacherName('');
    setFeedback({
      type: 'success',
      message: `Akun Demo Guru "${demoTeacher.name}" (${demoTeacher.email}) berhasil dibuat & diaktifkan! Siap digunakan untuk Login Google.`,
    });
  };

  const handleCreateQuickDemoStudent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playSuccess();
    const demoStudent = createDemoStudentAccount(
      students,
      activeExamConfig.testCode,
      activeExamConfig.questionCount,
      activeExamConfig.durationMinutes,
      demoStudentName,
      demoStudentGrade
    );
    onAddDemoStudent(demoStudent);
    setDemoStudentName('');
    setFeedback({
      type: 'success',
      message: `Akun Demo Siswa "${demoStudent.name}" (NISN: ${demoStudent.nisn}) berhasil dibuat untuk Kode Tes ${activeExamConfig.testCode}!`,
    });
  };

  const handleCopyEmail = (targetEmail: string) => {
    sound.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetEmail).catch(() => {});
    }
    setCopiedEmail(targetEmail);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const activeTeachersCount = teacherAccounts.filter(
    (t) => t.status === 'active'
  ).length;
  const demoTeachers = teacherAccounts.filter((t) => t.isDemo);
  const demoStudents = students.filter((s) => s.isDemo);

  return (
    <div className="space-y-6">
      {/* Header Banner Card */}
      <div className="card-3d rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-[11px] font-semibold text-[#143E26] mb-2">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Otorisasi Google OAuth Guru Mapel & Generator Akun Demo</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#102D1D] tracking-normal">
              Aktivasi Akun Google Guru Mapel & Menu Akun Demo
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Aktifkan email Google guru mata pelajaran agar dapat login menggunakan metode Autentikasi Google, atau buat akun demo Guru & Siswa untuk simulasi.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 min-w-[310px]">
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3 text-center shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-800 block">
                Guru Teraktivasi
              </span>
              <span className="text-xl font-semibold text-[#12311E]">
                {activeTeachersCount}
              </span>
              <span className="text-[10px] text-emerald-700 block">
                Siap Login Google
              </span>
            </div>
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 text-center shadow-xs">
              <span className="text-[11px] font-semibold text-amber-900 block">
                Akun Demo Guru
              </span>
              <span className="text-xl font-semibold text-amber-700">
                {demoTeachers.length}
              </span>
              <span className="text-[10px] text-amber-800 block">
                Google Demo Aktif
              </span>
            </div>
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3 text-center shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-900 block">
                Akun Demo Siswa
              </span>
              <span className="text-xl font-semibold text-emerald-800">
                {demoStudents.length}
              </span>
              <span className="text-[10px] text-emerald-700 block">
                Siap Ujian CBT
              </span>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`card-3d p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] underline cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Section 1: Form Aktivasi Akun Google Guru Mapel */}
      <div className="card-3d rounded-3xl p-6 sm:p-8">
        <div className="flex items-start gap-3 pb-4 border-b border-stone-100 mb-5">
          <div className="p-2.5 rounded-2xl bg-[#153822] text-amber-300 shadow-sm">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#102C1D]">
              Form Pengaktifan Akun Google Guru Mata Pelajaran
            </h3>
            <p className="text-xs text-stone-500">
              Daftarkan alamat email Google resmi guru. Hanya email yang berstatus <strong>Aktif</strong> yang diizinkan masuk melalui tombol Autentikasi Google di halaman Login.
            </p>
          </div>
        </div>

        <form onSubmit={handleActivateNewTeacher} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                1. Nama Lengkap Guru & Gelar:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Siti Aminah, S.Pd."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 bg-white focus:border-[#1E4D34] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                2. Email Akun Google Guru:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama.guru@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 bg-white focus:border-[#1E4D34] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                3. Mata Pelajaran Ampuan:
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 bg-white focus:border-[#1E4D34] outline-none"
              >
                <option value="Literasi & Numerasi">Literasi & Numerasi (ANBK)</option>
                <option value="Literasi Membaca">Literasi Membaca (B. Indonesia)</option>
                <option value="Numerasi Matematika">Numerasi Matematika</option>
                <option value="IPAS">IPAS (Sains & Sosial)</option>
                <option value="Pendidikan Agama Islam">Pendidikan Agama Islam (PAI)</option>
                <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                <option value="PJOK">PJOK (Olahraga)</option>
                <option value="Seni Budaya">Seni Budaya & Prakarya</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  4. Kelas:
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 bg-white focus:border-[#1E4D34] outline-none"
                >
                  <optgroup label="Jenjang SD/MI">
                    <option value="Kelas 1">Kelas 1 SD/MI</option>
                    <option value="Kelas 2">Kelas 2 SD/MI</option>
                    <option value="Kelas 3">Kelas 3 SD/MI</option>
                    <option value="Kelas 4">Kelas 4 SD/MI</option>
                    <option value="Kelas 5">Kelas 5 SD/MI</option>
                    <option value="Kelas 6">Kelas 6 SD/MI</option>
                  </optgroup>
                  <optgroup label="Jenjang SMP/MTs">
                    <option value="Kelas 7">Kelas 7 SMP/MTs</option>
                    <option value="Kelas 8">Kelas 8 SMP/MTs</option>
                    <option value="Kelas 9">Kelas 9 SMP/MTs</option>
                  </optgroup>
                  <optgroup label="Jenjang SMA/MA">
                    <option value="Kelas 10">Kelas 10 SMA/MA</option>
                    <option value="Kelas 11">Kelas 11 SMA/MA</option>
                    <option value="Kelas 12">Kelas 12 SMA/MA</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  5. NIP (Opsional):
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="198..."
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 bg-white focus:border-[#1E4D34] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoActivate}
                onChange={(e) => setAutoActivate(e.target.checked)}
                className="w-4 h-4 rounded accent-[#153822]"
              />
              <span>
                Langsung aktifkan otorisasi Google Sign-In untuk email guru ini
              </span>
            </label>

            <button
              type="submit"
              className="btn-3d px-5 py-2.5 rounded-2xl bg-[#153822] hover:bg-[#1E4F31] text-amber-300 font-extrabold text-xs border border-amber-400/50 flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Aktifkan Akun Google Guru</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Daftar Akun Google Guru Mapel yang Terdaftar */}
      <div className="card-3d rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100 mb-5">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#102C1D]">
              Daftar Akun Google Guru Mapel & Status Aktivasi
            </h3>
            <p className="text-xs text-stone-500">
              Kelola hak akses login Google masing-masing guru mata pelajaran di SD Negeri 4 Lalembuu
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-emerald-900">
            Total {teacherAccounts.length} Akun Guru
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teacherAccounts.map((teacher) => {
            const isActive = teacher.status === 'active';
            return (
              <div
                key={teacher.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'card-3d bg-white'
                    : 'bg-stone-50/90 border-stone-200 opacity-85'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${
                          isActive
                            ? 'bg-gradient-to-br from-[#153A24] to-[#235E3B] text-amber-300 shadow-sm'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-semibold text-sm text-[#112F1E]">
                            {teacher.name}
                          </h4>
                          {teacher.isDemo && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                              AKUN DEMO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-xs font-bold text-emerald-800">
                            {teacher.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(teacher.email)}
                            className="p-1 rounded hover:bg-emerald-100 text-stone-500 hover:text-emerald-900 cursor-pointer"
                            title="Salin email Google"
                          >
                            {copiedEmail === teacher.email ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isActive ? '● Google Aktif' : '○ Non-Aktif'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#F6FAF7] border border-emerald-100 text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold block uppercase">
                        Mata Pelajaran
                      </span>
                      <span className="font-bold text-[#133320]">
                        {teacher.subject}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold block uppercase">
                        Kelas & Waktu Aktivasi
                      </span>
                      <span className="font-bold text-stone-700">
                        {teacher.grade} • {teacher.activatedAt}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onToggleTeacherStatus(teacher.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>
                        {isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun Google'}
                      </span>
                    </button>

                    {teacher.role !== 'proktor' && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          onDeleteTeacherAccount(teacher.id);
                        }}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                        title="Hapus akun guru"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playSuccess();
                        onSwitchLoggedInTeacher(teacher);
                        setFeedback({
                          type: 'success',
                          message: `Sesi aktif beralih ke akun Google Guru: ${teacher.name} (${teacher.email}).`,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#133822] border border-emerald-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Gunakan Sesi Guru Ini</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Menu Pembuat Akun Demo untuk Guru dan Siswa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Buat Akun Demo Guru */}
        <div className="card-3d-gold rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-stone-950 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Generator Demo Guru
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-[#102C1D] mt-1">
                    Buat Akun Demo Guru Mapel
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Buat akun demo Guru Mapel dengan email Google teraktivasi secara instan untuk menguji fitur <strong>Login Autentikasi Google</strong> dan pengelolaan soal ujian.
            </p>

            <form onSubmit={handleCreateQuickDemoTeacher} className="space-y-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Nama Guru Demo (Opsional):
                  </label>
                  <input
                    type="text"
                    value={demoTeacherName}
                    onChange={(e) => setDemoTeacherName(e.target.value)}
                    placeholder="Kosongkan untuk otomatis..."
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-stone-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Mata Pelajaran Demo:
                  </label>
                  <select
                    value={demoTeacherSubject}
                    onChange={(e) => setDemoTeacherSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-stone-800 outline-none"
                  >
                    <option value="IPAS">IPAS</option>
                    <option value="Literasi & Numerasi">Literasi & Numerasi</option>
                    <option value="Numerasi Matematika">Numerasi Matematika</option>
                    <option value="Pendidikan Agama Islam">Pendidikan Agama Islam</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                data-testid="create-demo-teacher-btn"
                className="btn-3d w-full py-2.5 px-4 rounded-2xl bg-[#153822] hover:bg-[#1C4B2E] text-amber-300 font-extrabold text-xs border border-amber-400/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Buat Akun Demo Guru (Aktif Otomatis)</span>
              </button>
            </form>
          </div>

          {/* List of Demo Teachers */}
          <div className="pt-3 border-t border-amber-200/80">
            <span className="text-[11px] font-extrabold text-amber-950 block mb-2">
              Daftar Akun Demo Guru Siap Pakai ({demoTeachers.length}):
            </span>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {demoTeachers.map((dt) => (
                <div
                  key={dt.id}
                  className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-stone-900 truncate">
                      {dt.name}
                    </div>
                    <div className="font-mono text-[11px] text-emerald-800 truncate">
                      {dt.email} • {dt.subject}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSuccess();
                      onSwitchLoggedInTeacher(dt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-[11px] shrink-0 cursor-pointer"
                  >
                    Pakai Demo
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card B: Buat Akun Demo Siswa */}
        <div className="card-3d rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-[#143923] text-amber-300 shadow-sm">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Generator Demo Siswa
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-[#102C1D] mt-1">
                    Buat Akun Demo Siswa (Peserta CBT)
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Buat akun peserta ujian demo yang otomatis terdaftar pada Kode Tes aktif (<strong>{activeExamConfig.testCode}</strong> — Token: <strong className="font-mono text-amber-700">{activeExamConfig.token}</strong>) untuk menguji pengerjaan soal CBT.
            </p>

            <form onSubmit={handleCreateQuickDemoStudent} className="space-y-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Nama Siswa Demo (Opsional):
                  </label>
                  <input
                    type="text"
                    value={demoStudentName}
                    onChange={(e) => setDemoStudentName(e.target.value)}
                    placeholder="Kosongkan untuk otomatis..."
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-semibold text-stone-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Kelas Rombel Demo:
                  </label>
                  <select
                    value={demoStudentGrade}
                    onChange={(e) => setDemoStudentGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-semibold text-stone-800 outline-none"
                  >
                    <option value="Kelas 5A">Kelas 5A</option>
                    <option value="Kelas 5B">Kelas 5B</option>
                    <option value="Kelas 6A">Kelas 6A</option>
                    <option value="Kelas 6B">Kelas 6B</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                data-testid="create-demo-student-btn"
                className="btn-3d w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-stone-950 font-extrabold text-xs border border-amber-500 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>+ Buat Akun Demo Siswa Baru</span>
              </button>
            </form>
          </div>

          {/* List of Demo Students */}
          <div className="pt-3 border-t border-emerald-100">
            <span className="text-[11px] font-extrabold text-emerald-950 block mb-2">
              Daftar Akun Demo Siswa ({demoStudents.length} Peserta Demo):
            </span>
            {demoStudents.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">
                Klik tombol di atas untuk membuat akun demo siswa pertama.
              </p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {demoStudents.map((ds) => (
                  <div
                    key={ds.id}
                    className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-stone-900 truncate">
                        {ds.name}
                      </div>
                      <div className="font-mono text-[11px] text-emerald-800 truncate">
                        NISN: {ds.nisn} • {ds.grade}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playSuccess();
                        onStartDemoStudentExam(ds);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#153822] hover:bg-[#1E4F31] text-amber-300 font-extrabold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-amber-300" />
                      <span>Mulai Simulasi</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
