import React, { useState, useRef, useEffect } from 'react';
import { X, Download, History, Clock, Trash2 } from 'lucide-react';

interface AidsHistoryItem {
  id: string;
  topic: string;
  date: string;
  html: string;
}

interface TeachingAidsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rpmHtml: string;
  topic: string;
}

const STORAGE_KEY = 'rpm_teachingAids';

function loadHistory(): AidsHistoryItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveHistory(items: AidsHistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
}

export default function TeachingAidsModal({ isOpen, onClose, rpmHtml, topic }: TeachingAidsModalProps) {
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [history, setHistory] = useState<AidsHistoryItem[]>(loadHistory);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const displayHtml = selectedHistory
    ? history.find(h => h.id === selectedHistory)?.html || ''
    : result;

  const hasResult = !!displayHtml.trim();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const existing = history.find(h => h.topic === topic);
      if (existing) {
        setSelectedHistory(existing.id);
        setResult(existing.html);
        setShowHistory(true);
      } else {
        setResult('');
        setSelectedHistory(null);
        setShowHistory(false);
        generateAids();
      }
    }
  }, [isOpen]);

  const generateAids = async () => {
    setIsLoading(true);
    setSelectedHistory(null);
    setShowHistory(false);
    try {
      const response = await fetch('/api/teaching-aids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rpmHtml, topic }),
      });

      if (!response.ok) {
        let errMsg = 'Gagal';
        try { const text = await response.text(); try { const j = JSON.parse(text); errMsg = j.error || text; } catch { errMsg = text || `HTTP ${response.status}`; } } catch {}
        throw new Error(errMsg);
      }

      setIsStreaming(true);
      const text = await response.text();
      setResult(text);
      setIsStreaming(false);

      const newItem: AidsHistoryItem = {
        id: Date.now().toString(),
        topic,
        date: new Date().toISOString(),
        html: text,
      };
      const updated = [newItem, ...history.filter(h => h.topic !== topic)].slice(0, 20);
      setHistory(updated);
      saveHistory(updated);
      setSelectedHistory(newItem.id);
    } catch (err: any) {
      console.error(err);
      setResult(`<div class="aid-error">Gagal: ${err.message}</div>`);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const deleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
    if (selectedHistory === id) {
      setSelectedHistory(null);
      setResult('');
    }
  };

  const sanitizeSvg = (html: string): string => {
    return html.replace(/on\w+=["'][^"']*["']/gi, '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const downloadHtml = () => {
    const blob = new Blob([displayHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Visual_Aids_${topic.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-warm-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-card">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Alat Bantu Visual</h2>
              <p className="text-xs text-slate-500 mt-0.5">SVG + link gambar + prompt AI untuk tiap aktivitas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {displayHtml && (
              <button onClick={downloadHtml}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-warm-border text-slate-600 text-xs font-semibold rounded-lg hover:bg-warm shadow-card transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}
            {history.length > 0 && (
              <button onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-warm-border text-slate-600 text-xs font-semibold rounded-lg hover:bg-warm shadow-card transition-all"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Riwayat</span>
              </button>
            )}
            <button onClick={generateAids} disabled={isLoading}
              className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-light shadow-button transition-all disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 12a9 9 0 0 0 15 6.7L21 16"/></svg>
              Generate Ulang
            </button>
            <button onClick={() => { if (hasResult && !confirmClose) { setConfirmClose(true); } else { onClose(); setConfirmClose(false); } }} className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500 relative">
              {confirmClose && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-warm-border rounded-lg shadow-xl p-4 w-64 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <p className="text-xs text-slate-700 mb-3">Hasil visual akan tersimpan otomatis di riwayat. Yakin tutup?</p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={(e) => { e.stopPropagation(); setConfirmClose(false); }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">Batal</button>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); setConfirmClose(false); }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-md hover:bg-primary-light transition-colors">Ya, Tutup</button>
                  </div>
                </div>
              )}
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {showHistory && history.length > 0 && (
            <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-warm-border bg-warm-light/50 overflow-y-auto custom-scrollbar p-3 space-y-2 shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Riwayat Visual</p>
              {history.map((item) => (
                <div key={item.id}
                  onClick={() => { setSelectedHistory(item.id); setResult(item.html); }}
                  className={`p-2 rounded-lg border cursor-pointer transition-all text-xs ${
                    selectedHistory === item.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-warm-border hover:border-primary/30 bg-white'
                  }`}
                >
                  <p className="font-semibold text-slate-700 truncate">{item.topic}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteHistory(item.id); }}
                    className="mt-1 text-red-400 hover:text-red-600 text-[10px] flex items-center gap-0.5">
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-warm/30" ref={contentRef}>
            {isLoading && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-sm text-slate-500 font-medium">AI sedang menganalisis RPM...</p>
                <p className="text-xs text-slate-400 mt-1">Membuat SVG ilustrasi + link untuk setiap aktivitas</p>
              </div>
            )}

            {isStreaming && (
              <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                AI sedang membuat...
              </div>
            )}

            {displayHtml && (
              <div
                className="teaching-aids-results"
                dangerouslySetInnerHTML={{ __html: sanitizeSvg(displayHtml) }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}