import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, MessageSquare, Clock, Trash2, History } from 'lucide-react';

interface WebHistoryItem {
  id: string;
  topic: string;
  date: string;
  html: string;
}

const STORAGE_KEY = 'rpm_websiteHistory';

function loadHistory(): WebHistoryItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveHistory(items: WebHistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
}

interface WebsiteGeneratorProps {
  rpmHtml: string;
  topic: string;
  customApiKey?: string;
}

export default function WebsiteGenerator({ rpmHtml, topic, customApiKey }: WebsiteGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [websiteHtml, setWebsiteHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [history, setHistory] = useState<WebHistoryItem[]>(loadHistory);

  useEffect(() => {
    if (isOpen) {
      const existing = history.find(h => h.topic === topic);
      if (existing) {
        setWebsiteHtml(existing.html);
      }
    }
  }, [isOpen]);

  const generate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rpmHtml, topic, customApiKey, aiProvider: localStorage.getItem('rpm_aiProvider') || 'gemini' }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }

      const newItem: WebHistoryItem = {
        id: Date.now().toString(),
        topic,
        date: new Date().toISOString(),
        html: data.html,
      };
      const updated = [newItem, ...history.filter(h => h.topic !== topic)].slice(0, 20);
      setHistory(updated);
      saveHistory(updated);
      setWebsiteHtml(data.html);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

  const openInTab = () => {
    if (!websiteHtml) return;
    const w = window.open('', '_blank');
    if (w) { w.document.write(websiteHtml); w.document.close(); }
  };

  const download = () => {
    if (!websiteHtml) return;
    const blob = new Blob([websiteHtml], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Belajar_${topic.replace(/\s+/g, '_')}.html`;
    a.click();
  };

  const reviseWebsite = async () => {
    if (!chatInput.trim() || !websiteHtml) return;
    setChatLoading(true);
    try {
      const res = await fetch('/api/revise-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: websiteHtml, instruction: chatInput, customApiKey }),
      });
      const data = await res.json();
      if (data.html) {
        setWebsiteHtml(data.html);
        const updated = history.map(h => h.topic === topic ? { ...h, html: data.html, date: new Date().toISOString() } : h);
        setHistory(updated);
        saveHistory(updated);
      }
    } catch (e: any) {
      alert('Gagal: ' + e.message);
    } finally {
      setChatLoading(false);
      setChatInput('');
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    const existing = history.find(h => h.topic === topic);
    if (!existing && !isLoading) generate();
  };

  const button = (
    <button onClick={handleOpen}
      className="flex items-center gap-1.5 px-2.5 py-2 text-rose-700 bg-white hover:bg-rose-50 text-xs sm:text-sm font-semibold rounded-lg transition-all border border-rose-200 shadow-card hover:shadow-card-hover"
    >
      <span>🌐</span>
      <span className="hidden sm:inline">Website</span>
    </button>
  );

  if (!isOpen) return button;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-warm-border bg-gradient-to-r from-rose-500/10 to-rose-500/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Website Siswa</h2>
              <p className="text-xs text-slate-500">Interaktif — siap dipakai siswa</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/50 rounded-lg text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-warm/30">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-500">Membuat website interaktif untuk siswa...</p>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">{error}</div>}

          {history.length > 0 && (
            <details className="mb-4">
              <summary className="text-xs font-semibold text-slate-400 cursor-pointer flex items-center gap-1">
                <History className="w-3 h-3" /> Riwayat Website ({history.length})
              </summary>
              <div className="mt-2 space-y-2">
                {history.map(item => (
                  <div key={item.id}
                    onClick={() => { setWebsiteHtml(item.html); }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${websiteHtml === item.html ? 'border-rose-500 bg-rose-50' : 'border-warm-border hover:border-rose-300 bg-white'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-700">{item.topic}</p>
                        <p className="text-[10px] text-slate-400"><Clock className="w-3 h-3 inline" /> {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deleteHistory(item.id); }}
                        className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {websiteHtml && !isLoading && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
                ✅ Website siap! Buka atau download untuk dipakai siswa.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={openInTab}
                  className="flex items-center justify-center gap-2 py-4 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all">
                  <ExternalLink className="w-5 h-5" /> Buka di Tab
                </button>
                <button onClick={generate} disabled={isLoading}
                  className="flex items-center justify-center gap-2 py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800 shadow-[4px_4px_0_#FF6B6B] transition-all">
                  🔄 Generate Ulang
                </button>
                <button onClick={download}
                  className="flex items-center justify-center gap-2 py-4 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500 shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all">
                  <Download className="w-5 h-5" /> Download HTML
                </button>
              </div>

              <div className="border-2 border-black rounded-lg overflow-hidden">
                <button onClick={() => {
                  const panel = document.getElementById('revisi-panel');
                  if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }}
                  className="flex items-center justify-between w-full p-4 bg-black text-white font-bold">
                  <span className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Revisi Website</span>
                  <span>▼</span>
                </button>
                <div id="revisi-panel" style={{ display: 'none' }} className="p-4 bg-white border-t-2 border-black">
                  <div className="flex gap-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') reviseWebsite(); }}
                      placeholder="Contoh: tambah game tebak gambar..."
                      className="flex-1 px-4 py-3 border-2 border-black rounded text-sm"
                    />
                    <button onClick={reviseWebsite} disabled={chatLoading || !chatInput.trim()}
                      className="px-6 py-3 bg-rose-600 text-white font-bold rounded border-2 border-black shadow-[3px_3px_0_#000] transition-all disabled:opacity-50">
                      {chatLoading ? '...' : 'Kirim'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!websiteHtml && !isLoading && !error && (
            <button onClick={generate}
              className="w-full py-4 bg-black text-white font-bold rounded-lg shadow-[4px_4px_0_#FF6B6B] hover:shadow-[2px_2px_0_#FF6B6B] transition-all text-lg">
              🚀 Buat Website Interaktif
            </button>
          )}
        </div>
      </div>
    </div>
  );
}