import { useState, useEffect, useCallback } from 'react';
import { AppBrandingConfig } from '../types/cbt';
import { resolveBrandIcons } from './cbtLogic';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type DevicePlatform = 'desktop' | 'android' | 'ios';

export function detectDevicePlatform(): DevicePlatform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/i.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [detectedPlatform] = useState<DevicePlatform>(() =>
    detectDevicePlatform()
  );

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true)
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<
    'accepted' | 'dismissed' | 'unavailable'
  > => {
    if (!deferredPrompt) {
      return 'unavailable';
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    return outcome;
  }, [deferredPrompt]);

  return {
    isInstallable: deferredPrompt !== null && !isInstalled,
    isInstalled,
    detectedPlatform,
    promptInstall,
  };
}

/**
 * Synchronizes browser favicon, Apple touch icon, and mobile app title in <head>
 * whenever Admin updates custom branding icons.
 */
export function syncDocumentBrandingIcons(branding: AppBrandingConfig): void {
  if (typeof document === 'undefined') return;
  const { navbarIconUrl, installIconUrl, shortName } =
    resolveBrandIcons(branding);

  const faviconEl = document.getElementById(
    'dynamic-favicon'
  ) as HTMLLinkElement | null;
  if (faviconEl) {
    faviconEl.href = navbarIconUrl || installIconUrl || '/pwa-192x192.png';
  }

  const appleIconEl = document.getElementById(
    'dynamic-apple-touch-icon'
  ) as HTMLLinkElement | null;
  if (appleIconEl) {
    appleIconEl.href = installIconUrl || '/apple-touch-icon.png';
  }

  const appleTitleEl = document.getElementById(
    'dynamic-apple-title'
  ) as HTMLMetaElement | null;
  if (appleTitleEl) {
    appleTitleEl.content = shortName || 'CBT SDN 4';
  }
}
