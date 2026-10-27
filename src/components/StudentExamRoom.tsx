import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Clock,
  HelpCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Award,
  LogOut,
  Sliders,
  Grid,
  Volume2,
  VolumeX,
  Volume1,
  Minus,
  Plus,
} from 'lucide-react';
import { ExamConfig, Question, Student } from '../types/cbt';
import { calculateExamScore, formatDuration } from '../utils/cbtLogic';
import { sound } from '../utils/soundEffects';

interface StudentExamRoomProps {
  examConfig: ExamConfig;
  student: Student;
  questions: Question[];
  onFinishExam: (result: {
    score: number;
    correctCount: number;
    wrongCount: number;
    answeredCount: number;
    answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  }) => void;
  onExitToLogin: () => void;
  onReturnToProktor?: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  onChangeFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  soundVolume: number;
  onChangeSoundVolume: (val: number) => void;
}

export const StudentExamRoom: React.FC<StudentExamRoomProps> = ({
  examConfig,
  student,
  questions,
  onFinishExam,
  onExitToLogin,
  onReturnToProktor,
  fontSize,
  onChangeFontSize,
  soundEnabled,
  onToggleSound,
  soundVolume,
  onChangeSoundVolume,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>(
    student.answers || {}
  );
  const [flagged, setFlagged] = useState<Record<number, boolean>>(
    student.flagged || {}
  );
  const [remainingTime, setRemainingTime] = useState(student.remainingSeconds || 2700);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [finalScoreData, setFinalScoreData] = useState<{
    score: number;
    correctCount: number;
    wrongCount: number;
    answeredCount: number;
  } | null>(null);

  // Slice questions based on examConfig.questionCount
  const activeQuestions = questions.slice(0, examConfig.questionCount);
  const currentQuestion = activeQuestions[currentIdx] || activeQuestions[0];

  // Countdown timer
  useEffect(() => {
    if (showScoreModal) return;
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showScoreModal]);

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    sound.playSelect();
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.number]: key,
    }));
  };

  const handleToggleFlag = () => {
    sound.playClick();
    setFlagged((prev) => ({
      ...prev,
      [currentQuestion.number]: !prev[currentQuestion.number],
    }));
  };

  const handleNext = () => {
    sound.playClick();
    if (currentIdx < activeQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    sound.playClick();
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmitExam = () => {
    sound.playSuccess();
    const result = calculateExamScore(answers, activeQuestions);
    setFinalScoreData(result);
    setShowConfirmModal(false);
    setShowScoreModal(true);
    onFinishExam({
      score: result.score,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      answeredCount: result.answeredCount,
      answers,
    });
  };

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unansweredCount = activeQuestions.length - answeredCount;

  // Font scale class
  const fontClass =
    fontSize === 'xlarge'
      ? 'text-base sm:text-lg'
      : fontSize === 'large'
      ? 'text-sm sm:text-base'
      : 'text-xs sm:text-sm';

  return (
    <div className="min-h-screen bg-transparent text-stone-800 flex flex-col font-sans selection:bg-amber-400">
      {/* Top Header of Exam Room (Bright & Clean) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md text-stone-800 border-b border-emerald-500/30 shadow-sm px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center font-black text-[#12331F] shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-[15px] text-[#11331F] tracking-normal">
                  SD NEGERI 4 LALEMBUU
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  CBT SISWA
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-medium">
                Peserta: <strong>{student.name}</strong> • NISN: {student.nisn} ({student.grade})
              </p>
            </div>
          </div>

          {/* Center Timer */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-amber-50 border border-amber-400 text-stone-900 shadow-xs">
            <Clock className={`w-4 h-4 ${remainingTime < 300 ? 'text-rose-600 animate-bounce' : 'text-amber-600'}`} />
            <span className="text-xs font-bold text-stone-700 hidden sm:inline">
              Sisa Waktu:
            </span>
            <span className="font-mono text-base sm:text-lg font-black tracking-widest text-[#11331F]">
              {formatDuration(remainingTime)}
            </span>
          </div>

          {/* Right utilities & proktor quick exit */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Font Size A- / A / A+ */}
            <div className="flex items-center bg-[#F4FBF6] rounded-full border border-emerald-200 p-1 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => {
                  onChangeFontSize('normal');
                  sound.playClick();
                }}
                className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
                  fontSize === 'normal'
                    ? 'bg-[#173F28] text-amber-300 shadow-xs'
                    : 'text-[#173F28] hover:bg-emerald-100'
                }`}
                title="Ukuran Font Kecil / Normal (A-)"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeFontSize('large');
                  sound.playClick();
                }}
                className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
                  fontSize === 'large'
                    ? 'bg-[#173F28] text-amber-300 shadow-xs'
                    : 'text-[#173F28] hover:bg-emerald-100'
                }`}
                title="Ukuran Font Sedang (A)"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeFontSize('xlarge');
                  sound.playClick();
                }}
                className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
                  fontSize === 'xlarge'
                    ? 'bg-[#173F28] text-amber-300 shadow-xs'
                    : 'text-[#173F28] hover:bg-emerald-100'
                }`}
                title="Ukuran Font Besar (A+)"
              >
                A+
              </button>
            </div>

            {/* Audio Volume & Mute Control */}
            <div className="flex items-center gap-1 bg-[#F4FBF6] border border-emerald-200 rounded-full px-2 py-1">
              <button
                type="button"
                onClick={onToggleSound}
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  soundEnabled && soundVolume > 0
                    ? 'bg-white text-[#143B25] border border-emerald-200'
                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}
                title={
                  soundEnabled && soundVolume > 0
                    ? 'Mute Suara'
                    : 'Aktifkan Suara'
                }
              >
                {!soundEnabled || soundVolume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                ) : soundVolume < 50 ? (
                  <Volume1 className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span className="hidden sm:inline">
                  {!soundEnabled || soundVolume === 0 ? 'Mute' : 'Suara Aktif'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = Math.max(0, soundVolume - 20);
                  onChangeSoundVolume(next);
                  if (next > 0) sound.playClick();
                }}
                className="w-5 h-5 rounded-full bg-white hover:bg-emerald-100 text-[#153C25] border border-emerald-200 flex items-center justify-center cursor-pointer"
                title="Perkecil Audio (-20%)"
              >
                <Minus className="w-3 h-3" />
              </button>

              <span className="text-[10px] font-mono font-bold text-[#143B25] min-w-[30px] text-center">
                {soundEnabled ? `${soundVolume}%` : '0%'}
              </span>

              <button
                type="button"
                onClick={() => {
                  const next = Math.min(100, soundVolume + 20);
                  onChangeSoundVolume(next);
                  sound.playClick();
                }}
                className="w-5 h-5 rounded-full bg-white hover:bg-emerald-100 text-[#153C25] border border-emerald-200 flex items-center justify-center cursor-pointer"
                title="Perbesar Audio (+20%)"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {onReturnToProktor && (
              <button
                onClick={() => {
                  sound.playClick();
                  onReturnToProktor();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-amber-300 border border-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                title="Kembali ke Panel Pengawas"
              >
                Kembali ke Proktor
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                onExitToLogin();
              }}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Question and Answer Area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
            {/* Question Top Header Info */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-[#143923] text-amber-300 font-extrabold text-sm">
                  Soal Nomor {currentIdx + 1}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  dari {activeQuestions.length} Soal
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {currentQuestion.subject}
                </span>
                <span className="text-xs text-stone-500 hidden sm:inline">
                  {currentQuestion.topic}
                </span>
              </div>
            </div>

            {/* Stimulus / Reading passage if available */}
            {currentQuestion.stimulus && (
              <div className="p-4 mb-5 rounded-2xl bg-stone-50 border-l-4 border-amber-500 text-stone-700 text-xs sm:text-sm leading-relaxed">
                <p className="font-semibold text-stone-800 mb-1">
                  Stimulus Bacaan / Konteks Soal:
                </p>
                <p className="italic text-stone-600">{currentQuestion.stimulus}</p>
              </div>
            )}

            {/* Main Question Statement */}
            <div className={`font-semibold text-[#112A1C] mb-6 leading-relaxed ${fontClass}`}>
              {currentQuestion.text}
            </div>

            {/* Options list */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.number] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/90 border-[#1C4E31] text-[#0F2D1B] ring-2 ring-[#1C4E31]/20 shadow-sm'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#153B24] text-amber-300 shadow-sm'
                          : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200'
                      }`}
                    >
                      {opt.key}
                    </div>
                    <div className={`flex-1 pt-1 ${fontClass}`}>
                      {opt.text}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="card-3d rounded-2xl p-4 border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                currentIdx === 0
                  ? 'bg-stone-100 text-stone-300 border border-stone-200 cursor-not-allowed'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Soal Sebelumnya</span>
            </button>

            {/* Flag / Ragu-ragu Toggle */}
            <button
              onClick={handleToggleFlag}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                flagged[currentQuestion.number]
                  ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-sm font-extrabold'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              <Flag className={`w-4 h-4 ${flagged[currentQuestion.number] ? 'fill-stone-950' : 'text-amber-700'}`} />
              <span>{flagged[currentQuestion.number] ? 'Ragu-Ragu (Ditandai)' : 'Tandai Ragu-Ragu'}</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIdx < activeQuestions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-[#143B23] hover:bg-[#1D5131] text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-sm border border-amber-400/40 cursor-pointer"
                >
                  <span>Soal Berikutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    sound.playClick();
                    setShowConfirmModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#12311E] hover:from-emerald-500 hover:to-[#173D26] text-white font-black text-xs flex items-center gap-1.5 shadow-md border border-emerald-400 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-amber-300" />
                  <span>Selesai & Kumpulkan Ujian</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Question Grid Palette */}
        <div className="space-y-4">
          <div className="card-3d rounded-3xl p-5 border border-emerald-100 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#143B23]" />
                <h3 className="font-extrabold text-[#112D1D] text-xs">
                  Nomor Soal Ujian
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {answeredCount}/{activeQuestions.length} Terjawab
              </span>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-medium text-stone-600 mb-4 bg-stone-50 p-2 rounded-xl border border-stone-200">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-600"></div>
                <span>Dijawab</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-400"></div>
                <span>Ragu</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-stone-200"></div>
                <span>Kosong</span>
              </div>
            </div>

            {/* Palette Buttons Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {activeQuestions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = !!answers[q.number];
                const isFlagged = !!flagged[q.number];

                let bgClasses = 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300';
                if (isFlagged) {
                  bgClasses = 'bg-amber-400 text-stone-950 border-amber-500 font-extrabold shadow-sm';
                } else if (isAnswered) {
                  bgClasses = 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 font-bold';
                }

                if (isCurrent) {
                  bgClasses += ' ring-2 ring-[#133A24] ring-offset-1 font-black';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      sound.playClick();
                      setCurrentIdx(idx);
                    }}
                    className={`h-10 rounded-xl text-xs flex flex-col items-center justify-center border transition-all cursor-pointer ${bgClasses}`}
                  >
                    <span>{q.number}</span>
                    {isAnswered && (
                      <span className="text-[9px] leading-none opacity-90">
                        {answers[q.number]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Finish Button at bottom of palette */}
            <div className="mt-5 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowConfirmModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm border border-amber-400 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Selesaikan Ujian Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-amber-400/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#112E1F]">
                  Konfirmasi Selesai Ujian
                </h3>
                <p className="text-xs text-stone-500">
                  SD Negeri 4 Lalembuu • CBT Lab
                </p>
              </div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs space-y-2 mb-5">
              <div className="flex justify-between">
                <span className="text-stone-600">Total Butir Soal:</span>
                <span className="font-bold text-stone-900">{activeQuestions.length} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700 font-semibold">Sudah Terjawab:</span>
                <span className="font-bold text-emerald-800">{answeredCount} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700 font-semibold">Ditandai Ragu-Ragu:</span>
                <span className="font-bold text-amber-800">{flaggedCount} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-700 font-semibold">Belum Dijawab:</span>
                <span className="font-bold text-rose-800">{unansweredCount} Soal</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-4">
                Peringatan: Masih ada <strong>{unansweredCount} soal</strong> yang belum Anda jawab. Apakah Anda yakin ingin mengumpulkan ujian sekarang?
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                className="px-5 py-2.5 rounded-xl bg-[#133923] hover:bg-[#1A4C2E] text-amber-300 font-bold text-xs shadow-md border border-amber-400"
              >
                Ya, Kumpulkan Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score and Result Celebration Modal */}
      {showScoreModal && finalScoreData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 border-2 border-amber-400 shadow-2xl text-center relative overflow-hidden">
            {/* Top decorative glow */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#122E1F] to-[#1C4E31] text-amber-400 border-4 border-amber-200 shadow-xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-[#102C1D]">
              Simulasi Ujian Selesai!
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Hasil simulasi telah tersimpan dan terkirim ke panel proktor <strong>Marhan, S.Pd.I., M.Pd.</strong>
            </p>

            {/* Score Big Badge */}
            <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-amber-50/50 to-stone-50 border border-amber-300">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                NILAI AKHIR CBT
              </span>
              <div className="text-5xl font-black font-mono text-[#112E1F] my-2 text-shadow">
                {finalScoreData.score}
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                  finalScoreData.score >= 70
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {finalScoreData.score >= 70 ? 'LULUS (MEMENUHI KKM)' : 'PERLU REMEDIAL'}
              </span>
            </div>

            {/* Breakdown stats */}
            <div className="grid grid-cols-3 gap-3 text-xs mb-6">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block text-[11px]">Jawaban Benar</span>
                <span className="font-extrabold text-emerald-700 text-base">
                  {finalScoreData.correctCount}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block text-[11px]">Jawaban Salah</span>
                <span className="font-extrabold text-rose-700 text-base">
                  {finalScoreData.wrongCount}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block text-[11px]">Total Soal</span>
                <span className="font-extrabold text-stone-800 text-base">
                  {activeQuestions.length}
                </span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {onReturnToProktor && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onReturnToProktor();
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#143B23] hover:bg-[#1E5232] text-amber-300 font-extrabold text-xs border border-amber-400 shadow-md cursor-pointer"
                >
                  Kembali ke Panel Pengawas
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onExitToLogin();
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
              >
                Keluar ke Halaman Utama
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
