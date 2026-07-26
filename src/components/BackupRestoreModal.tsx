import React, { useState } from 'react';
import { X, Download, Upload, Trash2, History as HistoryIcon, HardDrive } from 'lucide-react';
import { HistoryItem } from '../types';
import toast from 'react-hot-toast';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onHistoryUpdate: (history: HistoryItem[]) => void;
}

export function BackupRestoreModal({ isOpen, onClose, history, onHistoryUpdate }: BackupRestoreModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleExportBackup = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      history,
      templateManager: localStorage.getItem('rpm_templates'),
      formData: localStorage.getItem('rpmFormData'),
      settings: {
        aiProvider: localStorage.getItem('aiProvider'),
        timestamp: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpm-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Backup berhasil diekspor!', { icon: '💾' });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (!data.version || !data.history) {
          throw new Error('Format file backup tidak valid');
        }

        // Restore history
        if (data.history) {
          onHistoryUpdate(data.history);
          localStorage.setItem('rpmHistory', JSON.stringify(data.history));
        }

        // Restore templates
        if (data.templateManager) {
          localStorage.setItem('rpm_templates', data.templateManager);
        }

        // Restore form data
        if (data.formData) {
          localStorage.setItem('rpmFormData', data.formData);
        }

        // Restore settings
        if (data.settings?.aiProvider) {
          localStorage.setItem('aiProvider', data.settings.aiProvider);
        }

        toast.success(`Backup berhasil di-restore! ${data.history.length} RPM ditemukan.`, { icon: '✅' });
        onClose();
        window.location.reload();
      } catch (error: any) {
        toast.error('File backup tidak valid: ' + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAllData = () => {
    if (history.length === 0) {
      toast.error('Tidak ada data untuk dihapus');
      return;
    }

    if (confirm('HAPUS SEMUA DATA RPM? Data yang sudah di-backup aman.\n\nTindakan ini TIDAK BISA DIBATALKAN!')) {
      if (confirm('YAKIN? Semua RPM, template, dan riwayat akan dihapus permanen.')) {
        localStorage.removeItem('rpmHistory');
        localStorage.removeItem('rpmFormData');
        localStorage.removeItem('rpm_templates');

        // Clear version histories
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('rpm_versions_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        onHistoryUpdate([]);
        toast.success('Semua data berhasil dihapus', { icon: '🗑️' });
        onClose();
        window.location.reload();
      }
    }
  };

  if (!isOpen) return null;

  const backupSize = new Blob([JSON.stringify({ history, templates: '' })]).size;
  const totalStorage = history.reduce((sum, item) => sum + (item.markdown?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <HardDrive className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Backup & Restore</h2>
              <p className="text-xs text-slate-500 mt-0.5">Aman tanpa perlu login</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {/* Storage Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm">Penyimpanan Lokal</h3>
              <HistoryIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Total RPM</p>
                <p className="text-xl font-bold text-slate-800">{history.length}</p>
              </div>
              <div>
                <p className="text-slate-500">Ukuran Data</p>
                <p className="text-xl font-bold text-slate-800">
                  {(totalStorage / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </div>

          {/* Export Backup */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Download className="w-4 h-4 text-green-600" />
                Export Backup
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600">
                Download semua data ke file JSON. Backup ini mencakup:
              </p>
              <ul className="text-xs text-slate-500 space-y-1 ml-4 list-disc">
                <li>Semua riwayat RPM</li>
                <li>Template custom</li>
                <li>Data form terakhir</li>
                <li>Pengaturan AI Provider</li>
              </ul>
              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Backup
              </button>
            </div>
          </div>

          {/* Import Restore */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Import Restore
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600">
                Restore data dari file backup sebelumnya.
              </p>
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                Pilih File Backup
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>

          {/* Clear Data */}
          <div className="border border-red-200 rounded-lg overflow-hidden">
            <div className="p-4 bg-red-50 border-b border-red-200">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                Hapus Semua Data
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-red-600">
                Hapus permanen semua data RPM, template, dan riwayat.
              </p>
              <button
                onClick={handleClearAllData}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Semua Data
              </button>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-700">
              💡 <strong>Tips:</strong> Lakukan backup secara berkala. Simpan file backup di tempat aman.
              Restore akan me-reload halaman secara otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
