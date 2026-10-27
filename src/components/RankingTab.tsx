import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  FileCheck2,
  Download,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ExamConfig, Student } from '../types/cbt';
import { sound } from '../utils/soundEffects';
import { BeritaAcaraModal } from './BeritaAcaraModal';

interface RankingTabProps {
  examConfig: ExamConfig;
  students: Student[];
}

export const RankingTab: React.FC<RankingTabProps> = ({ examConfig, students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBeritaAcara, setShowBeritaAcara] = useState(false);

  // Sort completed first by score desc, then by answeredCount desc
  const sorted = [...students].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (b.status === 'completed' && a.status !== 'completed') return 1;
    return b.score - a.score || b.correctAnswers - a.correctAnswers;
  });

  const filtered = sorted.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm)
  );

  const completedList = students.filter((s) => s.status === 'completed');
  const avgScore =
    completedList.length > 0
      ? Math.round(
          completedList.reduce((acc, curr) => acc + curr.score, 0) /
            completedList.length
        )
      : 0;

  const highestScore = completedList.length > 0 ? Math.max(...completedList.map((s) => s.score)) : 0;
  const lowestScore = completedList.length > 0 ? Math.min(...completedList.map((s) => s.score)) : 0;

  const handleDownloadCsv = () => {
    sound.playClick();
    const headers = [
      'Peringkat',
      'NISN',
      'Nama_Siswa',
      'Kelas',
      'Status',
      'Jumlah_Benar',
      'Jumlah_Salah',
      'Nilai_Akhir',
    ];
    const rows = sorted.map((s, idx) => [
      idx + 1,
      `"${s.nisn}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.grade}"`,
      s.status === 'completed'
        ? 'Selesai'
        : s.status === 'in_progress'
        ? 'Sedang Ujian'
        : 'Belum Mulai',
      s.correctAnswers,
      s.wrongAnswers,
      s.score,
    ]);

    const rawCsv = [headers.join(','), ...rows.map((e) => e.join(','))].join(
      '\r\n'
    );
    const blob = new Blob([`\uFEFF${rawCsv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Rekap_Nilai_CBT_${examConfig.testCode}_SDN4_Lalembuu.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-3d rounded-2xl p-4 border border-emerald-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-semibold">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Nilai Tertinggi</span>
            <span className="text-xl font-semibold text-amber-600">{highestScore}</span>
            <span className="text-[10px] text-stone-400 block">Skala 100</span>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-4 border border-emerald-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#143521] flex items-center justify-center font-semibold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Rata-Rata Lab</span>
            <span className="text-xl font-semibold text-[#133020]">{avgScore}</span>
            <span className="text-[10px] text-stone-400 block">Siswa Selesai</span>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-4 border border-emerald-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-semibold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Nilai Terendah</span>
            <span className="text-xl font-semibold text-stone-700">{lowestScore}</span>
            <span className="text-[10px] text-stone-400 block">Batas KKM: 70</span>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-4 border border-emerald-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-semibold">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Tingkat Tuntas</span>
            <span className="text-xl font-semibold text-emerald-800">
              {completedList.length > 0
                ? Math.round(
                    (completedList.filter((s) => s.score >= 70).length /
                      completedList.length) *
                      100
                  )
                : 0}
              %
            </span>
            <span className="text-[10px] text-emerald-700 block">Memenuhi Target</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="card-3d rounded-2xl p-4 border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari siswa di papan peringkat..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#1E4D34] outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#153823] border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Unduh CSV / Excel</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setShowBeritaAcara(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Cetak Berita Acara Ujian</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card-3d rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#112B1C] text-sm sm:text-base">
              Peringkat & Hasil Simulasi CBT Siswa
            </h3>
            <p className="text-xs text-stone-500">
              Mata Pelajaran: {examConfig.subject} ({examConfig.grade}) • Kode: {examConfig.testCode}
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
            SD Negeri 4 Lalembuu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#F4F8F5] text-stone-600 uppercase text-[10px] tracking-wider font-bold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Peringkat</th>
                <th className="py-3 px-4">NISN & Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Benar</th>
                <th className="py-3 px-4 text-center">Salah</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((student, idx) => {
                const rank = idx + 1;
                return (
                  <tr key={student.id} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      {rank === 1 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-400 text-stone-950 font-black text-xs shadow-sm">
                          <Medal className="w-3.5 h-3.5" />
                          Juara 1
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-300 text-stone-900 font-black text-xs">
                          <Medal className="w-3.5 h-3.5 text-stone-700" />
                          Juara 2
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-700 text-amber-100 font-black text-xs">
                          <Medal className="w-3.5 h-3.5" />
                          Juara 3
                        </span>
                      ) : (
                        <span className="font-mono text-stone-400 ml-2">
                          #{rank}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#143221]">{student.name}</div>
                      <div className="text-[11px] font-mono text-stone-400">
                        NISN: {student.nisn}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-600">
                      {student.grade}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                      {student.status === 'completed' ? student.correctAnswers : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-rose-600">
                      {student.status === 'completed' ? student.wrongAnswers : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      {student.status === 'completed' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Selesai
                        </span>
                      ) : student.status === 'in_progress' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          Sedang Ujian
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-500">
                          Belum Mulai
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {student.status === 'completed' ? (
                        <span
                          className={`font-mono font-black text-base px-2.5 py-1 rounded-lg border ${
                            student.score >= 85
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : student.score >= 70
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          {student.score}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic text-xs">--</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showBeritaAcara && (
        <BeritaAcaraModal
          examConfig={examConfig}
          students={students}
          onClose={() => setShowBeritaAcara(false)}
        />
      )}
    </div>
  );
};
