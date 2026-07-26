import React, { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

interface PWAPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAPrompt({ isOpen, onClose }: PWAPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') toast.success('Terinstall!', { icon: '📱' });
    setDeferredPrompt(null);
    onClose();
  };

  if (!isOpen || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 px-4 py-3 flex items-center gap-3 min-w-[280px]">
        <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <p className="text-sm text-slate-700 flex-1">Install aplikasi untuk akses cepat</p>
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Install
        </button>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
