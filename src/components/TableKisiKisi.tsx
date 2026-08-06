import React, { useState, useEffect } from 'react';
import { Download, X, Loader2, History, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { RPMFormData } from '../types';
import { LoadingOverlay } from './LoadingOverlay';

interface TableHistoryItem {
  id: string;
  title: string;
  date: string;
  subject: string;
  phase: string;
  tableHtml: string;
}

interface TableKisiKisiProps {
  isOpen: boolean;
  onClose: () => void;
  rpmHtml: string;
  formData: RPMFormData | null;
  customApiKey?: string;
  aiProvider?: string;
}

export default function TableKisiKisi({ isOpen, onClose, rpmHtml, formData, customApiKey, aiProvider }: TableKisiKisiProps) {
  const [tableHtml, setTableHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [history, setHistory] = useState<TableHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('tableKisiKisiHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse table history', e);
      }
    }
  }, [isOpen]);

  const saveToHistory = (html: string) => {
    if (!html || !formData) return;

    const newItem: TableHistoryItem = {
      id: Date.now().toString(),
      title: `Kisi-Kisi ${formData.subject} ${formData.phase}`,
      date: new Date().toISOString(),
      subject: formData.subject,
      phase: formData.phase,
      tableHtml: html
    };

    setHistory(prev => {
      const next = [newItem, ...prev].slice(0, 20);
      localStorage.setItem('tableKisiKisiHistory', JSON.stringify(next));
      return next;
    });
  };

  const loadFromHistory = (item: TableHistoryItem) => {
    setTableHtml(item.tableHtml);
    setShowHistory(false);
    toast.success('Tabel dimuat dari riwayat');
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
      const next = prev.filter(item => item.id !== id);
      localStorage.setItem('tableKisiKisiHistory', JSON.stringify(next));
      return next;
    });
    toast.success('Riwayat dihapus');
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('tableKisiKisiHistory');
    toast.success('Semua riwayat dihapus');
  };

  const handleGenerateTable = async () => {
    if (!rpmHtml) {
      toast.error('RPM belum tersedia');
      return;
    }

    setIsGenerating(true);
    setTableHtml('');

    try {
      const response = await fetch('/api/generate-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rpmHtml,
          formData,
          customApiKey,
          aiProvider
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Gagal menghubungi server.';
        try {
          const json = await response.json();
          errorMessage = typeof json.error === 'string' ? json.error : (json.error?.message || json.message || JSON.stringify(json));
        } catch (e) {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');
      const decoder = new TextDecoder();
      const MARKER = '@@@FINAL@@@';
      let buffer = '';
      let finalMode = false;
      let finalText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        if (finalMode) {
          finalText += buffer;
          buffer = '';
          continue;
        }

        const markerIdx = buffer.indexOf(MARKER);
        if (markerIdx !== -1) {
          finalMode = true;
          finalText = buffer.slice(markerIdx + MARKER.length);
          buffer = '';
        }
      }

      if (!finalMode) finalText = buffer;

      let cleanFinal = finalText.replace(/^```html\n?/i, '').replace(/^```/i, '').replace(/\n?```$/i, '').trim();

      if (cleanFinal.startsWith('@@ERROR@@')) {
        let msg = 'Gagal memproses respons AI untuk tabel.';
        try { msg = JSON.parse(cleanFinal.slice('@@ERROR@@'.length))?.error || msg; }
        catch (e) {}
        setTableHtml('');
        throw new Error(msg);
      }

      setTableHtml(cleanFinal);
      saveToHistory(cleanFinal);
      toast.success('Tabel kisi-kisi berhasil dibuat!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal membuat tabel kisi-kisi.', {
        duration: 6000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!tableHtml) {
      toast.error('Tabel belum tersedia');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: tableHtml,
          orientation,
          filename: `Tabel_Kisi-Kisi_${formData?.subject || 'Mapel'}_Kelas_${formData?.phase || ''}.pdf`,
          footerText: `Tabel Kisi-Kisi ${formData?.subject || ''} ${formData?.phase || ''} - ${formData?.school || ''}`
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error((errData && errData.error) ? errData.error : 'Gagal dari server');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tabel_Kisi-Kisi_${formData?.subject || 'Mapel'}_Kelas_${formData?.phase || ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Gagal membuat PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <LoadingOverlay isVisible={isDownloading} message="Menyiapkan PDF Tabel Kisi-Kisi..." />
      <LoadingOverlay isVisible={isGenerating} message="AI sedang membuat tabel kisi-kisi..." />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Tabel Kisi-Kisi Soal</h2>
                <p className="text-xs text-slate-500 mt-0.5">Berdasarkan RPM yang sudah di-generate</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    showHistory 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white text-slate-600 hover:bg-green-50 border border-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat ({history.length})</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleGenerateTable}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-button ${
                isGenerating
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
                  <span>Generate Tabel Kisi-Kisi</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={!tableHtml || isDownloading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-button ${
                !tableHtml || isDownloading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <div className="flex items-center gap-1 border border-slate-300 rounded-lg overflow-hidden bg-white" title="Orientasi halaman PDF">
              <button
                onClick={() => setOrientation('portrait')}
                disabled={isDownloading}
                className={`px-3 py-2 text-xs font-semibold transition-all ${
                  orientation === 'portrait' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50'
                }`}
              >
                Potret
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                disabled={isDownloading}
                className={`px-3 py-2 text-xs font-semibold transition-all ${
                  orientation === 'landscape' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50'
                }`}
              >
                Lanskap
              </button>
            </div>

            {tableHtml && (
              <span className="text-xs text-green-600 font-medium ml-2">
                ✓ Tabel siap diunduh
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex">
            {showHistory && history.length > 0 && (
              <div className="w-72 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
                <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Riwayat Tabel</span>
                  <button
                    onClick={clearAllHistory}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Hapus Semua
                  </button>
                </div>
                <div className="p-2 space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="p-3 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-300 rounded-lg cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-slate-800 truncate">{item.title}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded">
                              {item.subject}
                            </span>
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded">
                              {item.phase}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 custom-scrollbar">
              {!tableHtml && !isGenerating && (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-20 h-20 flex items-center justify-center mb-4 bg-slate-200 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Tabel</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Klik tombol "Generate Tabel Kisi-Kisi" untuk membuat kisi-kisi soal dan kartu soal berdasarkan RPM yang sudah ada.
                  </p>
                </div>
              )}

              {isGenerating && !tableHtml && (
                <div className="flex flex-col items-center justify-center h-full py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
                  <p className="text-sm text-slate-600">AI sedang membuat tabel kisi-kisi...</p>
                </div>
              )}

              {tableHtml && (
                <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: tableHtml }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
