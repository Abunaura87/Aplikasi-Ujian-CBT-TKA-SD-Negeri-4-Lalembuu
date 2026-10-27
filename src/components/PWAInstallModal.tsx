import React, { useState } from 'react';
import {
  X,
  Laptop,
  Smartphone,
  Tablet,
  Download,
  CheckCircle2,
  Share,
  PlusSquare,
  Monitor,
  Sparkles,
  ShieldCheck,
  Wifi,
  WifiOff,
  Copy,
  Check,
} from 'lucide-react';
import { AppBrandingConfig } from '../types/cbt';
import {
  resolveBrandIcons,
  generateDesktopShortcutContent,
} from '../utils/cbtLogic';
import { DevicePlatform } from '../utils/usePWAInstall';
import { sound } from '../utils/soundEffects';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: AppBrandingConfig;
  isInstallable: boolean;
  isInstalled: boolean;
  detectedPlatform: DevicePlatform;
  onPromptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  isOnline: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  branding,
  isInstallable,
  isInstalled,
  detectedPlatform,
  onPromptInstall,
  isOnline,
}) => {
  const [selectedDeviceTab, setSelectedDeviceTab] = useState<DevicePlatform>(
    detectedPlatform || 'desktop'
  );
  const [installFeedback, setInstallFeedback] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  if (!isOpen) return null;

  const { installIconUrl, shortName } = resolveBrandIcons(branding);
  const appFullTitle = branding.loginAppTitle || 'Simulasi CBT / TKA';
  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';

  const handleTriggerNativeInstall = async () => {
    sound.playClick();
    const res = await onPromptInstall();
    if (res === 'accepted') {
      sound.playSuccess();
      setInstallFeedback(
        'Instalasi aplikasi berhasil dimulai! Ikon aplikasi akan muncul di perangkat Anda.'
      );
    } else if (res === 'dismissed') {
      setInstallFeedback(
        'Dialog instalasi ditutup. Anda dapat menginstal kembali kapan saja.'
      );
    } else {
      setInstallFeedback(
        'Browser Anda siap memasang aplikasi. Gunakan tombol "Unduh Pintasan Desktop (.url)" di bawah atau klik ikon Install (+) di bilah alamat browser.'
      );
    }
  };

  const handleDownloadDesktopLauncher = () => {
    sound.playSuccess();
    const content = generateDesktopShortcutContent(currentUrl, installIconUrl);
    const blob = new Blob([content], { type: 'application/internet-shortcut' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = shortName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'CBT_SDN4';
    a.download = `${safeName}_Launcher.url`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setInstallFeedback(
      `File pintasan "${safeName}_Launcher.url" berhasil diunduh! Simpan di Desktop Laptop/PC Anda untuk membuka aplikasi dengan 1 klik.`
    );
  };

  const handleCopyAppLink = () => {
    sound.playClick();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).catch(() => {});
    }
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full border-2 border-emerald-400/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#133822] via-[#1B4D2E] to-[#133822] text-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg border-2 border-amber-400 shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={installIconUrl}
                alt={shortName}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Ekstensi Multi-Device Progressive Web App (PWA)</span>
              </div>
              <h3
                id="pwa-install-modal-title"
                className="text-base sm:text-lg font-bold text-white leading-snug"
              >
                Install Aplikasi {appFullTitle}
              </h3>
              <p className="text-xs text-emerald-100/90">
                Mendukung Laptop/PC (Windows & Mac), Android, serta iPhone / iPad
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            data-testid="close-pwa-modal-btn"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Tutup Jendela Instalasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* App Launcher Preview Card */}
          <div className="p-4 rounded-2xl bg-[#F4FBF7] border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-emerald-300 shadow-sm p-1 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={installIconUrl}
                  alt="Preview Ikon Aplikasi"
                  data-testid="pwa-modal-preview-icon"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-[#11331F]">
                    Nama Ikon Layar Utama: "{shortName}"
                  </span>
                  {isInstalled ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                      ● Sudah Terinstal
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                      ● Siap Diinstal
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Ikon ini dapat diganti kapan saja oleh Admin/Proktor di menu Pengaturan Identitas & Ikon Aplikasi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold shrink-0">
              {isOnline ? (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Online & Siap Offline Cache</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mode Offline Aktif</span>
                </span>
              )}
            </div>
          </div>

          {installFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-950 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{installFeedback}</span>
            </div>
          )}

          {/* Device Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              Pilih Perangkat yang Anda Gunakan:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                data-testid="pwa-tab-desktop"
                onClick={() => {
                  sound.playClick();
                  setSelectedDeviceTab('desktop');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedDeviceTab === 'desktop'
                    ? 'bg-[#143923] text-amber-300 border-amber-400 shadow-md'
                    : 'bg-stone-50 hover:bg-emerald-50/70 text-stone-700 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Laptop className="w-4 h-4" />
                  {detectedPlatform === 'desktop' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                      Perangkat Ini
                    </span>
                  )}
                </div>
                <span className="text-xs font-extrabold mt-0.5">
                  Laptop / PC
                </span>
                <span
                  className={`text-[10px] ${
                    selectedDeviceTab === 'desktop'
                      ? 'text-emerald-100'
                      : 'text-stone-500'
                  }`}
                >
                  Windows, Mac, Chromebook
                </span>
              </button>

              <button
                type="button"
                data-testid="pwa-tab-android"
                onClick={() => {
                  sound.playClick();
                  setSelectedDeviceTab('android');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedDeviceTab === 'android'
                    ? 'bg-[#143923] text-amber-300 border-amber-400 shadow-md'
                    : 'bg-stone-50 hover:bg-emerald-50/70 text-stone-700 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Smartphone className="w-4 h-4" />
                  {detectedPlatform === 'android' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                      Perangkat Ini
                    </span>
                  )}
                </div>
                <span className="text-xs font-extrabold mt-0.5">
                  Android
                </span>
                <span
                  className={`text-[10px] ${
                    selectedDeviceTab === 'android'
                      ? 'text-emerald-100'
                      : 'text-stone-500'
                  }`}
                >
                  HP & Tablet Android
                </span>
              </button>

              <button
                type="button"
                data-testid="pwa-tab-ios"
                onClick={() => {
                  sound.playClick();
                  setSelectedDeviceTab('ios');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedDeviceTab === 'ios'
                    ? 'bg-[#143923] text-amber-300 border-amber-400 shadow-md'
                    : 'bg-stone-50 hover:bg-emerald-50/70 text-stone-700 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Tablet className="w-4 h-4" />
                  {detectedPlatform === 'ios' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                      Perangkat Ini
                    </span>
                  )}
                </div>
                <span className="text-xs font-extrabold mt-0.5">
                  iPhone / iPad
                </span>
                <span
                  className={`text-[10px] ${
                    selectedDeviceTab === 'ios'
                      ? 'text-emerald-100'
                      : 'text-stone-500'
                  }`}
                >
                  Safari iOS & iPadOS
                </span>
              </button>
            </div>
          </div>

          {/* Tab 1: Laptop / PC (Windows, macOS, Chromebook) */}
          {selectedDeviceTab === 'desktop' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#102C1D] flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-emerald-700" />
                    <span>Instalasi Aplikasi di Laptop / Komputer Lab</span>
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Pasang aplikasi sebagai jendela mandiri di Desktop Windows, macOS, atau Chromebook dengan ikon resmi sekolah.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  data-testid="pwa-install-native-btn"
                  onClick={handleTriggerNativeInstall}
                  className="btn-3d py-3 px-4 rounded-xl bg-gradient-to-r from-[#153822] to-[#1E4F31] hover:from-[#1B462B] hover:to-[#245E3B] text-amber-300 font-extrabold text-xs border border-amber-400/50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isInstallable
                      ? 'Install Aplikasi Sekarang (1-Klik)'
                      : 'Aktifkan Prompt Install Browser'}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="pwa-download-shortcut-btn"
                  onClick={handleDownloadDesktopLauncher}
                  className="btn-3d py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-stone-950 font-extrabold text-xs border border-amber-500 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Laptop className="w-4 h-4" />
                  <span>Unduh Pintasan Desktop (.url)</span>
                </button>
              </div>

              <div className="pt-2 border-t border-stone-200/80 space-y-2 text-xs text-stone-700">
                <div className="font-bold text-[#11331F]">
                  Cara Install via Google Chrome / Microsoft Edge di Laptop:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-stone-600">
                  <li>
                    Klik tombol <strong>Install Aplikasi Sekarang</strong> di atas, atau lihat pojok kanan bilah alamat URL browser (ikon komputer dengan tanda panah <strong>Install</strong>).
                  </li>
                  <li>
                    Klik <strong>Install / Pasang</strong> pada jendela konfirmasi yang muncul.
                  </li>
                  <li>
                    Aplikasi <strong>{shortName}</strong> akan langsung muncul di Desktop dan Start Menu / Dock Laptop Anda.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab 2: Android (HP & Tablet) */}
          {selectedDeviceTab === 'android' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102C1D] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>Instalasi Aplikasi di HP & Tablet Android</span>
                </h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  Aplikasi berjalan layar penuh (Full-Screen) seperti aplikasi Android native tanpa perlu lewat Play Store.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerNativeInstall}
                className="btn-3d w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#153822] to-[#1E4F31] text-amber-300 font-extrabold text-xs border border-amber-400/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Aplikasi di Android Sekarang</span>
              </button>

              <div className="space-y-2 text-xs text-stone-700 pt-1">
                <div className="font-bold text-[#11331F]">
                  Langkah Cepat di Chrome Android:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-xl bg-white border border-stone-200">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-extrabold text-[10px] mb-1">
                      Langkah 1
                    </span>
                    <p className="text-stone-600">
                      Buka aplikasi ini di <strong>Google Chrome</strong> Android, lalu ketuk ikon menu titik tiga <strong>(⋮)</strong> di pojok kanan atas.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-stone-200">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-extrabold text-[10px] mb-1">
                      Langkah 2
                    </span>
                    <p className="text-stone-600">
                      Pilih menu <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke layar utama"</strong>.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-stone-200">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-extrabold text-[10px] mb-1">
                      Langkah 3
                    </span>
                    <p className="text-stone-600">
                      Ketuk <strong>Instal</strong>. Ikon <strong>{shortName}</strong> otomatis tampil di layar utama HP Android Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: iPhone / iPad (iOS Safari) */}
          {selectedDeviceTab === 'ios' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102C1D] flex items-center gap-2">
                  <Tablet className="w-4 h-4 text-emerald-700" />
                  <span>Instalasi Aplikasi di iPhone & iPad (iOS / iPadOS)</span>
                </h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  Mendukung penuh Apple Touch Icon resolusi tinggi dan mode layar penuh (Standalone Web App) di iOS.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#11331F]">
                    <Share className="w-3.5 h-3.5 text-emerald-700" />
                    <span>1. Ketuk Tombol Bagikan</span>
                  </div>
                  <p className="text-stone-600">
                    Buka halaman ini di browser <strong>Safari</strong> iPhone/iPad, lalu ketuk ikon <strong>Bagikan (Share)</strong> di bilah bawah layar.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#11331F]">
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>2. Tambah ke Layar Utama</span>
                  </div>
                  <p className="text-stone-600">
                    Gulir menu ke bawah lalu pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#11331F]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>3. Ketuk Tambah (Add)</span>
                  </div>
                  <p className="text-stone-600">
                    Ketuk <strong>Tambah</strong> di pojok kanan atas. Ikon <strong>{shortName}</strong> siap dibuka dari Home Screen iPhone/iPad.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Share / Copy App Link Bar */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#11331F]">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Tautan instalasi lintas perangkat:{' '}
                <strong className="font-mono text-[11px]">{currentUrl}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyAppLink}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-[#12331F] border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tautan Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Salin Tautan Aplikasi</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Ekstensi PWA Standar W3C • SD Negeri 4 Lalembuu
          </span>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#143923] hover:bg-[#1E4F31] text-amber-300 font-bold text-xs cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
