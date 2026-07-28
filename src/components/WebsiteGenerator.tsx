import React, { useState } from 'react';
import { X, Download, ExternalLink, MessageSquare } from 'lucide-react';

interface WebsiteGeneratorProps {
  rpmHtml: string;
  topic: string;
}

export default function WebsiteGenerator({ rpmHtml, topic }: WebsiteGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [websiteHtml, setWebsiteHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const generate = async () => {
    setIsLoading(true);
    setError('');
    setWebsiteHtml('');
    try {
      const res = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rpmHtml, topic }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setWebsiteHtml(data.html);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openInTab = () => {
    const w = window.open('', '_blank');
    if (w) { w.document.write(websiteHtml); w.document.close(); }
  };

  const download = () => {
    const blob = new Blob([websiteHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Website_${topic.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reviseWebsite = async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    try {
      const res = await fetch('/api/revise-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: websiteHtml, instruction: chatInput }),
      });
      const data = await res.json();
      if (data.html) setWebsiteHtml(data.html);
    } catch (e: any) {
      alert('Gagal revisi: ' + e.message);
    } finally {
      setChatLoading(false);
      setChatInput('');
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!websiteHtml && !isLoading) generate();
  };

  if (!isOpen) {
    return (
      <button onClick={handleOpen}
        className="flex items-center gap-1.5 px-2.5 py-2 text-rose-700 bg-white hover:bg-rose-50 text-xs sm:text-sm font-semibold rounded-lg transition-all border border-rose-200 shadow-card hover:shadow-card-hover"
      >
        <span>🌐</span>
        <span className="hidden sm:inline">Website</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-warm-border bg-gradient-to-r from-rose-500/10 to-rose-500/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Website Pembelajaran</h2>
              <p className="text-xs text-slate-500">Tema Neo Brutalism — siap edit & hosting</p>
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
              <p className="text-sm text-slate-500">Membangun website...</p>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">{error}</div>}

          {websiteHtml && !isLoading && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
                ✅ Website siap! Pilih aksi di bawah.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={openInTab}
                  className="flex items-center justify-center gap-2 py-4 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all">
                  <ExternalLink className="w-5 h-5" /> Buka di Tab
                </button>
                <button onClick={download}
                  className="flex items-center justify-center gap-2 py-4 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500 shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all">
                  <Download className="w-5 h-5" /> Download HTML
                </button>
              </div>

              <div className="border-2 border-black rounded-lg overflow-hidden">
                <button onClick={() => setChatOpen(!chatOpen)}
                  className="flex items-center justify-between w-full p-4 bg-black text-white font-bold">
                  <span className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Revisi Website dengan AI</span>
                  <span>{chatOpen ? '▲' : '▼'}</span>
                </button>

                {chatOpen && (
                  <div className="p-4 bg-white">
                    <div className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') reviseWebsite(); }}
                        placeholder="Contoh: ganti background jadi hitam, tambah game..."
                        className="flex-1 px-4 py-3 border-2 border-black rounded text-sm focus:outline-none"
                      />
                      <button onClick={reviseWebsite} disabled={chatLoading || !chatInput.trim()}
                        className="px-6 py-3 bg-rose-600 text-white font-bold rounded border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-[1px_1px_0_#000] transition-all disabled:opacity-50">
                        {chatLoading ? '...' : 'Kirim'}
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Website akan direvisi sesuai instruksi. Hasilnya bisa di-download ulang.</p>
                  </div>
                )}
              </div>

              <details>
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">Lihat source code</summary>
                <pre className="mt-2 p-3 bg-slate-900 text-green-400 text-[10px] rounded-lg overflow-x-auto max-h-40">{websiteHtml.slice(0, 2000)}...</pre>
              </details>
            </div>
          )}

          {!websiteHtml && !isLoading && !error && (
            <button onClick={generate}
              className="w-full py-4 bg-black text-white font-bold rounded-lg shadow-[4px_4px_0_#FF6B6B] hover:shadow-[2px_2px_0_#FF6B6B] transition-all text-lg">
              🚀 Generate Website
            </button>
          )}
        </div>
      </div>
    </div>
  );
}