import React, { useState, useEffect } from 'react';
import { X, Cloud, CloudOff, RefreshCw, Check, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import { cloudSyncManager, CloudSyncConfig, SyncStatus } from '../lib/cloudSync';
import { HistoryItem } from '../types';
import toast from 'react-hot-toast';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onHistoryUpdate: (history: HistoryItem[]) => void;
}

export function CloudSyncModal({ isOpen, onClose, history, onHistoryUpdate }: CloudSyncModalProps) {
  const [config, setConfig] = useState<CloudSyncConfig>(cloudSyncManager.getConfig());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isSyncing: false });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setUserEmail(user?.email || '');
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Berhasil login dengan Google!');
    } catch (error: any) {
      toast.error('Gagal login: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Berhasil logout');
      setConfig({ ...config, provider: 'local', autoSync: false });
      cloudSyncManager.updateConfig({ provider: 'local', autoSync: false });
    } catch (error: any) {
      toast.error('Gagal logout: ' + error.message);
    }
  };

  const handleSyncToCloud = async () => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    setSyncStatus({ isSyncing: true });
    try {
      const success = await cloudSyncManager.syncToCloud(history);
      if (success) {
        toast.success('Backup berhasil disimpan ke Google Drive!');
        setSyncStatus({ isSyncing: false, lastSync: new Date() });
      } else {
        throw new Error('Sync failed');
      }
    } catch (error: any) {
      toast.error('Gagal backup: ' + error.message);
      setSyncStatus({ isSyncing: false, error: error.message });
    }
  };

  const handleSyncFromCloud = async () => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    setSyncStatus({ isSyncing: true });
    try {
      const remoteHistory = await cloudSyncManager.syncFromCloud();
      if (remoteHistory && remoteHistory.length > 0) {
        // Show conflict resolution dialog if local history exists
        if (history.length > 0) {
          const strategy = await showConflictDialog();
          const merged = await cloudSyncManager.resolveConflict(history, remoteHistory, strategy);
          onHistoryUpdate(merged);
          localStorage.setItem('rpmHistory', JSON.stringify(merged));
          toast.success(`Restore berhasil! (${strategy === 'merge' ? 'Merged' : strategy === 'local' ? 'Local prioritized' : 'Remote prioritized'})`);
        } else {
          onHistoryUpdate(remoteHistory);
          localStorage.setItem('rpmHistory', JSON.stringify(remoteHistory));
          toast.success('Restore berhasil dari Google Drive!');
        }
        setSyncStatus({ isSyncing: false, lastSync: new Date() });
      } else {
        toast('Tidak ada backup ditemukan di Google Drive', { icon: 'ℹ️' });
        setSyncStatus({ isSyncing: false });
      }
    } catch (error: any) {
      toast.error('Gagal restore: ' + error.message);
      setSyncStatus({ isSyncing: false, error: error.message });
    }
  };

  const showConflictDialog = (): Promise<'local' | 'remote' | 'merge'> => {
    return new Promise((resolve) => {
      const choice = window.confirm(
        'Ada data lokal dan cloud. Pilih:\n\n' +
        'OK = Gabung (Merge)\n' +
        'Cancel = Timpa dengan Cloud'
      );
      resolve(choice ? 'merge' : 'remote');
    });
  };

  const handleConfigChange = (key: keyof CloudSyncConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    cloudSyncManager.updateConfig({ [key]: value });
  };

  const lastSyncTime = cloudSyncManager.getLastSyncTime();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              {isOnline ? (
                <Cloud className="w-6 h-6 text-sky-600" />
              ) : (
                <CloudOff className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Cloud Sync & Backup</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isOnline ? 'Online - Siap untuk sync' : 'Offline - Mode lokal aktif'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {/* Authentication Section */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-blue-600" />
              Autentikasi
            </h3>
            
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Terhubung dengan Google</p>
                      <p className="text-xs text-slate-500">{userEmail}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Login dengan Google untuk mengaktifkan cloud sync</p>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={!isOnline}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Login dengan Google
                </button>
              </div>
            )}
          </div>

          {/* Sync Actions */}
          {isAuthenticated && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Aksi Sync</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSyncToCloud}
                  disabled={syncStatus.isSyncing || !isOnline}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncStatus.isSyncing ? (
                    <RefreshCw className="w-6 h-6 text-sky-600 animate-spin" />
                  ) : (
                    <Cloud className="w-6 h-6 text-sky-600" />
                  )}
                  <span className="text-sm font-semibold text-slate-800">Backup ke Cloud</span>
                  <span className="text-xs text-slate-500">Upload data lokal</span>
                </button>

                <button
                  onClick={handleSyncFromCloud}
                  disabled={syncStatus.isSyncing || !isOnline}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncStatus.isSyncing ? (
                    <RefreshCw className="w-6 h-6 text-green-600 animate-spin" />
                  ) : (
                    <RefreshCw className="w-6 h-6 text-green-600" />
                  )}
                  <span className="text-sm font-semibold text-slate-800">Restore dari Cloud</span>
                  <span className="text-xs text-slate-500">Download backup</span>
                </button>
              </div>

              {lastSyncTime && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                  <Check className="w-4 h-4 text-green-600" />
                  Last sync: {new Date(lastSyncTime).toLocaleString('id-ID')}
                </div>
              )}
            </div>
          )}

          {/* Auto Sync Settings */}
          {isAuthenticated && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Pengaturan Auto Sync</h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">Auto Backup</span>
                  <input
                    type="checkbox"
                    checked={config.autoSync}
                    onChange={(e) => handleConfigChange('autoSync', e.target.checked)}
                    className="w-5 h-5 text-sky-600 rounded focus:ring-2 focus:ring-sky-500"
                  />
                </label>

                {config.autoSync && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Interval Sync (menit)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={config.syncInterval}
                      onChange={(e) => handleConfigChange('syncInterval', parseInt(e.target.value) || 15)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 space-y-1">
                <p className="font-semibold">Catatan Penting:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Data disimpan di Google Drive appDataFolder (aman & private)</li>
                  <li>Auto backup hanya berjalan saat aplikasi terbuka</li>
                  <li>Pastikan koneksi internet stabil saat sync</li>
                  <li>Merge strategy akan menggabungkan data lokal & cloud</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
