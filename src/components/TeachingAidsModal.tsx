import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Search, Youtube, ChevronDown, ChevronUp } from 'lucide-react';

interface TeachingAidsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rpmHtml: string;
  topic: string;
}

export default function TeachingAidsModal({ isOpen, onClose, rpmHtml, topic }: TeachingAidsModalProps) {
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setResult('');
      generateAids();
    }
  }, [isOpen]);

  const generateAids = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/teaching-aids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rpmHtml, topic }),
      });

      if (!response.ok) {
        let errMsg = 'Gagal';
        try {
          const text = await response.text();
          try { const j = JSON.parse(text); errMsg = j.error || text; } catch { errMsg = text || `HTTP ${response.status}`; }
        } catch {}
        throw new Error(errMsg);
      }

      setIsStreaming(true);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setResult(text);
      }
    } catch (err: any) {
      console.error(err);
      setResult(`<div class="aid-error">Gagal: ${err.message}</div>`);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const sanitizeSvg = (html: string): string => {
    return html.replace(/on\w+=["'][^"']*["']/gi, '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
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
              <p className="text-xs text-slate-500 mt-0.5">SVG ilustrasi + link pencarian untuk tiap aktivitas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <button
                onClick={generateAids}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-light shadow-button transition-all disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                Generate Ulang
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-warm/30" ref={contentRef}>
          {isLoading && !isStreaming && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-500 font-medium">AI sedang menganalisis RPM...</p>
              <p className="text-xs text-slate-400 mt-1">Membuat SVG ilustrasi untuk setiap aktivitas</p>
            </div>
          )}

          {isStreaming && (
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              AI sedang membuat...
            </div>
          )}

          {result && (
            <div
              className="teaching-aids-results"
              dangerouslySetInnerHTML={{ __html: sanitizeSvg(result) }}
            />
          )}
        </div>
      </div>
    </div>
  );
}