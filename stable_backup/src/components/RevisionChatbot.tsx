import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, X, GripHorizontal } from 'lucide-react';
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
  
  const [position, setPosition] = useState({ x: window.innerWidth > 800 ? window.innerWidth - 420 : 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Initial center on small screens
    if (window.innerWidth <= 800) {
      setPosition({
        x: Math.max(10, (window.innerWidth - 320) / 2),
        y: 100
      });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      startPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
  };

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

  return (
    <div 
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col w-[320px] sm:w-[380px] print:hidden max-h-[80vh] overflow-hidden"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
      }}
    >
      <div 
        className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center rounded-t-xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-indigo-700 font-semibold pointer-events-none select-none">
          <GripHorizontal className="w-5 h-5 text-slate-400" />
          <Sparkles className="w-4 h-4" />
          <span>Asisten AI</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
          className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto text-sm text-slate-600 space-y-4">
        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-indigo-800">
          Hai! Saya Asisten Revisi AI. Anda bisa meminta saya untuk mengubah bagian spesifik dari dokumen ini.
          <br /><br />
          <strong>Contoh:</strong><br />
          - "Tolong tambahkan 5 soal pilihan ganda lagi"<br />
          - "Buat metode diskusinya lebih interaktif"<br />
          - "Ubah alokasi waktu menjadi 3x45 menit"
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ketik instruksi revisi..."
          className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-24 mb-2"
          disabled={isLoading}
        />
        <button
          onClick={handleRevise}
          disabled={isLoading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isLoading ? 'Merevisi...' : 'Kirim Instruksi'}
        </button>
      </div>
    </div>
  );
}
