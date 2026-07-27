import React, { useState, useCallback } from 'react';
import { X, Download } from 'lucide-react';

interface CanvaCodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
  rpmHtml: string;
  topic: string;
}

export default function CanvaCodeViewer({ isOpen, onClose, rpmHtml, topic }: CanvaCodeViewerProps) {
  const [htmlCode, setHtmlCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/teaching-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rpmHtml, topic }),
      });
      const data = await response.json();
      if (data.error) { setError(data.error); return; }

      const slides = data.slidesHtml || '';

      const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Presentasi: ${topic}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: #1e293b; color: #0f172a; }
.slide { width: 100vw; height: 100vh; display: none; flex-direction: column; background: white; scroll-snap-align: start; }
.slide.active { display: flex; }
.slide-header { display: flex; align-items: center; gap: 12px; padding: 16px 32px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
.slide-badge { background: #1a4185; color: white; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; letter-spacing: 0.5px; }
.slide-meeting { font-size: 13px; color: #64748b; }
.slide-counter { margin-left: auto; font-size: 13px; color: #94a3b8; font-weight: 600; }
.slide-body { flex: 1; display: flex; overflow: hidden; }
.slide-body svg { width: 50%; object-fit: contain; padding: 24px; background: #faf8f5; border-right: 2px solid #e2e8f0; }
.slide-content { width: 50%; padding: 40px; display: flex; flex-direction: column; justify-content: center; gap: 20px; overflow-y: auto; }
.slide-title { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1.2; }
.slide-text { font-size: 18px; color: #334155; line-height: 1.7; }
.slide-tip { font-size: 14px; color: #475569; background: #f0f9ff; border-radius: 8px; padding: 12px 16px; border-left: 4px solid #3b82f6; }
#nav { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; align-items: center; background: rgba(30,41,59,0.9); padding: 8px 16px; border-radius: 30px; z-index: 100; }
#nav button { background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: 600; }
#nav button:hover { background: rgba(255,255,255,0.3); }
#nav .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3); cursor: pointer; border: none; }
#nav .dot.active { background: #3b82f6; width: 24px; border-radius: 4px; }
#nav .counter { color: rgba(255,255,255,0.6); font-size: 12px; margin: 0 4px; }
@media (max-width: 768px) {
  .slide-body { flex-direction: column; }
  .slide-body svg { width: 100%; height: 40vh; border-right: none; border-bottom: 2px solid #e2e8f0; }
  .slide-content { width: 100%; padding: 24px; }
  .slide-title { font-size: 22px; }
  .slide-text { font-size: 16px; }
}
</style>
</head>
<body>
${slides}
<div id="nav">
<button id="prevBtn">←</button>
<span class="counter" id="counter">1 / 1</span>
<button id="nextBtn">→</button>
</div>
<script>
let current = 0; const slides = document.querySelectorAll('.slide');
function show(i) { slides.forEach((s,idx) => s.classList.toggle('active', idx === i)); document.getElementById('counter').textContent = (i+1)+' / '+slides.length; }
if (slides.length) { slides[0].classList.add('active'); document.getElementById('counter').textContent = '1 / '+slides.length; }
document.getElementById('prevBtn').onclick = () => { if (current > 0) { current--; show(current); } };
document.getElementById('nextBtn').onclick = () => { if (current < slides.length-1) { current++; show(current); } };
document.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); if (current < slides.length-1) { current++; show(current); } } if (e.key === 'ArrowLeft') { e.preventDefault(); if (current > 0) { current--; show(current); } } if (e.key === 'f') { document.documentElement.requestFullscreen(); } });
</script>
</body>
</html>`;

      setHtmlCode(fullHtml);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [rpmHtml, topic]);

  React.useEffect(() => {
    if (isOpen) generate();
  }, [isOpen]);

  const download = () => {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Presentasi_${topic.replace(/\s+/g, '_')}.html`;
    a.click();
  };

  const openInTab = () => {
    const w = window.open('', '_blank');
    if (w) { w.document.write(htmlCode); w.document.close(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-warm-border">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎨</span>
            <h2 className="font-bold text-slate-800">Presentasi Siap Tayang</h2>
          </div>
          <div className="flex items-center gap-2">
            {htmlCode && (
              <>
                <button onClick={openInTab}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-light shadow-button transition-all">
                  <span>▶</span> Buka Presentasi
                </button>
                <button onClick={download}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-warm-border text-slate-600 text-xs font-semibold rounded-lg hover:bg-warm shadow-card transition-all">
                  <Download className="w-3.5 h-3.5" /> Download HTML
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-warm/30">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-500">Menyusun presentasi...</p>
            </div>
          )}
          {error && <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg">{error}</div>}
          {htmlCode && !isLoading && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
                ✅ Presentasi siap! Klik <strong>"Buka Presentasi"</strong> untuk tayang, atau <strong>"Download HTML"</strong> untuk simpan.
              </div>
              <details>
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">Lihat kode HTML</summary>
                <pre className="mt-2 p-3 bg-slate-900 text-green-400 text-[10px] rounded-lg overflow-x-auto max-h-60">{htmlCode}</pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}