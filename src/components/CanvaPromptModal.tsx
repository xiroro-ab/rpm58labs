import React, { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, Check } from 'lucide-react';

interface CanvaPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  rpmHtml: string;
  topic: string;
}

export default function CanvaPromptModal({ isOpen, onClose, rpmHtml, topic }: CanvaPromptModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && !prompt) {
      setIsLoading(true);
      setError('');
      fetch('/api/canva-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rpmHtml, topic }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.error) { setError(data.error); return; }
          setPrompt(data.canvaPrompt);
        })
        .catch(e => setError(e.message))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const copy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-warm-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎨</span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Canva AI Code</h2>
              <p className="text-xs text-slate-500">Prompt siap pakai untuk generate presentasi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-warm/30">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-500">Membuat prompt untuk Canva...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">{error}</div>
          )}

          {prompt && !isLoading && (
            <div className="space-y-4">
              <a href="https://www.canva.com/ai/code" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-600 shadow-lg transition-all">
                <ExternalLink className="w-4 h-4" /> Buka Canva AI Code
              </a>

              <div className="bg-white border border-warm-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prompt untuk Canva</span>
                  <button onClick={copy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-light transition-all">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Tersalin!' : 'Salin Prompt'}
                  </button>
                </div>
                <textarea read-only
                  className="w-full h-60 p-3 bg-slate-50 border border-warm-border rounded-lg text-sm text-slate-700 font-mono leading-relaxed resize-none focus:outline-none"
                  value={prompt}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-700 space-y-1">
                <p><strong>Cara pakai:</strong></p>
                <p>1. Klik <strong>"Buka Canva AI Code"</strong> di atas</p>
                <p>2. Paste prompt yang sudah di-copy ke kolom chat Canva AI</p>
                <p>3. Canva akan generate desain presentasi secara otomatis</p>
                <p>4. Edit sesuai kebutuhan di Canva</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}