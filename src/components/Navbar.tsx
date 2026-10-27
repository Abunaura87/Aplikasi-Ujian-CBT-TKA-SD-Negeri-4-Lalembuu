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
} from 'lucide-react';
import { ProktorTabType } from '../types/cbt';
import { sound } from '../utils/soundEffects';

interface NavbarProps {
  currentTab: ProktorTabType;
  onSelectTab: (tab: ProktorTabType) => void;
  onOpenStudentExam: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  onChangeFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
  testCode: string;
  activeSubject: string;
  activeGrade: string;
  activeTestCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenStudentExam,
  fontSize,
  onChangeFontSize,
  soundEnabled,
  onToggleSound,
  onLogout,
  testCode,
  activeSubject,
  activeGrade,
  activeTestCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-500/30 shadow-sm text-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm text-[#12331F] font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-[#11331F] text-base">
                SDN 4 LALEMBUU
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {testCode}
              </span>
              <span className="hidden xl:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                {activeSubject} ({activeGrade})
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 font-medium leading-tight">
              Tes Kemampuan Akademik Standar Nasional • {activeTestCount} Kode Tes Aktif
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center flex-wrap bg-emerald-50/90 p-1 rounded-xl border border-emerald-200 gap-0.5">
            <button
              onClick={() => {
                sound.playClick();
                onSelectTab('panel');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'panel'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 shadow-xs border border-amber-400'
                  : 'text-emerald-900 hover:bg-emerald-100/80'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Panel Guru</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSelectTab('aktivasi');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'aktivasi'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 shadow-xs border border-amber-400'
                  : 'text-emerald-900 hover:bg-emerald-100/80'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Pengaktifan Kode Tes</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSelectTab('soal');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'soal'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 shadow-xs border border-amber-400'
                  : 'text-emerald-900 hover:bg-emerald-100/80'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Kelola Soal</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSelectTab('peserta');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'peserta'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 shadow-xs border border-amber-400'
                  : 'text-emerald-900 hover:bg-emerald-100/80'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Status Peserta</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSelectTab('rangking');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'rangking'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 shadow-xs border border-amber-400'
                  : 'text-emerald-900 hover:bg-emerald-100/80'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Rangking</span>
            </button>
          </div>

          {/* Quick Preview Test Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenStudentExam();
            }}
            title="Buka simulasi pengerjaan soal ujian seperti di layar siswa"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-amber-300 text-xs font-bold border border-emerald-800 transition-all shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-300" />
            <span>Pratinjau Tes</span>
          </button>
        </div>

        {/* Right Controls & Profile */}
        <div className="flex items-center gap-2">
          {/* Font Size controls */}
          <div className="flex items-center bg-emerald-50 rounded-lg border border-emerald-200 p-0.5 text-xs text-emerald-900">
            <button
              onClick={() => onChangeFontSize('normal')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                fontSize === 'normal' ? 'bg-amber-400 text-stone-950' : 'hover:bg-emerald-100'
              }`}
              title="Ukuran Font Normal"
            >
              A-
            </button>
            <button
              onClick={() => onChangeFontSize('large')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                fontSize === 'large' ? 'bg-amber-400 text-stone-950' : 'hover:bg-emerald-100'
              }`}
              title="Ukuran Font Besar"
            >
              A
            </button>
            <button
              onClick={() => onChangeFontSize('xlarge')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                fontSize === 'xlarge' ? 'bg-amber-400 text-stone-950' : 'hover:bg-emerald-100'
              }`}
              title="Ukuran Font Sangat Besar"
            >
              A+
            </button>
          </div>

          {/* Audio Sound Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
            title={soundEnabled ? 'Matikan Suara Efek' : 'Nyalakan Suara Efek'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {/* User Profile Info */}
          <div className="hidden md:flex flex-col text-right pr-1">
            <span className="text-xs font-extrabold text-[#11331F]">
              Marhan, S.Pd.I., M.Pd.
            </span>
            <span className="text-[10px] font-semibold text-amber-700">
              Proktor / Guru Lab
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              sound.playClick();
              onLogout();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
            title="Keluar ke Halaman Login"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
