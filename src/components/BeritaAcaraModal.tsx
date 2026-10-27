import React from 'react';
import { Printer, X, CheckCircle, FileText, School } from 'lucide-react';
import { ExamConfig, Student } from '../types/cbt';
import { sound } from '../utils/soundEffects';

interface BeritaAcaraModalProps {
  examConfig: ExamConfig;
  students: Student[];
  onClose: () => void;
}

export const BeritaAcaraModal: React.FC<BeritaAcaraModalProps> = ({
  examConfig,
  students,
  onClose,
}) => {
  const completedStudents = students.filter((s) => s.status === 'completed');
  const presentCount = students.filter((s) => s.status !== 'idle').length;
  const absentCount = students.filter((s) => s.status === 'idle').length;

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-amber-400/40 shadow-2xl overflow-hidden my-6 text-stone-800">
        {/* Modal Header */}
        <div className="bg-[#122E1F] px-6 py-4 flex items-center justify-between text-white border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#122E1F] flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-amber-300">
                Berita Acara Pelaksanaan Ujian CBT
              </h3>
              <p className="text-xs text-emerald-200">
                SD Negeri 4 Lalembuu • Laboratorium Komputer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-stone-300 hover:text-white"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Document Sheet */}
        <div className="p-8 space-y-6 text-xs sm:text-sm bg-white font-serif leading-relaxed">
          {/* Formal Letterhead (Kop Surat) */}
          <div className="text-center border-b-2 border-stone-800 pb-4">
            <p className="text-xs font-bold tracking-widest text-stone-600 uppercase">
              PEMERINTAH KABUPATEN KONAWE SELATAN
            </p>
            <p className="text-xs font-bold tracking-widest text-stone-600 uppercase">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </p>
            <h2 className="text-lg sm:text-xl font-black text-stone-900 uppercase tracking-tight mt-0.5">
              SD NEGERI 4 LALEMBUU
            </h2>
            <p className="text-[11px] font-sans text-stone-600 italic">
              Alamat: Kec. Lalembuu, Kabupaten Konawe Selatan, Sulawesi Tenggara 93885
            </p>
          </div>

          <div className="text-center my-2">
            <h3 className="text-base font-bold uppercase underline tracking-wider text-stone-900">
              BERITA ACARA PELAKSANAAN UJIAN CBT
            </h3>
            <p className="text-xs font-sans text-stone-600 mt-0.5">
              Nomor: 421.2/045/SDN4-LLM/CBT/2026
            </p>
          </div>

          <p className="font-sans text-stone-700">
            Pada hari ini <strong>{todayStr}</strong>, bertempat di Laboratorium Komputer SD Negeri 4 Lalembuu, telah diselenggarakan simulasi dan pelaksanaan ujian berbasis komputer (CBT) dengan rincian sebagai berikut:
          </p>

          {/* Details Table */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 font-sans text-xs space-y-2">
            <div className="grid grid-cols-3">
              <span className="font-semibold text-stone-500">Mata Pelajaran</span>
              <span className="col-span-2 font-bold text-stone-900">: {examConfig.subject}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-stone-500">Jenjang / Kelas</span>
              <span className="col-span-2 font-bold text-stone-900">: {examConfig.educationLevel} ({examConfig.grade})</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-stone-500">Kode Tes Sesi</span>
              <span className="col-span-2 font-mono font-bold text-stone-900">: {examConfig.testCode}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-stone-500">Token Ruang CBT</span>
              <span className="col-span-2 font-mono font-bold text-amber-700">: {examConfig.token}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-stone-500">Jumlah Peserta Terdaftar</span>
              <span className="col-span-2 font-bold text-stone-900">: {students.length} Orang</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-stone-500">Peserta Hadir & Mengerjakan</span>
              <span className="col-span-2 font-bold text-emerald-800">: {presentCount} Orang</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-semibold text-stone-500">Peserta Tidak Hadir</span>
              <span className="col-span-2 font-bold text-rose-800">: {absentCount} Orang</span>
            </div>
          </div>

          <p className="font-sans text-stone-700">
            Pelaksanaan ujian berlangsung tertib, aman, dan lancar dengan sarana komputer lab yang memadai. Catatan selama ujian: seluruh paket soal terdistribusi dengan baik dan respon siswa terekam ke sistem database proktor.
          </p>

          {/* Formal Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-8 font-sans text-xs text-center">
            <div>
              <p className="text-stone-600">Mengetahui,</p>
              <p className="font-bold text-stone-900 mt-1">Kepala Sekolah SD Negeri 4 Lalembuu</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[10px] text-stone-400 italic">(Tanda Tangan & Cap Sekolah)</span>
              </div>
              <p className="font-bold text-stone-900 underline">HJ. ROSMINA, S.Pd., M.Pd.</p>
              <p className="text-stone-500 text-[11px]">NIP. 19740512 199803 2 004</p>
            </div>

            <div>
              <p className="text-stone-600">Lalembuu, {todayStr}</p>
              <p className="font-bold text-stone-900 mt-1">Proktor Utama / Pengawas Lab</p>
              <div className="h-20 flex items-center justify-center">
                <div className="px-3 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-[11px]">
                  Terverifikasi Digital CBT
                </div>
              </div>
              <p className="font-bold text-[#143521] underline">MARHAN, S.Pd.I., M.Pd.</p>
              <p className="text-stone-500 text-[11px]">NIP. 19850715 201101 1 012</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-colors"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
