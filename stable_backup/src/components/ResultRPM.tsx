import React, { useState, useEffect } from 'react';
import { Download, Printer, X, FileText, Play, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import { RPMFormData } from '../types';
import { LoadingOverlay } from './LoadingOverlay';
import { RevisionChatbot } from './RevisionChatbot';

interface ResultRPMProps {
  markdown: string;
  onReset: () => void;
  onContinue: () => void;
  onSaveEdit?: (editedHtml: string) => void;
  formData: RPMFormData | null;
  isGeneratingContinue: boolean;
}

export default function ResultRPM({ markdown, onReset, onContinue, formData, isGeneratingContinue, onSaveEdit }: ResultRPMProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [currentHtml, setCurrentHtml] = useState(markdown);

  useEffect(() => {
    setCurrentHtml(markdown);
  }, [markdown]);

  const handlePrintPDF = async () => {
    setIsDownloading(true);
    try {
      // Create request to our new server-side Puppeteer endpoint
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: document.getElementById('rpm-content')?.innerHTML || markdown,
          filename: `RPM_${formData?.subject || 'Kurikulum'}_Kelas_${formData?.phase || ''}.pdf`,
          footerText: `RPM ${formData?.subject || ''} ${
            formData?.phase 
              ? formData.phase.replace(/Fase (.*) \((.*)\)/, 'Kelas ($2) Fase $1')
              : ''
          } - ${formData?.school || ''} (Deep Learning ${formData?.learningMode || ''})`
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
      a.download = `RPM_${formData?.subject || 'Kurikulum'}_Kelas_${formData?.phase || ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      import('react-hot-toast').then(({ toast }) => {
        toast.error(err instanceof Error ? err.message : 'Gagal membuat PDF');
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement('a');
    const file = new Blob([markdown], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = 'RPM_Kurikulum_Merdeka.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  
  const processMarkdown = (md: string) => {
    if (!md) return md;
    
    // Convert checkmarks to emojis (which will be rendered correctly by twemoji/font fallback)
    let processed = md.replace(/✓/g, '✅').replace(/✔/g, '✅');
    
    // First, strip inline styles that AI might have generated despite instructions
    processed = processed.replace(/<span style="[^"]*background-color:[^"]*"[^>]*>(Mindful[^<]*)<\/span>/gi, '$1');
    processed = processed.replace(/<span style="[^"]*background-color:[^"]*"[^>]*>(Meaningful[^<]*)<\/span>/gi, '$1');
    processed = processed.replace(/<span style="[^"]*background-color:[^"]*"[^>]*>(Joyful[^<]*)<\/span>/gi, '$1');
    
    // Clean up class names if it used incorrect ones
    processed = processed.replace(/<span class="[^"]*"(?:[^>]*)>(Mindful[^<]*)<\/span>/gi, '$1');
    processed = processed.replace(/<span class="[^"]*"(?:[^>]*)>(Meaningful[^<]*)<\/span>/gi, '$1');
    processed = processed.replace(/<span class="[^"]*"(?:[^>]*)>(Joyful[^<]*)<\/span>/gi, '$1');

    // Now securely wrap them
    processed = processed.replace(/\b(Mindful(?:\s+\w+)?)\b/gi, '<span class="label-mindful">$1</span>');
    processed = processed.replace(/\b(Meaningful(?:\s+\w+)?)\b/gi, '<span class="label-meaningful">$1</span>');
    processed = processed.replace(/\b(Joyful(?:\s+\w+)?)\b/gi, '<span class="label-joyful">$1</span>');
    
    return processed;
  };

  const finalHtml = processMarkdown(markdown);
  return (
    <>
      <LoadingOverlay isVisible={isDownloading} message="Menyiapkan PDF..." />
      <div className="flex flex-col h-full w-full overflow-hidden print:overflow-visible print:block print:h-auto">
      <div className="print:hidden flex-shrink-0 flex items-center justify-between p-4 sm:p-6 pb-4">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide italic">Preview Dokumen</span>
          <span className="text-xs text-slate-500 hidden sm:flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            Klik pada dokumen untuk mengedit langsung
          </span>
        </div>
        <div className="flex items-center gap-2 relative group">
          <button
            onClick={() => {
              const currentHtml = document.getElementById('rpm-content')?.innerHTML;
              if (currentHtml && onSaveEdit) {
                onSaveEdit(currentHtml);
                toast.success('Editan berhasil disimpan!');
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 text-sm font-semibold rounded-md transition-colors border border-blue-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span className="hidden sm:inline">Simpan Edit</span>
          </button>

          
          
          
          <button
            onClick={() => setIsChatbotOpen(!isChatbotOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-sm font-semibold rounded-md transition-colors border border-indigo-200"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Revisi dengan AI</span>
          </button>
          
          <button
            onClick={handlePrintPDF}
            disabled={isDownloading}
            className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-md shadow-sm transition-colors ${isDownloading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">{isDownloading ? 'Menyiapkan PDF...' : 'Cetak / Simpan PDF'}</span>
            <span className="inline lg:hidden">PDF</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 pt-0 custom-scrollbar print:p-0 print:overflow-visible relative print:block print:h-auto flex flex-row relative">
        <div className="flex-1 bg-white shadow-xl rounded-sm border border-slate-200 print:border-none print:shadow-none p-4 sm:p-8 md:p-12 print:p-0 min-h-[1056px] relative print:min-h-0 print:block">
          <div id="rpm-content" className="w-full text-black print:text-black rpm-content-wrapper outline-none hover:ring-2 hover:ring-blue-300 hover:ring-offset-4 rounded-sm transition-shadow p-2 -m-2" contentEditable={!isGeneratingContinue && !isDownloading} suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: processMarkdown(currentHtml) }}
            onBlur={(e) => {
               if (onSaveEdit) onSaveEdit(e.currentTarget.innerHTML);
               setCurrentHtml(e.currentTarget.innerHTML);
            }}
          />
          
          {/* Print Footer */}
          <div className="hidden print:flex fixed bottom-0 left-0 right-0 w-full justify-between items-end text-[9px] text-gray-500 bg-white pt-2 border-t border-gray-200 z-50">
            <span>RPM {formData?.subject} {formData?.phase ? formData.phase.replace(/Fase (.*) \((.*)\)/, 'Kelas ($2) Fase $1') : ''} - {formData?.school} (Deep Learning {formData?.learningMode})</span>
          </div>
        </div>

        <RevisionChatbot
          isOpen={isChatbotOpen}
          setIsOpen={setIsChatbotOpen}
          currentHtml={currentHtml}
          onApplyRevision={(newHtml) => {
             setCurrentHtml(newHtml);
             if (onSaveEdit) onSaveEdit(newHtml);
          }}
        />
      </div>
    </div>
      </>
  );
}
