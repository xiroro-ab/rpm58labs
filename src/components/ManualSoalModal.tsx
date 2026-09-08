import React, { useState, useEffect } from 'react';
import { Download, X, Loader2, History, Trash2, Clock, FileEdit, FileQuestion, Table } from 'lucide-react';
import toast from 'react-hot-toast';
import { RPMFormData } from '../types';
import { LoadingOverlay } from './LoadingOverlay';

interface ManualSoalHistoryItem {
  id: string;
  title: string;
  date: string;
  subject: string;
  phase: string;
  type: 'soal' | 'kisi';
  html: string;
}

interface ManualSoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: RPMFormData | null;
  customApiKey?: string;
  aiProvider?: string;
}

export default function ManualSoalModal({ isOpen, onClose, formData, customApiKey, aiProvider }: ManualSoalModalProps) {
  const [manualInput, setManualInput] = useState<string>('');
  const [soalHtml, setSoalHtml] = useState<string>('');
  const [kisiHtml, setKisiHtml] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'input' | 'soal' | 'kisi'>('input');
  
  const [isGeneratingSoal, setIsGeneratingSoal] = useState(false);
  const [isGeneratingKisi, setIsGeneratingKisi] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  const [history, setHistory] = useState<ManualSoalHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('manualSoalHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse manual soal history', e);
      }
    }
  }, [isOpen]);

  const saveToHistory = (html: string, type: 'soal' | 'kisi') => {
    if (!html) return;
    
    // Gunakan subject dan phase default jika formData kosong
    const subject = formData?.subject || 'Mapel Manual';
    const phase = formData?.phase || 'Fase Umum';

    const newItem: ManualSoalHistoryItem = {
      id: Date.now().toString(),
      title: `${type === 'soal' ? 'Lembar Soal' : 'Kisi-Kisi'} Manual ${subject}`,
      date: new Date().toISOString(),
      subject,
      phase,
      type,
      html
    };

    setHistory(prev => {
      const next = [newItem, ...prev].slice(0, 20);
      localStorage.setItem('manualSoalHistory', JSON.stringify(next));
      return next;
    });
  };

  const loadFromHistory = (item: ManualSoalHistoryItem) => {
    if (item.type === 'soal') {
      setSoalHtml(item.html);
      setActiveTab('soal');
      setOrientation('portrait');
    } else {
      setKisiHtml(item.html);
      setActiveTab('kisi');
      setOrientation('landscape');
    }
    setShowHistory(false);
    toast.success('Dimuat dari riwayat');
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
      const next = prev.filter(item => item.id !== id);
      localStorage.setItem('manualSoalHistory', JSON.stringify(next));
      return next;
    });
    toast.success('Riwayat dihapus');
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('manualSoalHistory');
    toast.success('Semua riwayat dihapus');
  };

  const handleGenerate = async (type: 'soal' | 'kisi') => {
    if (!manualInput.trim()) {
      toast.error('Teks soal manual masih kosong!');
      return;
    }

    if (type === 'soal') {
      setIsGeneratingSoal(true);
      setSoalHtml('');
      setActiveTab('soal');
      setOrientation('portrait');
    } else {
      setIsGeneratingKisi(true);
      setKisiHtml('');
      setActiveTab('kisi');
      setOrientation('landscape');
    }

    try {
      const endpoint = type === 'soal' ? '/api/generate-manual-soal' : '/api/generate-manual-table';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manualSoal: manualInput,
          formData,
          customApiKey,
          aiProvider
        }),
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
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');
      const decoder = new TextDecoder();
      let resultText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        resultText += decoder.decode(value, { stream: true });

        let display = resultText;
        if (display.trim().startsWith('```html')) display = display.replace(/^```html\n?/, '');
        else if (display.trim().startsWith('```')) display = display.replace(/^```\n?/, '');
        if (display.trim().endsWith('```')) display = display.replace(/\n?```$/, '');

        if (type === 'soal') {
          setSoalHtml(display);
        } else {
          setKisiHtml(display);
        }
      }

      let cleanFinal = resultText.replace(/^```html\n?/i, '').replace(/^```/i, '').replace(/\n?```$/i, '').trim();
      cleanFinal = cleanFinal.replace(/page-break-inside:\s*avoid/gi, 'page-break-inside: auto');

      if (cleanFinal.includes('<!--TERPOTONG-->')) {
        toast.error('Generate terpotong (batas output AI tercapai). Coba generate ulang.', { duration: 7000 });
      }

      if (type === 'soal') {
        setSoalHtml(cleanFinal);
      } else {
        setKisiHtml(cleanFinal);
      }
      
      saveToHistory(cleanFinal, type);
      toast.success(`${type === 'soal' ? 'Lembar Soal' : 'Kisi-Kisi'} berhasil dibuat!`);
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal generate.', { duration: 6000 });
    } finally {
      setIsGeneratingSoal(false);
      setIsGeneratingKisi(false);
    }
  };

  const handleDownloadPDF = async () => {
    const currentHtml = activeTab === 'soal' ? soalHtml : kisiHtml;
    
    if (!currentHtml) {
      toast.error('Belum ada hasil yang bisa diunduh');
      return;
    }

    setIsDownloading(true);
    try {
      const titlePrefix = activeTab === 'soal' ? 'Lembar_Soal_Manual' : 'Kisi_Kisi_Manual';
      const subjectName = formData?.subject || 'Mapel';
      const phaseName = formData?.phase || 'Fase';
      
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentHtml,
          orientation,
          filename: `${titlePrefix}_${subjectName}_${phaseName}.pdf`,
          footerText: `${titlePrefix.replace(/_/g, ' ')} ${subjectName} ${phaseName}`
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error((errData && errData.error) ? errData.error : 'Gagal dari server');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titlePrefix}_${subjectName}_${phaseName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Gagal membuat PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  const activeHtml = activeTab === 'soal' ? soalHtml : kisiHtml;
  const isGeneratingAny = isGeneratingSoal || isGeneratingKisi;

  return (
    <>
      <LoadingOverlay isVisible={isDownloading} message="Menyiapkan PDF..." />
      <LoadingOverlay isVisible={isGeneratingAny && !activeHtml} message="AI sedang memproses soal manual..." />
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Modal */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-md">
                <FileEdit className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Generate dari Soal Manual</h2>
                <p className="text-xs text-slate-500 mt-0.5">Buat Lembar Soal & Kisi-Kisi dari bank soal milik Anda sendiri</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    showHistory
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-orange-50 border border-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat ({history.length})</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <button
                onClick={() => setActiveTab('input')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all ${
                  activeTab === 'input' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileEdit className="w-4 h-4" />
                Input Soal
              </button>
              <button
                onClick={() => setActiveTab('soal')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all ${
                  activeTab === 'soal' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileQuestion className="w-4 h-4" />
                Lembar Soal
              </button>
              <button
                onClick={() => setActiveTab('kisi')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all ${
                  activeTab === 'kisi' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Table className="w-4 h-4" />
                Kisi-Kisi
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {activeTab === 'input' && (
                <>
                  <button
                    onClick={() => handleGenerate('soal')}
                    disabled={isGeneratingAny || !manualInput.trim()}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all shadow-button ${
                      isGeneratingAny || !manualInput.trim()
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isGeneratingSoal ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileQuestion className="w-4 h-4" />}
                    <span>Buat Lembar Soal</span>
                  </button>
                  <button
                    onClick={() => handleGenerate('kisi')}
                    disabled={isGeneratingAny || !manualInput.trim()}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all shadow-button ${
                      isGeneratingAny || !manualInput.trim()
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isGeneratingKisi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
                    <span>Buat Kisi-Kisi</span>
                  </button>
                </>
              )}

              {activeTab !== 'input' && (
                <>
                  <div className="flex items-center gap-1 border border-slate-300 rounded-lg overflow-hidden bg-white" title="Orientasi PDF">
                    <button
                      onClick={() => setOrientation('portrait')}
                      disabled={isDownloading}
                      className={`px-3 py-2 text-xs font-semibold transition-all ${
                        orientation === 'portrait' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-orange-50'
                      }`}
                    >
                      Potret
                    </button>
                    <button
                      onClick={() => setOrientation('landscape')}
                      disabled={isDownloading}
                      className={`px-3 py-2 text-xs font-semibold transition-all ${
                        orientation === 'landscape' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-orange-50'
                      }`}
                    >
                      Lanskap
                    </button>
                  </div>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={!activeHtml || isDownloading}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-button ${
                      !activeHtml || isDownloading
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex bg-slate-100">
            {/* History Sidebar */}
            {showHistory && history.length > 0 && (
              <div className="w-72 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
                <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Riwayat Generate</span>
                  <button
                    onClick={clearAllHistory}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Hapus Semua
                  </button>
                </div>
                <div className="p-2 space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="p-3 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-slate-800 truncate">{item.title}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                              item.type === 'soal' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {item.type === 'soal' ? 'Lembar Soal' : 'Kisi-Kisi'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative">
              
              {activeTab === 'input' && (
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                    <h3 className="font-semibold text-slate-800">Teks Soal / Bank Soal</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Paste atau ketik soal Anda di sini (PG maupun Essay). AI akan menyusun ulang, membuat kunci jawaban, dan mengidentifikasi TP/Materi untuk kisi-kisi.
                    </p>
                  </div>
                  <textarea
                    className="flex-1 w-full p-4 resize-none focus:outline-none text-sm text-slate-700 bg-transparent"
                    placeholder="Contoh:&#10;1. Apa ibu kota Indonesia?&#10;A. Bandung&#10;B. Jakarta&#10;C. Surabaya&#10;D. Medan&#10;&#10;Jelaskan proses terjadinya hujan!"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                  />
                  {!formData?.subject && (
                    <div className="p-3 bg-amber-50 border-t border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Anda belum mengisi Form Identitas (Mapel, Kelas, Sekolah) di panel utama. Kop surat dan identitas PDF akan menggunakan teks default.
                    </div>
                  )}
                </div>
              )}

              {activeTab !== 'input' && (
                <>
                  {!activeHtml && !isGeneratingAny && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                      <div className="w-20 h-20 flex items-center justify-center mb-4 bg-slate-200 rounded-full">
                        {activeTab === 'soal' ? <FileQuestion className="w-8 h-8 text-slate-400" /> : <Table className="w-8 h-8 text-slate-400" />}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Hasil</h3>
                      <p className="text-sm text-slate-500 max-w-sm">
                        Kembali ke tab "Input Soal" lalu klik "Buat {activeTab === 'soal' ? 'Lembar Soal' : 'Kisi-Kisi'}" untuk memproses teks soal Anda.
                      </p>
                    </div>
                  )}

                  {isGeneratingAny && !activeHtml && (
                    <div className="flex flex-col items-center justify-center h-full py-20">
                      <Loader2 className="w-10 h-10 animate-spin text-orange-600 mb-4" />
                      <p className="text-sm text-slate-600">AI sedang {activeTab === 'soal' ? 'merapikan lembar soal & kunci jawaban' : 'menganalisis soal untuk tabel kisi-kisi'}...</p>
                    </div>
                  )}

                  {activeHtml && (
                    <div className="bg-white rounded-lg shadow-page p-6 border border-slate-200 mx-auto" style={{ maxWidth: orientation === 'portrait' ? '1056px' : '100%' }}>
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: activeHtml }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
