import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, Loader2, Sparkles, X, RotateCcw, Check, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface RevisionChatbotProps {
  currentHtml: string;
  onApplyRevision: (newHtml: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  applied?: boolean;
}

const quickActions = [
  'Perbaiki tata bahasa dan ejaan',
  'Buat Kegiatan Inti lebih detail',
  'Tambahkan diferensiasi untuk siswa lamban & cepat',
  'Sederhanakan bahasa untuk siswa',
  'Tambahkan Ice Breaking di Kegiatan Awal',
];

export function RevisionChatbot({ currentHtml, onApplyRevision, isOpen, setIsOpen }: RevisionChatbotProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [lastAppliedHtml, setLastAppliedHtml] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentResponse]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleRevise = async (customPrompt?: string) => {
    const instruction = customPrompt || prompt;
    if (!instruction.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: instruction,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);
    setCurrentResponse('');

    try {
      const response = await fetch('/api/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentHtml,
          instruction
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Gagal melakukan revisi');
      }

      const data = await response.json();
      const revisedHtml = data.revisedHtml;

      setCurrentResponse('');
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: 'Revisi selesai! Klik tombol "Terapkan" untuk menyimpan perubahan.',
        timestamp: new Date(),
        applied: false
      };
      setMessages(prev => [...prev, aiMessage]);
      setLastAppliedHtml(revisedHtml);
      toast.success('Revisi berhasil!');
    } catch (err: any) {
      toast.error(err.message);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: `❌ Error: ${err.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setCurrentResponse('');
    }
  };

  const handleApply = () => {
    if (lastAppliedHtml) {
      onApplyRevision(lastAppliedHtml);
      setMessages(prev => prev.map(msg => 
        msg.applied === false ? { ...msg, applied: true } : msg
      ));
      toast.success('Perubahan diterapkan!');
    }
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentResponse('');
    setLastAppliedHtml(null);
    toast.success('Percakapan di-reset');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRevise();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-slate-900/20 backdrop-blur-sm sm:hidden" onClick={() => setIsOpen(false)} />
      
      <div className="fixed z-[9999] bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto bg-white sm:rounded-2xl rounded-t-2xl sm:rounded-b-2xl shadow-2xl border border-slate-200 flex flex-col w-full sm:w-[420px] print:hidden max-h-[85vh] sm:max-h-[650px] overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-indigo-50/50"></div>
          <div className="flex items-center gap-3 text-indigo-700 font-bold relative z-10">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200/50">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span>Babu Setia AI</span>
              {isLoading && <span className="block text-[10px] font-normal text-indigo-400">Sedang merevisi...</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 relative z-10">
            {messages.length > 0 && (
              <button onClick={handleReset} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Reset percakapan">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Hai! aku <strong>BABU</strong> setia mu. Ketik instruksi untuk merevisi bagian tertentu dari dokumen RPM.
                </p>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">QUICK ACTIONS:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => { setPrompt(action); handleRevise(action); }}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors border border-indigo-200 disabled:opacity-50"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.type === 'user' ? 'bg-blue-100' : 'bg-indigo-100'
                }`}>
                  {msg.type === 'user' ? <User className="w-3.5 h-3.5 text-blue-600" /> : <Bot className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className={`max-w-[85%] ${msg.type === 'user' ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm'} p-3`}>
                  <p className={`text-sm leading-relaxed ${msg.type === 'user' ? 'text-white' : 'text-slate-700'}`}>{msg.content}</p>
                  {msg.type === 'ai' && msg.applied === false && lastAppliedHtml && (
                    <button
                      onClick={handleApply}
                      className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Terapkan Revisi
                    </button>
                  )}
                  {msg.type === 'ai' && msg.applied === true && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
                      <Check className="w-3.5 h-3.5" /> Sudah diterapkan
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm p-4 flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                </div>
                <span className="text-sm text-slate-500">AI sedang merevisi...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik instruksi revisi... (Enter untuk kirim)"
              className="w-full text-sm p-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-20 bg-slate-50 hover:bg-white transition-colors"
              disabled={isLoading}
            />
            <button
              onClick={() => handleRevise()}
              disabled={isLoading || !prompt.trim()}
              className="absolute right-2.5 bottom-2.5 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
