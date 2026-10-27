import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Power,
  Archive,
  Layers,
  Clock,
  BookOpen,
  Sparkles,
  Check,
} from 'lucide-react';
import { ExamConfig } from '../types/cbt';
import {
  generateUniqueTestCode,
  generateUniqueToken,
  validateTestCodeUniqueness,
  getCurriculumTopics,
  getGradesForEducationLevel,
  getDefaultGradeForLevel,
} from '../utils/cbtLogic';
import { sound } from '../utils/soundEffects';

interface TestCodeActivationTabProps {
  testSessions: ExamConfig[];
  activeSessionId: string;
  usedTestCodes: string[];
  onSelectActiveSession: (sessionId: string) => void;
  onCreateTestSession: (newSession: ExamConfig) => void;
  onToggleSessionStatus: (sessionId: string, nextStatus: 'active' | 'inactive' | 'archived') => void;
  onToggleSessionToken: (sessionId: string) => void;
  onRegenerateSessionToken: (sessionId: string) => void;
}

export const TestCodeActivationTab: React.FC<TestCodeActivationTabProps> = ({
  testSessions,
  activeSessionId,
  usedTestCodes,
  onSelectActiveSession,
  onCreateTestSession,
  onToggleSessionStatus,
  onToggleSessionToken,
  onRegenerateSessionToken,
}) => {
  const [newSubject, setNewSubject] = useState('Literasi Membaca');
  const [newEducationLevel, setNewEducationLevel] = useState('Jenjang SD/MI');
  const [newGrade, setNewGrade] = useState('Kelas 5');
  const [newQuestionCount, setNewQuestionCount] = useState(15);
  const [newDuration, setNewDuration] = useState(45);
  const [customCodeInput, setCustomCodeInput] = useState(() =>
    generateUniqueTestCode('Literasi Membaca', 'Kelas 5', usedTestCodes)
  );
  const [autoActivate, setAutoActivate] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Live uniqueness check against all usedTestCodes
  const uniquenessCheck = validateTestCodeUniqueness(customCodeInput, usedTestCodes);

  const handleGenerateFreshCode = () => {
    sound.playClick();
    const fresh = generateUniqueTestCode(newSubject, newGrade, usedTestCodes);
    setCustomCodeInput(fresh);
    setFeedbackMsg(null);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!uniquenessCheck.isUnique) {
      setFeedbackMsg({
        type: 'error',
        text: uniquenessCheck.message,
      });
      return;
    }

    const existingTokens = testSessions.map((s) => s.token);
    const uniqueToken = generateUniqueToken(existingTokens);
    const defaultQuestions = testSessions[0]?.questions || [];

    const created: ExamConfig = {
      id: `session-${Date.now()}`,
      testCode: uniquenessCheck.cleanCode,
      educationLevel: newEducationLevel,
      grade: newGrade,
      subject: newSubject,
      questionCount: newQuestionCount,
      durationMinutes: newDuration,
      isTokenActive: autoActivate,
      token: uniqueToken,
      tokenGeneratedAt: new Date().toISOString(),
      determinationMode: 'auto',
      materialTopics: getCurriculumTopics(newSubject, newGrade),
      status: autoActivate ? 'active' : 'inactive',
      createdAt: new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
      questions: [...defaultQuestions],
    };

    sound.playSuccess();
    onCreateTestSession(created);

    // Prepare next unique code immediately so current code cannot be submitted twice
    const nextUpdatedUsed = [...usedTestCodes, uniquenessCheck.cleanCode];
    setCustomCodeInput(generateUniqueTestCode(newSubject, newGrade, nextUpdatedUsed));
    setFeedbackMsg({
      type: 'success',
      text: `Kode Tes "${uniquenessCheck.cleanCode}" berhasil dibuat dengan Token Unik "${uniqueToken}" dan telah dikunci di registri agar tidak ganda!`,
    });
  };

  const activeCount = testSessions.filter((s) => s.status === 'active').length;
  const tokenActiveCount = testSessions.filter((s) => s.status === 'active' && s.isTokenActive).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#143E26] mb-2">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Manajemen Multi-Sesi & Proteksi Kode Tes Tunggal</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#102D1D] tracking-normal">
              Halaman Pengaktifan Kode Tes & Token CBT
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Kelola lebih dari 1 sesi ujian dengan token berbeda. Kode tes yang sudah terdaftar dikunci permanen agar tidak ganda.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 min-w-[300px]">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 text-center">
              <span className="text-[11px] font-semibold text-emerald-800 block">Tes Aktif</span>
              <span className="text-xl font-semibold text-[#12311E]">{activeCount}</span>
              <span className="text-[10px] text-emerald-700 block">Tampil di Siswa</span>
            </div>
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 text-center">
              <span className="text-[11px] font-semibold text-amber-900 block">Token Rilis</span>
              <span className="text-xl font-semibold text-amber-700">{tokenActiveCount}</span>
              <span className="text-[10px] text-amber-800 block">Token Berbeda</span>
            </div>
            <div className="bg-stone-100 border border-stone-200 rounded-2xl p-3 text-center">
              <span className="text-[11px] font-semibold text-stone-600 block">Kode Terpakai</span>
              <span className="text-xl font-semibold text-stone-800">{usedTestCodes.length}</span>
              <span className="text-[10px] text-stone-500 block">Terkunci Unik</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Unique Test Code Form */}
      <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
        <div className="flex items-start gap-3 pb-4 border-b border-stone-100 mb-5">
          <div className="p-2.5 rounded-xl bg-[#153822] text-amber-300">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#102C1D]">
              Buat & Aktifkan Kode Tes Baru (Token Berbeda)
            </h3>
            <p className="text-xs text-stone-500">
              Setiap tes baru wajib menggunakan kode tes unik yang belum pernah dipakai sebelumnya dan akan mendapatkan token khusus.
            </p>
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`mb-5 p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleCreateSession} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kode Tes Input with anti-duplicate check */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700">
                  Kode Tes Baru (Wajib Unik):
                </label>
                <button
                  type="button"
                  onClick={handleGenerateFreshCode}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Acak Kode Unik</span>
                </button>
              </div>
              <input
                type="text"
                value={customCodeInput}
                onChange={(e) => {
                  setCustomCodeInput(e.target.value.toUpperCase());
                  setFeedbackMsg(null);
                }}
                placeholder="Misal: CBT-2026-SD4-PAI-004"
                className={`w-full px-3.5 py-2.5 font-mono text-xs font-bold rounded-xl border outline-none uppercase ${
                  uniquenessCheck.isUnique
                    ? 'border-emerald-400 focus:border-[#153822] bg-white text-[#122E1F]'
                    : 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-600'
                }`}
              />
              {uniquenessCheck.isUnique ? (
                <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{uniquenessCheck.message}</span>
                </p>
              ) : (
                <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-start gap-1">
                  <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{uniquenessCheck.message}</span>
                </p>
              )}
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Mata Pelajaran Ujian:
              </label>
              <select
                value={newSubject}
                onChange={(e) => {
                  const sub = e.target.value;
                  setNewSubject(sub);
                  setCustomCodeInput(generateUniqueTestCode(sub, newGrade, usedTestCodes));
                }}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-stone-300 bg-white text-stone-800 outline-none focus:border-[#1E4D34]"
              >
                <option value="Literasi & Numerasi">Literasi & Numerasi (ANBK)</option>
                <option value="Literasi Membaca">Literasi Membaca (Bahasa Indonesia)</option>
                <option value="Numerasi Matematika">Numerasi Matematika</option>
                <option value="IPAS">IPAS (Ilmu Pengetahuan Alam & Sosial)</option>
                <option value="Pendidikan Agama Islam">Pendidikan Agama Islam (PAI)</option>
                <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                <option value="Seni Budaya">Seni Budaya & Prakarya</option>
                <option value="PJOK">PJOK (Olahraga)</option>
              </select>
            </div>

            {/* Jenjang Pendidikan */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Jenjang Pendidikan:
              </label>
              <select
                value={newEducationLevel}
                onChange={(e) => {
                  const nextLvl = e.target.value;
                  const syncedGrd = getDefaultGradeForLevel(nextLvl);
                  setNewEducationLevel(nextLvl);
                  setNewGrade(syncedGrd);
                  setCustomCodeInput(generateUniqueTestCode(newSubject, syncedGrd, usedTestCodes));
                }}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-stone-300 bg-white text-stone-800 outline-none focus:border-[#1E4D34]"
              >
                <option value="Jenjang SD/MI">Jenjang SD/MI</option>
                <option value="Jenjang SMP/MTs">Jenjang SMP/MTs</option>
                <option value="Jenjang SMA/MA">Jenjang SMA/MA</option>
              </select>
            </div>

            {/* Kelas & Durasi */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Kelas:
                </label>
                <select
                  value={newGrade}
                  onChange={(e) => {
                    const grd = e.target.value;
                    setNewGrade(grd);
                    setCustomCodeInput(generateUniqueTestCode(newSubject, grd, usedTestCodes));
                  }}
                  className="w-full px-3 py-2.5 text-xs font-medium rounded-xl border border-stone-300 bg-white text-stone-800 outline-none focus:border-[#1E4D34]"
                >
                  {getGradesForEducationLevel(newEducationLevel).map((grdOpt) => (
                    <option key={grdOpt.value} value={grdOpt.value}>
                      {grdOpt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Durasi & Soal:
                </label>
                <select
                  value={`${newQuestionCount}-${newDuration}`}
                  onChange={(e) => {
                    const [q, d] = e.target.value.split('-').map(Number);
                    setNewQuestionCount(q);
                    setNewDuration(d);
                  }}
                  className="w-full px-3 py-2.5 text-xs font-medium rounded-xl border border-stone-300 bg-white text-stone-800 outline-none focus:border-[#1E4D34]"
                >
                  <option value="15-30">15 Soal (30 Menit)</option>
                  <option value="15-45">15 Soal (45 Menit)</option>
                  <option value="20-45">20 Soal (45 Menit)</option>
                  <option value="30-45">30 Soal (45 Menit)</option>
                  <option value="30-60">30 Soal (60 Menit)</option>
                  <option value="40-60">40 Soal (60 Menit)</option>
                </select>
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
              <span>Langsung aktifkan kode tes & rilis token unik agar bisa dipilih siswa di halaman login</span>
            </label>

            <button
              type="submit"
              disabled={!uniquenessCheck.isUnique}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                uniquenessCheck.isUnique
                  ? 'bg-[#153822] hover:bg-[#1E4F31] text-amber-300 border border-amber-400/40 shadow-sm cursor-pointer'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat & Kunci Kode Tes Baru</span>
            </button>
          </div>
        </form>
      </div>

      {/* List of All Created Test Sessions & Token Controls */}
      <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100 mb-5">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#102C1D]">
              Daftar Sesi Kode Tes & Pengaktifan Token Per Ujian
            </h3>
            <p className="text-xs text-stone-500">
              Aktifkan kode tes yang akan diarahkan kepada siswa. Setiap kode tes memiliki token tersendiri.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Total {testSessions.length} Paket Sesi Tes
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {testSessions.map((session) => {
            const isSelectedMain = session.id === activeSessionId;
            const isArchived = session.status === 'archived';
            const isActive = session.status === 'active';

            return (
              <div
                key={session.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isSelectedMain
                    ? 'bg-[#F7FBF8] border-[#1B4D30] ring-2 ring-[#1B4D30]/15'
                    : isActive
                    ? 'bg-white border-emerald-200'
                    : 'bg-stone-50/80 border-stone-200 opacity-90'
                }`}
              >
                <div>
                  {/* Card Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black px-3 py-1 rounded-xl bg-[#133520] text-amber-300 border border-amber-400/30">
                        {session.testCode}
                      </span>
                      {isSelectedMain && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                          Sesi Diedit
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          Kode Tes Aktif (Tampil di Siswa)
                        </span>
                      )}
                      {session.status === 'inactive' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Non-Aktif (Draft)
                        </span>
                      )}
                      {isArchived && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-200 text-stone-700 border border-stone-300">
                          <Lock className="w-3 h-3" />
                          Selesai / Terkunci Permanen
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subject & Meta */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-stone-900 text-sm sm:text-base">
                      {session.subject} — {session.grade}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-emerald-700" />
                        {session.educationLevel}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                        {session.questions.length} Soal Tersedia (Ditampilkan {session.questionCount})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {session.durationMinutes} Menit
                      </span>
                    </div>
                  </div>

                  {/* Dedicated Token Box for this Test Session */}
                  <div className="p-3.5 rounded-xl bg-stone-100/90 border border-stone-200/90 flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                        TOKEN KHUSUS KODE TES INI
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-lg font-black tracking-widest text-[#133520] bg-white px-3 py-1 rounded-lg border border-stone-300">
                          {session.isTokenActive ? session.token : '------'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            session.isTokenActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {session.isTokenActive ? 'Token Aktif' : 'Token Mati'}
                        </span>
                      </div>
                    </div>

                    {!isArchived && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            onToggleSessionToken(session.id);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            session.isTokenActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                          }`}
                        >
                          {session.isTokenActive ? 'Matikan Token' : 'Aktifkan Token'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sound.playTokenRelease();
                            onRegenerateSessionToken(session.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 border border-amber-500 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Ganti dengan token unik baru untuk kode tes ini"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Token Baru</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="pt-3 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!isArchived ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            onToggleSessionStatus(
                              session.id,
                              isActive ? 'inactive' : 'active'
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{isActive ? 'Nonaktifkan Kode Tes' : 'Aktifkan Kode Tes'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            onToggleSessionStatus(session.id, 'archived');
                          }}
                          title="Kunci permanen kode tes yang sudah selesai dilaksanakan agar tidak bisa dipakai lagi"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-rose-50 hover:text-rose-800 text-stone-600 border border-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Selesai & Kunci</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-stone-400" />
                        Kode tes ini telah selesai dan tidak dapat diaktifkan kembali.
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playSelect();
                      onSelectActiveSession(session.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isSelectedMain
                        ? 'bg-[#143923] text-amber-300'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-[#143923] border border-emerald-200'
                    }`}
                  >
                    {isSelectedMain ? '✓ Sesi Utama Aktif' : 'Jadikan Sesi Utama'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permanent Used Test Codes Registry (Anti-Duplicate Proof) */}
      <div className="card-3d rounded-3xl p-6 border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#143923]" />
            <h4 className="font-semibold text-sm text-[#102C1D]">
              Registri Kode Tes Terpakai & Terkunci (Proteksi Anti-Ganda)
            </h4>
          </div>
          <span className="text-[11px] text-stone-500">
            Seluruh kode di bawah ini tidak dapat dibuat ulang
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {usedTestCodes.map((code, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 border border-stone-200 font-mono text-xs font-bold text-stone-700"
            >
              <Lock className="w-3 h-3 text-amber-600" />
              {code}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
