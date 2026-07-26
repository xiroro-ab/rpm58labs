import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Wifi, WifiOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { cloudSyncManager } from '../lib/cloudSync';

interface PWAPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAPrompt({ isOpen, onClose }: PWAPromptProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      toast.success('Aplikasi berhasil diinstall!', { icon: '🎉' });
    });

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', () => {});
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    
    if (result.outcome === 'accepted') {
      toast.success('Terima kasih telah menginstall!', { icon: '📱' });
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
    onClose();
  };

  const handleForceUpdate = () => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
    toast.success('Aplikasi diupdate!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between border-b ${
          isOnline ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-xs font-semibold ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {isInstalled ? (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Smartphone className="w-6 h-6" />
                <Zap className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Aplikasi Terinstall</p>
              <p className="text-xs text-slate-500">Akses dari home screen untuk pengalaman terbaik</p>
            </div>
          ) : (
            <>
              {isInstallable ? (
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Install Aplikasi
                </button>
              ) : (
                <div className="text-center space-y-2">
                  <Smartphone className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">Install Aplikasi</p>
                  <p className="text-xs text-slate-500">
                    Buka menu browser &gt; "Install" atau "Add to Home Screen"
                  </p>
                </div>
              )}
            </>
          )}

          {/* Offline Info */}
          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <p className="font-semibold mb-1">Mode Offline</p>
              <p>Data akan tersimpan di lokal dan sync otomatis saat online kembali.</p>
            </div>
          )}

          {/* Version Info */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400">v2.0.0</span>
            <button
              onClick={handleForceUpdate}
              className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold"
            >
              Check Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
