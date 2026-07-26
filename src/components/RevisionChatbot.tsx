import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, Loader2, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface RevisionChatbotProps {
  currentHtml: string;
  onApplyRevision: (newHtml: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function RevisionChatbot({ currentHtml, onApplyRevision, isOpen, setIsOpen }: RevisionChatbotProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRevise = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentHtml,
          instruction: prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Gagal melakukan revisi');
      }
      
      const data = await response.json();
      onApplyRevision(data.revisedHtml);
      toast.success('Revisi berhasil diterapkan!');
      setPrompt('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Overlay for mobile to close when tapping outside */}
      <div className="fixed inset-0 z-[9998] bg-slate-900/20 backdrop-blur-sm sm:hidden" onClick={() => setIsOpen(false)} />
      
      <div className="fixed z-[9999] bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto bg-white sm:rounded-2xl rounded-t-2xl sm:rounded-b-2xl shadow-2xl border border-slate-200 flex flex-col w-full sm:w-[380px] print:hidden max-h-[85vh] sm:max-h-[600px] overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-50/50"></div>
          <div className="flex items-center gap-3 text-indigo-700 font-bold relative z-10">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200/50">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Babu Setia AI</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-full transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 p-5 overflow-y-auto text-sm text-slate-700 space-y-4 bg-slate-50/50">
          <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 text-slate-700 relative">
            <p className="leading-relaxed">
              Hai! aku <strong>BABU</strong> setia mu, kalu kamu nak ganti bagian tertentu dari dokumen ini ketik bae,
            </p>
            <div className="mt-3 text-[13px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <strong className="block text-slate-700 mb-1">Contoh ketikan:</strong>
              <ul className="list-disc pl-4 space-y-1">
                <li>"Tolong tambahkan 5 soal pilihan ganda lagi"</li>
                <li>"Buat metode diskusinya lebih interaktif"</li>
                <li>"Ubah alokasi waktu menjadi 3x45 menit"</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ketik instruksi mu di sini..."
              className="w-full text-sm p-4 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-24 bg-slate-50 hover:bg-white transition-colors"
              disabled={isLoading}
            />
            <button
              onClick={handleRevise}
              disabled={isLoading || !prompt.trim()}
              className="absolute right-3 bottom-3 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
