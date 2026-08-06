import React, { useState } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { RPMFormData } from '../types';
import { LoadingOverlay } from './LoadingOverlay';

interface TableKisiKisiProps {
  isOpen: boolean;
  onClose: () => void;
  rpmHtml: string;
  formData: RPMFormData | null;
  customApiKey?: string;
  aiProvider?: string;
}

export default function TableKisiKisi({ isOpen, onClose, rpmHtml, formData, customApiKey, aiProvider }: TableKisiKisiProps) {
  const [tableHtml, setTableHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleGenerateTable = async () => {
    if (!rpmHtml) {
      toast.error('RPM belum tersedia');
      return;
    }

    setIsGenerating(true);
    setTableHtml('');

    try {
      const response = await fetch('/api/generate-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rpmHtml,
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

        var displayResult = resultText;
        if (displayResult.trim().startsWith('```html')) {
          displayResult = displayResult.replace(/^```html\n?/, '');
        } else if (displayResult.trim().startsWith('```')) {
          displayResult = displayResult.replace(/^```\n?/, '');
        }
        if (displayResult.trim().endsWith('```')) {
          displayResult = displayResult.replace(/\n?```$/, '');
        }

        setTableHtml(displayResult);
      }

      toast.success('Tabel kisi-kisi berhasil dibuat!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal membuat tabel kisi-kisi.', {
        duration: 6000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!tableHtml) {
      toast.error('Tabel belum tersedia');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: tableHtml,
          filename: `Tabel_Kisi-Kisi_${formData?.subject || 'Mapel'}_Kelas_${formData?.phase || ''}.pdf`,
          footerText: `Tabel Kisi-Kisi ${formData?.subject || ''} ${formData?.phase || ''} - ${formData?.school || ''}`
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
      a.download = `Tabel_Kisi-Kisi_${formData?.subject || 'Mapel'}_Kelas_${formData?.phase || ''}.pdf`;
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

  return (
    <>
      <LoadingOverlay isVisible={isDownloading} message="Menyiapkan PDF Tabel Kisi-Kisi..." />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Tabel Kisi-Kisi Soal</h2>
                <p className="text-xs text-slate-500 mt-0.5">Berdasarkan RPM yang sudah di-generate</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <button
              onClick={handleGenerateTable}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-button ${
                isGenerating
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
                  <span>Generate Tabel Kisi-Kisi</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={!tableHtml || isDownloading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-button ${
                !tableHtml || isDownloading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {tableHtml && (
              <span className="text-xs text-green-600 font-medium ml-2">
                ✓ Tabel siap diunduh
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-100 custom-scrollbar">
            {!tableHtml && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="w-20 h-20 flex items-center justify-center mb-4 bg-slate-200 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Tabel</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Klik tombol "Generate Tabel Kisi-Kisi" untuk membuat 3 tabel kisi-kisi soal berdasarkan RPM yang sudah ada.
                </p>
              </div>
            )}

            {isGenerating && !tableHtml && (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
                <p className="text-sm text-slate-600">AI sedang membuat tabel kisi-kisi...</p>
              </div>
            )}

            {tableHtml && (
              <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: tableHtml }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
