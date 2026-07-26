import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, Trash2, Tag, Search } from 'lucide-react';
import { VersionHistory } from '../types';
import { versionControl } from '../lib/versionControl';
import toast from 'react-hot-toast';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyId: string | null;
  currentContent: string;
  onRestore: (content: string) => void;
}

export function VersionHistoryModal({ isOpen, onClose, historyId, currentContent, onRestore }: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<VersionHistory[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<VersionHistory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && historyId) {
      const loadedVersions = versionControl.getVersions(historyId);
      setVersions(loadedVersions);
    }
  }, [isOpen, historyId]);

  const handleRestore = (version: VersionHistory) => {
    if (confirm('Restore dokumen ke versi ini? Perubahan saat ini akan disimpan sebagai versi baru.')) {
      onRestore(version.content);
      toast.success('Dokumen berhasil di-restore!');
      onClose();
    }
  };

  const handleDelete = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Hapus versi ini?')) {
      if (historyId) {
        versionControl.deleteVersion(historyId, versionId);
        setVersions(prev => prev.filter(v => v.id !== versionId));
        toast.success('Versi dihapus');
      }
    }
  };

  const filteredVersions = versions.filter(v =>
    v.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    new Date(v.timestamp).toLocaleString('id-ID').includes(searchQuery)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Version History</h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
              {versions.length} versi
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan label atau tanggal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-1/3 border-r border-slate-200 overflow-y-auto custom-scrollbar bg-slate-50/30">
            {filteredVersions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 px-4">
                <Clock className="w-12 h-12 mb-3 opacity-20 mx-auto" />
                <p className="text-sm">Belum ada versi tersimpan.</p>
                <p className="text-xs mt-1">Perubahan akan otomatis disimpan.</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filteredVersions.map((version, index) => (
                  <div 
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                      selectedVersion?.id === version.id 
                        ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {index === 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded uppercase">
                              Terbaru
                            </span>
                          )}
                          {version.label && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">
                              <Tag className="w-3 h-3" />
                              {version.label}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          {new Date(version.timestamp).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {(version.content.length / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(version.id, e)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Hapus versi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {index === 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        <Clock className="w-3 h-3" />
                        Versi aktif saat ini
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedVersion ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">
                      Preview Versi
                    </h3>
                    <p className="text-xs text-slate-500">
                      {new Date(selectedVersion.timestamp).toLocaleString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore Versi Ini
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                  <div 
                    className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm text-sm"
                    dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <RotateCcw className="w-12 h-12 mb-3 opacity-20 mx-auto" />
                  <p className="text-sm">Pilih versi untuk melihat preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
