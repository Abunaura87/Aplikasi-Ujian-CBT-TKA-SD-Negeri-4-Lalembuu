import React, { useState, useRef } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  Plus,
  RefreshCw,
  Computer,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  X,
} from 'lucide-react';
import { ExamConfig, Student } from '../types/cbt';
import {
  formatDuration,
  generateStudentTemplateCsv,
  parseUploadedStudentsCsv,
} from '../utils/cbtLogic';
import { sound } from '../utils/soundEffects';

interface StudentStatusTabProps {
  students: Student[];
  activeExamConfig?: ExamConfig;
  activeTestCode?: string;
  questionCount?: number;
  durationMinutes?: number;
  onResetStudent: (studentId: string) => void;
  onAddStudent: (name: string, nisn: string, grade: string) => void;
  onImportStudents?: (importedStudents: Student[], mode: 'append' | 'replace') => void;
  onSimulateWork: () => void;
}

export const StudentStatusTab: React.FC<StudentStatusTabProps> = ({
  students,
  activeExamConfig,
  activeTestCode = activeExamConfig?.testCode || 'CBT-2026-SD4-LIT-001',
  questionCount = activeExamConfig?.questionCount || 15,
  durationMinutes = activeExamConfig?.durationMinutes || 45,
  onResetStudent,
  onAddStudent,
  onImportStudents,
  onSimulateWork,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNisn, setNewNisn] = useState('');
  const [newGrade, setNewGrade] = useState('Kelas 5A');

  // CSV Student Import state
  const studentCsvInputRef = useRef<HTMLInputElement | null>(null);
  const [csvImportMode, setCsvImportMode] = useState<'append' | 'replace'>('append');
  const [csvFeedback, setCsvFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm);
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && s.status === filterStatus;
  });

  const totalCount = students.length;
  const inProgressCount = students.filter((s) => s.status === 'in_progress').length;
  const completedCount = students.filter((s) => s.status === 'completed').length;
  const idleCount = students.filter((s) => s.status === 'idle').length;

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNisn.trim()) return;
    sound.playSuccess();
    onAddStudent(newName.trim(), newNisn.trim(), newGrade);
    setNewName('');
    setNewNisn('');
    setShowAddModal(false);
    setCsvFeedback({
      type: 'success',
      message: `Peserta "${newName.trim()}" (${newNisn.trim()}) berhasil ditambahkan ke daftar peserta!`,
    });
  };

  const handleDownloadStudentCsvTemplate = () => {
    sound.playClick();
    const rawCsv = generateStudentTemplateCsv('Kelas 5A');
    const blob = new Blob([`\uFEFF${rawCsv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Template_Data_Murid_${activeTestCode}_SDN4_Lalembuu.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadStudentCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const parsed = parseUploadedStudentsCsv(
        content,
        activeTestCode,
        questionCount,
        durationMinutes,
        students.length
      );

      if (!parsed.success) {
        sound.playClick();
        setCsvFeedback({
          type: 'error',
          message: parsed.message,
        });
        return;
      }

      sound.playSuccess();
      if (onImportStudents) {
        onImportStudents(parsed.students, csvImportMode);
      } else {
        parsed.students.forEach((st) => onAddStudent(st.name, st.nisn, st.grade));
      }

      setCsvFeedback({
        type: 'success',
        message: `${parsed.message} (${
          csvImportMode === 'replace'
            ? 'Mengganti daftar peserta sebelumnya'
            : 'Ditambahkan ke daftar peserta aktif'
        })`,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-3d rounded-2xl p-4 border border-emerald-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-[#153823] flex items-center justify-center font-semibold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Total Peserta</span>
            <span className="text-xl font-semibold text-[#122E1E]">{totalCount}</span>
            <span className="text-[10px] text-stone-400 block">Lab Komputer CBT</span>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-4 border border-amber-200/80 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-semibold">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Sedang Ujian</span>
            <span className="text-xl font-semibold text-amber-600">{inProgressCount}</span>
            <span className="text-[10px] text-amber-700 block">Mengerjakan Soal</span>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-4 border border-emerald-200 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-semibold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Selesai Ujian</span>
            <span className="text-xl font-semibold text-emerald-800">{completedCount}</span>
            <span className="text-[10px] text-emerald-700 block">Terkirim ke Server</span>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center font-semibold">
            <Computer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Belum Login</span>
            <span className="text-xl font-semibold text-stone-600">{idleCount}</span>
            <span className="text-[10px] text-stone-400 block">Klien Siap Digunakan</span>
          </div>
        </div>
      </div>

      {/* Template CSV & Bulk Upload Data Murid Card */}
      <div className="card-3d rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-[#153822] text-amber-300 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-[#102C1D]">
                Template CSV Rapi & Import Data Murid Massal (Excel / CSV)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Unduh template CSV data murid yang sudah rapi per kolom (A–F) di Microsoft Excel, isi daftar murid, lalu unggah untuk menginput data murid sekaligus.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadStudentCsvTemplate}
              data-testid="download-student-csv-btn"
              className="px-3.5 py-2.5 rounded-xl bg-[#153822] hover:bg-[#1E4F31] text-amber-300 border border-amber-400/40 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Unduh Template CSV Data Murid (.csv)</span>
            </button>

            <input
              ref={studentCsvInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleUploadStudentCsv}
              className="hidden"
              aria-label="Upload CSV Data Murid"
            />
            <button
              type="button"
              onClick={() => studentCsvInputRef.current?.click()}
              data-testid="upload-student-csv-btn"
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 border border-amber-400 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV Data Murid</span>
            </button>
          </div>
        </div>

        {/* Preview of Neat Student CSV Structure + Import Mode */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
          <div className="lg:col-span-2 bg-emerald-50/70 rounded-2xl p-3 border border-emerald-200 overflow-x-auto">
            <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-950 uppercase tracking-wider mb-1.5">
              <span>Contoh Format Tabel CSV Data Murid (Rapi 6 Kolom Excel A–F)</span>
              <span className="text-amber-800">Pemisah Standar Excel</span>
            </div>
            <table className="w-full text-left border-collapse text-[10px] bg-white rounded-xl overflow-hidden border border-emerald-200">
              <thead>
                <tr className="bg-[#153822] text-amber-300 font-semibold">
                  <th className="py-1 px-2 border-r border-emerald-700">No</th>
                  <th className="py-1 px-2 border-r border-emerald-700">NISN</th>
                  <th className="py-1 px-2 border-r border-emerald-700">Nama_Lengkap</th>
                  <th className="py-1 px-2 border-r border-emerald-700">Jenis_Kelamin</th>
                  <th className="py-1 px-2 border-r border-emerald-700">Kelas</th>
                  <th className="py-1 px-2">Komputer_Klien</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 text-stone-700">
                <tr>
                  <td className="py-1 px-2 font-mono">1</td>
                  <td className="py-1 px-2 font-mono">0089123451</td>
                  <td className="py-1 px-2 font-medium">Muhammad Rizky Pratama</td>
                  <td className="py-1 px-2 text-center">L</td>
                  <td className="py-1 px-2">Kelas 5A</td>
                  <td className="py-1 px-2 font-mono">192.168.1.121</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono">2</td>
                  <td className="py-1 px-2 font-mono">0089123452</td>
                  <td className="py-1 px-2 font-medium">Siti Aisyah Putri</td>
                  <td className="py-1 px-2 text-center">P</td>
                  <td className="py-1 px-2">Kelas 5A</td>
                  <td className="py-1 px-2 font-mono">192.168.1.122</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-[#F6FAF7] p-3.5 rounded-2xl border border-emerald-200 space-y-2 text-xs">
            <span className="font-semibold text-[#112E1D] block">
              Mode Upload Data Murid:
            </span>
            <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
              <input
                type="radio"
                name="studentCsvMode"
                checked={csvImportMode === 'append'}
                onChange={() => setCsvImportMode('append')}
                className="accent-[#153822]"
              />
              <span>Tambahkan ke Daftar Peserta yang Ada</span>
            </label>
            <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
              <input
                type="radio"
                name="studentCsvMode"
                checked={csvImportMode === 'replace'}
                onChange={() => setCsvImportMode('replace')}
                className="accent-[#153822]"
              />
              <span>Ganti Semua Daftar Peserta Saat Ini</span>
            </label>
          </div>
        </div>

        {csvFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 ${
              csvFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {csvFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{csvFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setCsvFeedback(null)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Action Controls & Filters */}
      <div className="card-3d rounded-2xl p-4 border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama peserta atau NISN siswa..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#1E4D34] outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-700 font-medium"
          >
            <option value="all">Semua Status ({totalCount})</option>
            <option value="in_progress">Sedang Ujian ({inProgressCount})</option>
            <option value="completed">Selesai ({completedCount})</option>
            <option value="idle">Belum Login ({idleCount})</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onSimulateWork();
            }}
            title="Simulasikan pergerakan jawaban siswa di lab"
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#183F27] border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
            <span>Simulasi Progress Lab</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setShowAddModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Peserta Manual</span>
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="card-3d rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#112B1C] text-sm sm:text-base">
              Daftar Klien Komputer Peserta Lab CBT
            </h3>
            <p className="text-xs text-stone-500">
              Pengawasan aktivitas waktu nyata peserta ujian di SDN 4 Lalembuu
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {filtered.length} Klien Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#F4F8F5] text-stone-600 uppercase text-[10px] tracking-wider font-bold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">NISN & Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Status Ujian</th>
                <th className="py-3 px-4">Soal Terjawab</th>
                <th className="py-3 px-4">Sisa Waktu</th>
                <th className="py-3 px-4">Nilai Sementara</th>
                <th className="py-3 px-4 text-center">Aksi Proktor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((student, idx) => (
                <tr key={student.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-stone-500">
                    {(idx + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#143221]">{student.name}</div>
                    <div className="text-[11px] font-mono text-stone-400">
                      NISN: {student.nisn} • IP: {student.ipAddress || '192.168.1.' + (100 + idx)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-stone-600">
                    {student.grade}
                  </td>
                  <td className="py-3.5 px-4">
                    {student.status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        Sedang Mengerjakan
                      </span>
                    )}
                    {student.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Selesai Ujian
                      </span>
                    )}
                    {student.status === 'idle' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                        Belum Login
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#133020]">
                        {student.answeredCount}/{student.totalQuestions}
                      </span>
                      <div className="w-16 h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${(student.answeredCount / student.totalQuestions) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-stone-700">
                    {student.status === 'in_progress' ? (
                      formatDuration(student.remainingSeconds)
                    ) : student.status === 'completed' ? (
                      <span className="text-emerald-700 font-semibold text-[11px]">Terkirim</span>
                    ) : (
                      '--:--'
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {student.status === 'completed' ? (
                      <span className="font-mono font-black text-sm text-[#112E1D] bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                        {student.score}
                      </span>
                    ) : (
                      <span className="text-stone-400 italic text-[11px]">Belum submit</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          sound.playClick();
                          onResetStudent(student.id);
                        }}
                        title="Reset sesi login peserta agar dapat login kembali jika terjadi kendala"
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-900 border border-stone-200 text-stone-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-700" />
                        <span>Reset Login</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-amber-400/40 shadow-2xl">
            <h3 className="text-base font-semibold text-[#143220] mb-1">
              Tambah Peserta Ujian Baru
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Daftarkan siswa baru ke lab CBT
            </p>

            <form onSubmit={handleCreateStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nama Lengkap Siswa:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Muhammad Ilham"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-[#1E4D34] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nomor Induk Siswa Nasional (NISN):
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={newNisn}
                  onChange={(e) => setNewNisn(e.target.value)}
                  placeholder="Contoh: 0089123411"
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-xl focus:border-[#1E4D34] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Rombongan Belajar (Kelas):
                </label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white focus:border-[#1E4D34] outline-none"
                >
                  <optgroup label="Jenjang SD/MI">
                    <option value="Kelas 1">Kelas 1 SD/MI</option>
                    <option value="Kelas 2">Kelas 2 SD/MI</option>
                    <option value="Kelas 3">Kelas 3 SD/MI</option>
                    <option value="Kelas 4">Kelas 4 SD/MI</option>
                    <option value="Kelas 5A">Kelas 5A SD/MI</option>
                    <option value="Kelas 5B">Kelas 5B SD/MI</option>
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

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#173C27] text-amber-300 hover:bg-[#204F34] shadow-sm cursor-pointer"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

