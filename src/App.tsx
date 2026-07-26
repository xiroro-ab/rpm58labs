import React, { useState, useEffect } from 'react';
import FormRPM from './components/FormRPM';
import ResultRPM from './components/ResultRPM';
import { RPMFormData, HistoryItem } from './types';
import { Settings, X, History, Clock, Trash2, Search, PanelLeftClose, PanelLeftOpen, BookTemplate, GitBranch, HardDrive, BarChart3, Smartphone } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { LoadingOverlay } from './components/LoadingOverlay';
import { TemplateLibrary } from './components/TemplateLibrary';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PWAPrompt } from './components/PWAPrompt';
import { versionControl } from './lib/versionControl';
import { analyticsManager } from './lib/analytics';

export default function App() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RPMFormData | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [isGeneratingContinue, setIsGeneratingContinue] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isAnalyticsDashboardOpen, setIsAnalyticsDashboardOpen] = useState(false);
  const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false);
  const [isPWAPromptOpen, setIsPWAPromptOpen] = useState(true);

  const [isWaitingForFirstChunk, setIsWaitingForFirstChunk] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentTrackingId, setCurrentTrackingId] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('rpmHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (result && currentHistoryId) {
          handleSaveEdit(result);
          toast.success('Dokumen disimpan! (Ctrl+S)');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (result) {
          toast('Gunakan tombol Download PDF', { icon: '📄' });
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setIsHistoryOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleReset();
        toast.success('Layar di-reset! (Ctrl+N)');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setIsTemplateLibraryOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsBackupRestoreOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setIsAnalyticsDashboardOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    };
  }, [result, currentHistoryId, autoSaveTimeout]);


  const handleGenerate = async (data: RPMFormData) => {
    setIsLoading(true);
    setFormData(data);
    setResult(''); // Reset result
    setIsWaitingForFirstChunk(true);

    // Start time tracking
    const trackingId = analyticsManager.startTracking('new-rpm', 'generate');
    setCurrentTrackingId(trackingId);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, customApiKey, aiProvider }),
      });

      if (!response.ok) {
        setIsWaitingForFirstChunk(false);
        let errorMessage = 'Gagal menghubungi server.';
        try {
          const json = await response.json();
          errorMessage = typeof json.error === 'string' ? json.error : (json.error?.message || json.message || JSON.stringify(json));
        } catch (e) {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        
        if (typeof errorMessage !== 'string') {
           errorMessage = String(errorMessage);
        }
        
        const lowerErr = errorMessage.toLowerCase();
        if (lowerErr.includes('429') || lowerErr.includes('quota') || lowerErr.includes('limit') || lowerErr.includes('exhausted') || lowerErr.includes('insufficient_quota')) {
          errorMessage = 'Kuota API Key telah habis atau limit penggunaan tercapai. Silakan masukkan API Key Anda sendiri di menu Pengaturan.';
        } else if (lowerErr.includes('401') || lowerErr.includes('unauthorized') || lowerErr.includes('invalid api key')) {
          errorMessage = 'API Key yang digunakan tidak valid atau salah. Silakan periksa kembali API Key di menu Pengaturan.';
        } else if (lowerErr.includes('404') || lowerErr.includes('not found') || lowerErr.includes('model')) {
          errorMessage = 'Model AI tidak ditemukan atau belum tersedia untuk API Key ini.';
        } else {
          // If the error message is a raw JSON string or unreadable API error, replace it
          if (errorMessage.includes('{') || errorMessage.includes('[')) {
             errorMessage = 'Terjadi kesalahan saat memproses respons dari AI. Silakan coba lagi.';
          }
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');
      const decoder = new TextDecoder();
      let resultText = '';
      
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (isFirstChunk) {
          setIsWaitingForFirstChunk(false);
          isFirstChunk = false;
        }

        resultText += decoder.decode(value, { stream: true });
        
        var displayResult = resultText;
        if (displayResult.trim().startsWith('```html')) {
           displayResult = displayResult.replace(/^```html\n?/, '');
        } else if (displayResult.trim().startsWith('```')) {
           displayResult = displayResult.replace(/^```\n?/, '');
        }
        if (displayResult.trim().endsWith('```')) {
           displayResult = displayResult.replace(/\n?```$/, '');
        }
        
                setResult(displayResult);
      }
      
      const finalResultText = displayResult || resultText;
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        title: `RPM ${data.subject} ${data.phase}`,
        date: new Date().toISOString(),
        formData: data,
        markdown: finalResultText
      };
      
      // Save initial version
      versionControl.saveVersion(newItem.id, finalResultText, 'Initial version');
      
      setHistory(prev => {
        const next = [newItem, ...prev].slice(0, 50); // Keep max 50 items
        localStorage.setItem('rpmHistory', JSON.stringify(next));
        return next;
      });
      setCurrentHistoryId(newItem.id);
      
      toast.success('RPM berhasil dibuat!');
    } catch (err: any) {
      setIsWaitingForFirstChunk(false);
      console.error(err);
      toast.error(err.message || 'Gagal menghubungi server.', {
        duration: 6000,
        style: {
          maxWidth: '500px',
          wordBreak: 'break-word',
          fontSize: '14px'
        },
      });
    } finally {
      setIsWaitingForFirstChunk(false);
      setIsLoading(false);
      if (currentTrackingId) {
        analyticsManager.stopTracking(currentTrackingId);
        setCurrentTrackingId(null);
      }
    }
  };

  
  const handleContinue = async () => {
    if (!result || !formData) return;
    setIsGeneratingContinue(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: formData, customApiKey, aiProvider, previousOutput: result }),
      });

      if (!response.ok) {
        let errorMessage = 'Gagal menghubungi server.';
        try {
          const json = await response.json();
          errorMessage = typeof json.error === 'string' ? json.error : (json.error?.message || json.message || JSON.stringify(json));
        } catch (e) {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        
        if (typeof errorMessage !== 'string') {
           errorMessage = String(errorMessage);
        }
        
        const lowerErr = errorMessage.toLowerCase();
        if (lowerErr.includes('429') || lowerErr.includes('quota') || lowerErr.includes('limit') || lowerErr.includes('exhausted') || lowerErr.includes('insufficient_quota')) {
          errorMessage = 'Kuota API Key telah habis atau limit penggunaan tercapai. Silakan masukkan API Key Anda sendiri di menu Pengaturan.';
        } else if (lowerErr.includes('401') || lowerErr.includes('unauthorized') || lowerErr.includes('invalid api key')) {
          errorMessage = 'API Key yang digunakan tidak valid atau salah. Silakan periksa kembali API Key di menu Pengaturan.';
        } else if (lowerErr.includes('404') || lowerErr.includes('not found') || lowerErr.includes('model')) {
          errorMessage = 'Model AI tidak ditemukan atau belum tersedia untuk API Key ini.';
        } else {
          if (errorMessage.includes('{') || errorMessage.includes('[')) {
             errorMessage = 'Terjadi kesalahan saat memproses respons dari AI. Silakan coba lagi.';
          }
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');
      const decoder = new TextDecoder();
      let resultText = result; // Start with previous result
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value, { stream: true });
        
        var displayResult = resultText;
        if (displayResult.trim().startsWith('```html')) {
           displayResult = displayResult.replace(/^```html\n?/, '');
        } else if (displayResult.trim().startsWith('```')) {
           displayResult = displayResult.replace(/^```\n?/, '');
        }
        if (displayResult.trim().endsWith('```')) {
           displayResult = displayResult.replace(/\n?```$/, '');
        }
        
                setResult(displayResult);
      }
      
      const finalResultText = displayResult || resultText;
      if (currentHistoryId) {
        setHistory(prev => {
          const next = [...prev];
          const idx = next.findIndex(item => item.id === currentHistoryId);
          if (idx !== -1) {
             next[idx].markdown = finalResultText;
             localStorage.setItem('rpmHistory', JSON.stringify(next));
          }
          return next;
        });
      }
      
      toast.success('RPM berhasil dilanjutkan!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal menghubungi server.', {
        duration: 6000,
        style: {
          maxWidth: '500px',
          wordBreak: 'break-word',
          fontSize: '14px'
        },
      });
    } finally {
      setIsGeneratingContinue(false);
    }
  };

  
  
  const handleSaveEdit = (editedHtml: string) => {
    setResult(editedHtml);
    if (currentHistoryId) {
      versionControl.saveVersion(currentHistoryId, editedHtml);
      
      setHistory(prev => {
        const next = [...prev];
        const idx = next.findIndex(item => item.id === currentHistoryId);
        if (idx !== -1) {
          next[idx].markdown = editedHtml;
          localStorage.setItem('rpmHistory', JSON.stringify(next));
        }
        return next;
      });
    }
  };

  const handleAutoSave = (content: string) => {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    const timeout = setTimeout(() => {
      if (currentHistoryId) {
        versionControl.saveVersion(currentHistoryId, content);
        console.log('Auto-saved at', new Date().toLocaleTimeString());
      }
    }, 3000); // Auto-save after 3 seconds of inactivity
    
    setAutoSaveTimeout(timeout);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult(item.markdown);
    setFormData(item.formData);
    setCurrentHistoryId(item.id);
    setIsHistoryOpen(false);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Hapus riwayat ini?')) {
       setHistory(prev => {
         const next = prev.filter(item => item.id !== id);
         localStorage.setItem('rpmHistory', JSON.stringify(next));
         return next;
       });
       if (currentHistoryId === id) {
         setResult(null);
    setCurrentHistoryId(null);
         setCurrentHistoryId(null);
       }
    }
  };

  const handleReset = () => {
    setResult(null);
    setCurrentHistoryId(null);
  };

  const handleTemplateSelect = (templateData: Partial<RPMFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...templateData
    } as RPMFormData));
    toast.success('Template berhasil dimuat ke form!');
  };

  const handleRestoreVersion = (content: string) => {
    setResult(content);
    if (currentHistoryId) {
      // Save current as new version before restoring
      if (result) {
        versionControl.saveVersion(currentHistoryId, result, 'Before restore');
      }
      versionControl.saveVersion(currentHistoryId, content, 'Restored version');
      handleSaveEdit(content);
    }
  };

  return (
    <div className="flex flex-col h-screen print:h-auto w-full bg-slate-50 font-sans overflow-hidden print:overflow-visible">
      <Toaster position="top-center" />
      <LoadingOverlay isVisible={isWaitingForFirstChunk} message="Sedang menyusun RPM..." />
      
      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-bold text-slate-800">Riwayat RPM</h2>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                  <Search className="w-12 h-12 mb-3 opacity-20" />
                  <p>Belum ada riwayat RPM.</p>
                  <p className="text-sm mt-1">Generate RPM pertama Anda untuk menyimpannya.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => loadHistoryItem(item)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md flex justify-between items-start ${currentHistoryId === item.id ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-400' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm mb-1">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(item.date).toLocaleString('id-ID', {
                             day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus riwayat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Pengaturan API</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pilih AI Provider
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gemini">Google Gemini (Default)</option>
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="groq">Groq (Llama 3)</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="odysseus">Odysseus AI</option>
                  <option value="grok">xAI Grok</option>
                  <option value="qwen">Qwen (Alibaba)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  API Key Kustom (Opsional)
                </label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Biarkan kosong untuk menggunakan default"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Jika limit API default habis, Anda dapat menggunakan API key milik Anda sendiri. API key tidak akan disimpan di server.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => { setIsSettingsOpen(false); toast.success('Pengaturan disimpan!'); }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors"
              >
                Simpan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="print:hidden flex flex-shrink-0 items-center justify-between px-4 lg:px-8 py-4 bg-white border-b border-slate-200/60 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex-wrap gap-4 z-50">
        <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
          <div className="flex shrink-0 items-center justify-center w-10 h-10 md:w-11 md:h-11 overflow-hidden bg-white rounded-xl border border-slate-200/60 shadow-sm">
            <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png" alt="Logo SMP 58" className="object-contain w-full h-full p-1.5 hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="min-w-0 pr-2 hidden md:block">
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight truncate">Generator RPM</h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-semibold uppercase tracking-wider leading-tight line-clamp-2">Khusus untuk guru yang gawe nyo hobbi instant. Tapi bukan mie instant.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center justify-center p-2 text-slate-500 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-all shadow-sm md:hidden"
            title={isSidebarOpen ? "Tutup panel form" : "Buka panel form"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex items-center justify-center p-2 text-slate-500 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-all shadow-sm"
            title={isSidebarOpen ? "Tutup panel form" : "Buka panel form"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-all text-sm font-semibold shadow-sm"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Riwayat</span>
          </button>
          <button 
            onClick={() => setIsTemplateLibraryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-purple-600 bg-white border border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-lg transition-all text-sm font-semibold shadow-sm"
            title="Template Library (Ctrl+T)"
          >
            <BookTemplate className="w-4 h-4" />
            <span className="hidden sm:inline">Template</span>
          </button>
          {result && (
            <button 
              onClick={() => setIsVersionHistoryOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all text-sm font-semibold shadow-sm"
              title="Version History"
            >
              <GitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">Versi</span>
            </button>
          )}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title="Pengaturan API"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsBackupRestoreOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-all text-sm font-semibold shadow-sm"
            title="Backup & Restore (Ctrl+B)"
          >
            <HardDrive className="w-4 h-4" />
            <span className="hidden sm:inline">Backup</span>
          </button>
          <button 
            onClick={() => setIsAnalyticsDashboardOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-violet-600 bg-white border border-violet-200 hover:border-violet-300 hover:bg-violet-50 rounded-lg transition-all text-sm font-semibold shadow-sm"
            title="Analytics Dashboard (Ctrl+D)"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          <button onClick={handleReset} className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-slate-900/20">
            Reset Layar
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden print:overflow-visible print:block relative">
        {/* Template Library Modal */}
        <TemplateLibrary
          isOpen={isTemplateLibraryOpen}
          onClose={() => setIsTemplateLibraryOpen(false)}
          onSelectTemplate={handleTemplateSelect}
          currentFormData={formData}
        />

        {/* Version History Modal */}
        <VersionHistoryModal
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          historyId={currentHistoryId}
          currentContent={result || ''}
          onRestore={handleRestoreVersion}
        />

        {/* Cloud Sync Modal */}
        <BackupRestoreModal
          isOpen={isBackupRestoreOpen}
          onClose={() => setIsBackupRestoreOpen(false)}
          history={history}
          onHistoryUpdate={(newHistory) => {
            setHistory(newHistory);
            localStorage.setItem('rpmHistory', JSON.stringify(newHistory));
          }}
        />

        {/* Analytics Dashboard Modal */}
        <AnalyticsDashboard
          isOpen={isAnalyticsDashboardOpen}
          onClose={() => setIsAnalyticsDashboardOpen(false)}
          history={history}
        />

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden print:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar: Input Form */}
        <section className={`print:hidden bg-white flex flex-col shrink-0 transition-all duration-300 z-50 overflow-hidden
          ${isSidebarOpen 
            ? 'translate-x-0 w-[85vw] max-w-[400px] md:w-[400px] border-r border-slate-200' 
            : '-translate-x-full w-[85vw] max-w-[400px] md:translate-x-0 md:w-0 border-none'}
          fixed inset-y-0 left-0 md:static md:h-full shadow-2xl md:shadow-[1px_0_10px_rgba(0,0,0,0.02)]
        `}>
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-800">Form RPM</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm">
               <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <FormRPM onSubmit={(data) => { handleGenerate(data); if (window.innerWidth < 768) setIsSidebarOpen(false); }} isLoading={isLoading} />
          </div>
        </section>

        {/* Right: Result Preview */}
        <section className="flex-1 bg-slate-100 overflow-hidden print:overflow-visible flex flex-col relative print:block min-w-0">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 overflow-y-auto">
              <div className="w-32 h-32 flex items-center justify-center mb-6 drop-shadow-md">
                <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/guru.gif" alt="Guru GIF" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">Belum ada RPM yang Dibuat</h2>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                Silakan isi data identitas dan preferensi pembelajaran di panel sebelah kiri, lalu klik <span className="font-semibold text-slate-700">Generate RPM Baru</span> untuk melihat hasilnya di sini.
              </p>
            </div>
          ) : (
            <ResultRPM
            markdown={result}
            onSaveEdit={(editedHtml) => {
              handleSaveEdit(editedHtml);
              handleAutoSave(editedHtml);
            }} 
            onReset={handleReset} 
            onContinue={handleContinue} 
            formData={formData} 
            isGeneratingContinue={isGeneratingContinue} />
          )}
        </section>
        <PWAPrompt isOpen={isPWAPromptOpen} onClose={() => setIsPWAPromptOpen(false)} />
      </main>

      {/* Footer */}
      <footer className="print:hidden bg-white border-t border-slate-200 py-2 px-8 flex justify-between items-center text-[11px] text-slate-400">
        <p>© {new Date().getFullYear()} AI Education Labs • Build for Merdeka Belajar</p>
        <p className="font-mono">Coded by Aris Bermansyah | Powered by {aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} AI</p>
      </footer>
    </div>
  );
}