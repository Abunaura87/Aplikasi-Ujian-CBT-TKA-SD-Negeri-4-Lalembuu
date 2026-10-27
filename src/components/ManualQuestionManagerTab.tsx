import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  KeyRound,
  FileText,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { ExamConfig, Question } from '../types/cbt';
import {
  generateQuestionTemplateCsv,
  generateQuestionTemplateTxt,
  parseUploadedQuestions,
} from '../utils/cbtLogic';
import { sound } from '../utils/soundEffects';

interface ManualQuestionManagerTabProps {
  testSessions: ExamConfig[];
  selectedSessionId: string;
  onSelectSessionId: (id: string) => void;
  onUpdateSessionQuestions: (sessionId: string, updatedQuestions: Question[]) => void;
}

export const ManualQuestionManagerTab: React.FC<ManualQuestionManagerTabProps> = ({
  testSessions,
  selectedSessionId,
  onSelectSessionId,
  onUpdateSessionQuestions,
}) => {
  const currentSession =
    testSessions.find((s) => s.id === selectedSessionId) || testSessions[0];
  const questions = currentSession?.questions || [];

  // Upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [previewFormatTab, setPreviewFormatTab] = useState<'csv' | 'txt'>('csv');

  // Manual Question Form state
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [topic, setTopic] = useState('Pemahaman Konsep & Penalaran');
  const [stimulus, setStimulus] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');

  const handleDownloadTemplate = (format: 'csv' | 'txt') => {
    sound.playClick();
    const subjectName = currentSession?.subject || 'CBT_SD';
    const rawContent =
      format === 'csv'
        ? generateQuestionTemplateCsv(subjectName)
        : generateQuestionTemplateTxt(subjectName);

    // Prepend UTF-8 BOM (\uFEFF) for CSV so Microsoft Excel opens columns A-I cleanly
    const content = format === 'csv' ? `\uFEFF${rawContent}` : rawContent;
    const mimeType =
      format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Format_Soal_${currentSession?.testCode || 'CBT'}_SDN4_Lalembuu.${format}`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentSession) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const parsed = parseUploadedQuestions(content, currentSession.subject);

      if (!parsed.success) {
        sound.playClick();
        setUploadStatus({
          type: 'error',
          message: parsed.message,
        });
        return;
      }

      sound.playSuccess();
      const baseList = uploadMode === 'replace' ? [] : questions;
      const merged = [...baseList, ...parsed.questions].map((q, idx) => ({
        ...q,
        number: idx + 1,
      }));

      onUpdateSessionQuestions(currentSession.id, merged);
      setUploadStatus({
        type: 'success',
        message: `${parsed.message} Total soal pada kode tes ${currentSession.testCode} kini: ${merged.length} butir soal.`,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;
    if (!questionText.trim() || !optA.trim() || !optB.trim()) {
      setUploadStatus({
        type: 'error',
        message: 'Teks pertanyaan serta minimal Opsi A dan Opsi B wajib diisi.',
      });
      return;
    }

    sound.playSuccess();
    if (editingQuestionId !== null) {
      const updated = questions.map((q) => {
        if (q.id === editingQuestionId) {
          return {
            ...q,
            stimulus: stimulus.trim() || undefined,
            text: questionText.trim(),
            topic: topic.trim() || 'Materi Pokok SD',
            options: [
              { key: 'A' as const, text: optA.trim() },
              { key: 'B' as const, text: optB.trim() },
              { key: 'C' as const, text: optC.trim() || '-' },
              { key: 'D' as const, text: optD.trim() || '-' },
            ],
            correctAnswer,
          };
        }
        return q;
      });
      onUpdateSessionQuestions(currentSession.id, updated);
      setEditingQuestionId(null);
      setUploadStatus({
        type: 'success',
        message: 'Butir soal dan kunci jawaban berhasil diperbarui!',
      });
    } else {
      const newQuestion: Question = {
        id: Date.now(),
        number: questions.length + 1,
        stimulus: stimulus.trim() || undefined,
        text: questionText.trim(),
        subject: currentSession.subject,
        topic: topic.trim() || 'Materi Pokok SD',
        options: [
          { key: 'A', text: optA.trim() },
          { key: 'B', text: optB.trim() },
          { key: 'C', text: optC.trim() || '-' },
          { key: 'D', text: optD.trim() || '-' },
        ],
        correctAnswer,
      };
      const updated = [...questions, newQuestion].map((q, idx) => ({
        ...q,
        number: idx + 1,
      }));
      onUpdateSessionQuestions(currentSession.id, updated);
      setUploadStatus({
        type: 'success',
        message: `Soal nomor ${updated.length} dengan Kunci Jawaban [${correctAnswer}] berhasil ditambahkan ke Kode Tes ${currentSession.testCode}!`,
      });
    }

    // Reset form
    setStimulus('');
    setQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectAnswer('A');
  };

  const handleStartEdit = (q: Question) => {
    sound.playClick();
    setEditingQuestionId(q.id);
    setTopic(q.topic);
    setStimulus(q.stimulus || '');
    setQuestionText(q.text);
    setOptA(q.options.find((o) => o.key === 'A')?.text || '');
    setOptB(q.options.find((o) => o.key === 'B')?.text || '');
    setOptC(q.options.find((o) => o.key === 'C')?.text || '');
    setOptD(q.options.find((o) => o.key === 'D')?.text || '');
    setCorrectAnswer(q.correctAnswer);
  };

  const handleDeleteQuestion = (id: number) => {
    if (!currentSession) return;
    sound.playClick();
    const filtered = questions
      .filter((q) => q.id !== id)
      .map((q, idx) => ({ ...q, number: idx + 1 }));
    onUpdateSessionQuestions(currentSession.id, filtered);
  };

  return (
    <div className="space-y-6">
      {/* Header & Target Test Code Selector */}
      <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#143E26] mb-2">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Bank Soal Manual, Kunci Jawaban & Import Template</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#102D1D] tracking-normal">
              Pengelolaan Soal Manual & Upload Format Soal
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Unduh format soal resmi beserta kunci jawaban, tulis soal di dalamnya, lalu unggah kembali atau input manual per butir soal.
            </p>
          </div>

          {/* Target Test Session Picker */}
          <div className="bg-[#F6FAF7] p-4 rounded-2xl border border-emerald-200 min-w-[290px]">
            <label className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-1">
              Pilih Kode Tes Tujuan Soal:
            </label>
            <select
              value={currentSession?.id || ''}
              onChange={(e) => {
                sound.playSelect();
                onSelectSessionId(e.target.value);
                setUploadStatus(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-[#122E1F] outline-none"
            >
              {testSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.testCode} — {s.subject} ({s.questions.length} Soal)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Notification Banner */}
      {uploadStatus && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{uploadStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadStatus(null)}
            className="text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: Left = Download Template & Format Guide, Right = Upload File Soal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Format Soal & Kunci Jawaban + Download */}
        <div className="card-3d rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-[#102C1D]">
                    1. Unduh Format Soal & Kunci Jawaban
                  </h3>
                  <p className="text-xs text-stone-500">
                    Format CSV otomatis terpisah rapi per kolom (A–I) saat dibuka di Microsoft Excel
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewFormatTab('csv')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    previewFormatTab === 'csv'
                      ? 'bg-[#153822] text-amber-300'
                      : 'text-stone-600'
                  }`}
                >
                  Format CSV/Excel
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFormatTab('txt')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    previewFormatTab === 'txt'
                      ? 'bg-[#153822] text-amber-300'
                      : 'text-stone-600'
                  }`}
                >
                  Format Teks (.txt)
                </button>
              </div>
            </div>

            {/* Visual Format Preview */}
            <div className="bg-emerald-50/90 text-[#11331F] rounded-2xl p-3.5 text-[11px] overflow-x-auto border border-emerald-300 mb-4">
              <div className="flex items-center justify-between text-amber-800 text-[10px] font-sans font-semibold uppercase tracking-wider pb-2 mb-2 border-b border-emerald-200">
                <span>
                  Pratinjau Tabel Kolom Excel / CSV ({previewFormatTab.toUpperCase()})
                </span>
                <span>Kolom A s/d I Rapi • Kunci: A / B / C / D</span>
              </div>
              {previewFormatTab === 'csv' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px] bg-white rounded-xl overflow-hidden border border-emerald-200">
                    <thead>
                      <tr className="bg-[#153822] text-amber-300 font-semibold">
                        <th className="py-1.5 px-2 border-r border-emerald-700">No</th>
                        <th className="py-1.5 px-2 border-r border-emerald-700">Stimulus_Bacaan</th>
                        <th className="py-1.5 px-2 border-r border-emerald-700">Pertanyaan</th>
                        <th className="py-1.5 px-2 border-r border-emerald-700">Opsi_A</th>
                        <th className="py-1.5 px-2 border-r border-emerald-700">Opsi_B</th>
                        <th className="py-1.5 px-2 border-r border-emerald-700">Opsi_C</th>
                        <th className="py-1.5 px-2 border-r border-emerald-700">Opsi_D</th>
                        <th className="py-1.5 px-2 border-r border-emerald-700">Kunci_Jawaban</th>
                        <th className="py-1.5 px-2">Topik</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100 text-stone-700">
                      <tr>
                        <td className="py-1.5 px-2 font-mono font-semibold">1</td>
                        <td className="py-1.5 px-2 truncate max-w-[110px]">Hutan Mangrove di Pesisir...</td>
                        <td className="py-1.5 px-2 truncate max-w-[120px]">Apa manfaat utama hutan mangrove?</td>
                        <td className="py-1.5 px-2">Mencegah abrasi</td>
                        <td className="py-1.5 px-2">Penguapan air</td>
                        <td className="py-1.5 px-2">Pantai kering</td>
                        <td className="py-1.5 px-2">Naik ombak</td>
                        <td className="py-1.5 px-2 font-bold text-center text-emerald-800 bg-emerald-50">A</td>
                        <td className="py-1.5 px-2">Ekosistem</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-mono font-semibold">2</td>
                        <td className="py-1.5 px-2 truncate max-w-[110px]">Koperasi membeli 5 dus pensil...</td>
                        <td className="py-1.5 px-2 truncate max-w-[120px]">Berapa pensil diterima tiap siswa?</td>
                        <td className="py-1.5 px-2">3 batang</td>
                        <td className="py-1.5 px-2">4 batang</td>
                        <td className="py-1.5 px-2">5 batang</td>
                        <td className="py-1.5 px-2">6 batang</td>
                        <td className="py-1.5 px-2 font-bold text-center text-emerald-800 bg-emerald-50">B</td>
                        <td className="py-1.5 px-2">Bilangan</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <pre className="leading-relaxed whitespace-pre font-mono">
{`NO: 1
STIMULUS: Hutan Mangrove mencegah abrasi pantai.
TOPIK: Ekosistem Pesisir
PERTANYAAN: Apa manfaat utama hutan mangrove?
A: Mencegah abrasi pantai
B: Mempercepat penguapan
C: Menjadikan pantai kering
D: Menaikkan gelombang
KUNCI: A
---`}
                </pre>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => handleDownloadTemplate('csv')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#153822] hover:bg-[#1E4F31] text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-amber-400/40 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Unduh Format Excel / CSV Rapi (.csv)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadTemplate('txt')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs flex items-center justify-center gap-2 border border-amber-300 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-700" />
              <span>Unduh Format Teks (.txt)</span>
            </button>
          </div>
        </div>

        {/* Card 2: Upload File Soal Sesuai Format */}
        <div className="card-3d rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 mb-4">
              <div className="p-2 rounded-xl bg-emerald-100 text-[#133822]">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-[#102C1D]">
                  2. Upload Soal Sesuai Format yang Diunduh
                </h3>
                <p className="text-xs text-stone-500">
                  Unggah file format soal (.csv atau .txt) yang telah diisi soal & kunci jawaban
                </p>
              </div>
            </div>

            {/* Mode Pilihan Upload */}
            <div className="flex items-center gap-4 mb-4 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
              <span className="font-bold text-stone-700">Mode Impor:</span>
              <label className="inline-flex items-center gap-1.5 font-semibold text-stone-700 cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  checked={uploadMode === 'append'}
                  onChange={() => setUploadMode('append')}
                  className="accent-[#153822]"
                />
                <span>Tambahkan ke Soal yang Ada</span>
              </label>
              <label className="inline-flex items-center gap-1.5 font-semibold text-stone-700 cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  checked={uploadMode === 'replace'}
                  onChange={() => setUploadMode('replace')}
                  className="accent-[#153822]"
                />
                <span>Ganti Semua Soal di Kode Tes Ini</span>
              </label>
            </div>

            {/* Dropzone / Upload Trigger */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-amber-500 bg-[#F7FBF8] hover:bg-emerald-50/60 rounded-2xl p-6 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.json"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload file soal"
              />
              <div className="w-12 h-12 rounded-2xl bg-[#153822] text-amber-300 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-xs sm:text-sm text-[#112E1D]">
                Klik untuk Memilih & Upload File Soal (.csv / .txt)
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Sistem otomatis membaca Pertanyaan, Opsi A-D, serta Kunci Jawaban untuk Kode Tes{' '}
                <strong className="text-emerald-800">{currentSession?.testCode}</strong>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-500">
               Mendukung file hasil edit Microsoft Excel (.csv) maupun Notepad (.txt)
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File Soal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Input Soal Manual Beserta Kunci Jawaban */}
      <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#153822] text-amber-300">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#102C1D]">
                {editingQuestionId !== null
                  ? 'Edit Butir Soal & Kunci Jawaban'
                  : 'Input Soal Manual Beserta Kunci Jawaban'}
              </h3>
              <p className="text-xs text-stone-500">
                Tambahkan soal baru langsung ke kode tes{' '}
                <strong>{currentSession?.testCode}</strong> ({currentSession?.subject})
              </p>
            </div>
          </div>

          {editingQuestionId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditingQuestionId(null);
                setStimulus('');
                setQuestionText('');
                setOptA('');
                setOptB('');
                setOptC('');
                setOptD('');
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveManualQuestion} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Topik / Materi Pokok Soal:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Ekosistem & Rantai Makanan"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Stimulus / Teks Bacaan Pengantar (Opsional):
              </label>
              <input
                type="text"
                value={stimulus}
                onChange={(e) => setStimulus(e.target.value)}
                placeholder="Masukkan kutipan bacaan atau cerita konteks soal..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Pertanyaan Pokok Soal: <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Tuliskan kalimat pertanyaan soal di sini..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none"
            />
          </div>

          {/* 4 Options A, B, C, D */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Pilihan Jawaban A: <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={optA}
                onChange={(e) => setOptA(e.target.value)}
                placeholder="Teks opsi jawaban A"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Pilihan Jawaban B: <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={optB}
                onChange={(e) => setOptB(e.target.value)}
                placeholder="Teks opsi jawaban B"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Pilihan Jawaban C:
              </label>
              <input
                type="text"
                value={optC}
                onChange={(e) => setOptC(e.target.value)}
                placeholder="Teks opsi jawaban C"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Pilihan Jawaban D:
              </label>
              <input
                type="text"
                value={optD}
                onChange={(e) => setOptD(e.target.value)}
                placeholder="Teks opsi jawaban D"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#1E4D34] outline-none"
              />
            </div>
          </div>

          {/* Answer Key Selection & Submit */}
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-[#12311E] flex items-center gap-1">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Tetapkan Kunci Jawaban Benar:
              </span>
              {(['A', 'B', 'C', 'D'] as const).map((keyOption) => (
                <button
                  key={keyOption}
                  type="button"
                  onClick={() => {
                    sound.playSelect();
                    setCorrectAnswer(keyOption);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    correctAnswer === keyOption
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-stone-950 border-amber-500 shadow-sm'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
                  }`}
                >
                  Kunci {keyOption}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#153822] hover:bg-[#1E4F31] text-amber-300 font-bold text-xs flex items-center gap-2 border border-amber-400/40 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {editingQuestionId !== null
                  ? 'Simpan Perubahan Soal'
                  : 'Simpan Butir Soal & Kunci Jawaban'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* List of Questions & Answer Keys in Selected Test Session */}
      <div className="card-3d rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#102C1D]">
              Daftar Soal & Kunci Jawaban Terdaftar ({questions.length} Butir)
            </h3>
            <p className="text-xs text-stone-500">
              Kode Tes: <strong>{currentSession?.testCode}</strong> • Mata Pelajaran:{' '}
              <strong>{currentSession?.subject}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {questions.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-2xl bg-[#F9FBF9] border border-stone-200 hover:border-emerald-300 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#143923] text-amber-300 font-extrabold text-xs">
                    Soal #{q.number}
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    Topik: {q.topic}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    Kunci Jawaban: {q.correctAnswer}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(q)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 cursor-pointer"
                    title="Edit Soal & Kunci"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-700 border border-stone-200 cursor-pointer"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {q.stimulus && (
                <p className="text-xs italic text-stone-500 bg-white p-2.5 rounded-xl border border-stone-200/80 mb-2">
                  Stimulus: &ldquo;{q.stimulus}&rdquo;
                </p>
              )}

              <p className="text-xs sm:text-sm font-bold text-[#112A1C] mb-2.5">
                {q.text}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt) => {
                  const isCorrect = opt.key === q.correctAnswer;
                  return (
                    <div
                      key={opt.key}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
                        isCorrect
                          ? 'bg-emerald-100/90 border-emerald-400 text-emerald-950 font-bold'
                          : 'bg-white border-stone-200 text-stone-600'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black ${
                          isCorrect
                            ? 'bg-[#143923] text-amber-300'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {isCorrect && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
