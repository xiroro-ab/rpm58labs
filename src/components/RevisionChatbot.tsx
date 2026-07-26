import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Send, Loader2, Sparkles, X, RotateCcw, Check, Bot, User, Mic, MicOff, Maximize2, Minimize2, Download, Lightbulb, Undo2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const CHAT_STORAGE_KEY = 'rpm_chat_history';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  revisedHtml?: string;
  applied?: boolean;
}

interface RevisionChatbotProps {
  currentHtml: string;
  onApplyRevision: (newHtml: string) => void;
  onStreamUpdate?: (html: string, isDone: boolean) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const quickActions = [
  'Ubah soal nomor 1, jawabannya jadi C',
  'Tambah 2 soal pilihan ganda di pertemuan 1',
  'Hapus soal nomor 5',
  'Ganti semua opsi D di setiap soal jadi "Semua benar"',
  'Perbaiki tata bahasa dan ejaan',
];

const smartSuggestions = [
  { icon: '✏️', text: 'Perbaiki tata bahasa' },
  { icon: '📝', text: 'Tambah 2 soal di pertemuan 1' },
  { icon: '🔄', text: 'Ubah jawaban soal 3 jadi B' },
  { icon: '✂️', text: 'Hapus soal nomor 5' },
  { icon: '📋', text: 'Buat kegiatan inti lebih detail' },
];

export function RevisionChatbot({ currentHtml, onApplyRevision, onStreamUpdate, isOpen, setIsOpen }: RevisionChatbotProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAutoSuggest, setShowAutoSuggest] = useState(true);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load saved chat
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setShowAutoSuggest(false);
        }
      }
    } catch (e) {}
  }, []);

  // Save chat on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-suggest on first open
  useEffect(() => {
    if (isOpen && isFirstOpen && messages.length === 0) {
      setIsFirstOpen(false);
    }
  }, [isOpen, isFirstOpen, messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamBuffer, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isLoading) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen, isLoading]);

  const sendMessage = useCallback(async (instruction?: string) => {
    const msg = instruction || prompt;
    if (!msg.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setIsLoading(true);
    setStreamBuffer('');

    try {
      // Save current HTML to undo stack
      setUndoStack(prev => [...prev.slice(-9), currentHtml]);

      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/revise-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentHtml,
          instruction: msg,
          chatHistory: [...chatHistory, { role: 'user', content: msg }],
        }),
      });

      if (!response.ok) throw new Error('Gagal menghubungi server');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let resultText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value, { stream: true });
        setStreamBuffer(resultText);
        // Stream to main preview
        const cleanPreview = resultText.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();
        onStreamUpdate?.(cleanPreview, false);
      }

      const cleanHtml = resultText.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();
      // Final update to preview
      onStreamUpdate?.(cleanHtml, true);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: '✅ Revisi selesai! Perubahan sudah terlihat di layar pratinjau. Klik "Terapkan" untuk menyimpan.',
        timestamp: Date.now(),
        revisedHtml: cleanHtml,
        applied: false,
      };

      setMessages(prev => [...prev, aiMsg]);
      setStreamBuffer('');
      toast.success('Revisi berhasil!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal');
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'ai',
        content: `❌ ${err.message || 'Gagal merevisi'}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, messages, currentHtml]);

  const handleApply = (revisedHtml?: string) => {
    if (revisedHtml) {
      onApplyRevision(revisedHtml);
      setMessages(prev => prev.map(m =>
        m.revisedHtml === revisedHtml ? { ...m, applied: true } : m
      ));
      toast.success('Perubahan diterapkan!');
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      toast.error('Tidak ada yang bisa di-undo');
      return;
    }
    const prevHtml = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    onApplyRevision(prevHtml);
    toast.success('Undo berhasil!');
  };

  const handleReset = () => {
    setMessages([]);
    setStreamBuffer('');
    setUndoStack([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    toast.success('Percakapan di-reset');
  };

  const handleExport = () => {
    const text = messages.map(m =>
      `[${new Date(m.timestamp).toLocaleString('id-ID')}] ${m.role === 'user' ? '👤 Saya' : '🤖 AI'}:\n${m.content}\n`
    ).join('\n---\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chat-revisi-${Date.now()}.txt`;
    a.click();
    toast.success('Chat diekspor!');
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Browser tidak mendukung voice input');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setPrompt(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-suggest analysis on mount
  const autoSuggestMsg = 'Saya perhatikan dokumen ini bisa ditingkatkan. Coba ketik: "Perbaiki tata bahasa" atau "Detailkan kegiatan inti" agar saya bantu revisi.';

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 z-[9998] bg-slate-900/20 backdrop-blur-sm sm:hidden" onClick={() => setIsOpen(false)} />

      <div className={`fixed z-[9999] bottom-0 left-0 right-0 bg-white flex flex-col border border-slate-200 print:hidden overflow-hidden shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
        isFullscreen
          ? 'inset-0 sm:inset-4 rounded-none sm:rounded-2xl'
          : 'sm:bottom-6 sm:right-6 sm:left-auto sm:rounded-2xl rounded-t-2xl w-full sm:w-[440px] max-h-[85vh] sm:max-h-[700px]'
      }`}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-800">Babu Setia AI</span>
              <span className="block text-[10px] text-slate-400 font-medium">
                {isLoading ? 'Sedang menulis...' : `${messages.filter(m => m.role === 'ai').length} revisi`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {undoStack.length > 0 && (
              <button onClick={handleUndo} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Undo">
                <Undo2 className="w-4 h-4" />
              </button>
            )}
            {messages.length > 0 && (
              <>
                <button onClick={handleExport} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors sm:hidden" title="Export chat">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={handleReset} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Reset percakapan">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block" title={isFullscreen ? 'Kecilkan' : 'Fullscreen'}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/50 custom-scrollbar">
          {/* Auto-suggest banner */}
          {showAutoSuggest && messages.length === 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-2">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">💡 Saran Cerdas</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Saya bisa membantu merevisi bagian tertentu. Coba ketik:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {smartSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setPrompt(s.text); setShowAutoSuggest(false); }}
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-amber-200 text-amber-700 rounded-full hover:bg-amber-50 transition-colors"
                      >
                        {s.icon} {s.text}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowAutoSuggest(false)} className="text-xs text-amber-500 mt-2 hover:underline">Tutup</button>
                </div>
              </div>
            </div>
          )}

          {messages.length === 0 && !showAutoSuggest && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed">
                Hai! Aku <strong>BABU</strong> setiamu. Ketik instruksi untuk merevisi RPM.
              </p>
              <p className="text-xs text-slate-400 mt-2">Contoh: <em>"Ubah soal nomor 3 jawabannya jadi B"</em></p>
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">⚡ QUICK ACTIONS:</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.map((action, i) => (
                    <button key={i} onClick={() => { setPrompt(action); setTimeout(() => sendMessage(action), 100); }} disabled={isLoading}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors border border-indigo-200 disabled:opacity-50"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-blue-100' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-blue-600" /> : <Bot className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className={`max-w-[88%] ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm'
              } p-3`}>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                  {msg.content}
                </p>
                {msg.role === 'ai' && msg.revisedHtml && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100">
                    {msg.applied ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
                        <Check className="w-3.5 h-3.5" /> Sudah diterapkan
                      </div>
                    ) : (
                      <>
                        <button onClick={() => handleApply(msg.revisedHtml)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Terapkan
                        </button>
                        <button onClick={() => navigator.clipboard.writeText(msg.revisedHtml || '')}
                          className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Copy HTML
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading dots (stream shows in main preview) */}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm p-4 flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                </div>
                <span className="text-sm text-slate-500">Merevisi dokumen...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white shrink-0">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? '🎤 Dengarkan...' : 'Ketik instruksi... (Enter kirim)'}
              className={`w-full text-sm p-3 pl-3 pr-20 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-[60px] sm:h-[52px] bg-slate-50 hover:bg-white transition-colors ${isListening ? 'ring-2 ring-red-400' : ''}`}
              disabled={isLoading}
            />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <button
                onClick={handleVoice}
                className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title="Voice input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !prompt.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">
            Contoh: <em>"ubah soal nomor 3 jawabannya jadi C"</em> atau <em>"tambah 2 soal baru"</em>
          </p>
        </div>
      </div>
    </>,
    document.body
  );
}
