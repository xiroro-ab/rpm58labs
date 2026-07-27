import React, { useState, useEffect } from 'react';
import { Download, Printer, X, FileText, Play, Bot, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { RPMFormData } from '../types';
import { LoadingOverlay } from './LoadingOverlay';
import { RevisionChatbot } from './RevisionChatbot';
import { ComplianceCheckerModal } from './ComplianceCheckerModal';
import CanvaCodeViewer from './CanvaCodeViewer';

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
  const [streamHtml, setStreamHtml] = useState('');
  const [isComplianceCheckerOpen, setIsComplianceCheckerOpen] = useState(false);
  const [isCanvaOpen, setIsCanvaOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!isStreaming) {
      setCurrentHtml(markdown);
    }
  }, [markdown, isStreaming]);

  const handleStreamUpdate = (html: string, isDone: boolean) => {
    if (isDone) {
      setCurrentHtml(html);
      setStreamHtml('');
      setIsStreaming(false);
    } else {
      setStreamHtml(html);
      setIsStreaming(true);
    }
  };

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
      <div className="print:hidden flex-shrink-0 flex items-center justify-between p-4 sm:p-6 pb-4 border-b border-warm-border/50 bg-gradient-to-r from-warm to-warm-light">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-extrabold rounded-md uppercase tracking-wider shadow-card flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Preview
          </span>
          <span className="text-[11px] font-medium text-slate-500 hidden md:flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-card border border-warm-border">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            Klik pada dokumen untuk mengedit langsung
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 relative group flex-wrap">
          <button
            onClick={() => {
              const currentHtml = document.getElementById('rpm-content')?.innerHTML;
              if (currentHtml && onSaveEdit) {
                onSaveEdit(currentHtml);
                toast.success('Editan berhasil disimpan!');
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-2 text-primary bg-white hover:bg-primary/5 text-xs sm:text-sm font-semibold rounded-lg transition-all border border-primary/20 shadow-card hover:shadow-card-hover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span className="hidden sm:inline">Simpan</span>
          </button>
          
          <button
            onClick={() => setIsChatbotOpen(!isChatbotOpen)}
            className="flex items-center gap-1.5 px-2.5 py-2 text-indigo-700 bg-white hover:bg-indigo-50 text-xs sm:text-sm font-semibold rounded-lg transition-all border border-indigo-200 shadow-card hover:shadow-card-hover"
          >
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Revisi</span>
          </button>

          <button
            onClick={() => setIsCanvaOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 text-sky-700 bg-white hover:bg-sky-50 text-xs sm:text-sm font-semibold rounded-lg transition-all border border-sky-200 shadow-card hover:shadow-card-hover"
          >
            <span className="text-sm">🎨</span>
            <span className="hidden sm:inline">Canva</span>
          </button>

          <button
            onClick={() => setIsComplianceCheckerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 text-amber-700 bg-white hover:bg-amber-50 text-xs sm:text-sm font-semibold rounded-lg transition-all border border-amber-200 shadow-card hover:shadow-card-hover"
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Cek</span>
          </button>
          
          <button
            onClick={handlePrintPDF}
            disabled={isDownloading}
            className={`flex items-center gap-1.5 px-3 py-2 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-button hover:shadow-button-hover transition-all shrink-0 ${isDownloading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{isDownloading ? 'Menyiapkan...' : 'Download PDF'}</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 pt-4 custom-scrollbar print:p-0 print:overflow-visible relative print:block print:h-auto flex flex-col relative items-center">
        {/* Format Toolbar */}
        <div className="print:hidden sticky top-0 z-40 bg-white/70 backdrop-blur-md border border-warm-border shadow-card rounded-t-xl w-full max-w-[1056px] flex flex-wrap items-center gap-1 p-2 mb-[-1px]">
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('bold', false, '')} className="p-1.5 text-slate-600 hover:bg-warm rounded-md transition-colors" title="Bold (Ctrl+B)">
            <Bold className="w-4 h-4" />
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('italic', false, '')} className="p-1.5 text-slate-600 hover:bg-warm rounded-md transition-colors" title="Italic (Ctrl+I)">
            <Italic className="w-4 h-4" />
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('underline', false, '')} className="p-1.5 text-slate-600 hover:bg-warm rounded-md transition-colors" title="Underline (Ctrl+U)">
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-warm-border mx-1"></div>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('justifyLeft', false, '')} className="p-1.5 text-slate-600 hover:bg-warm rounded-md transition-colors" title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('justifyCenter', false, '')} className="p-1.5 text-slate-600 hover:bg-warm rounded-md transition-colors" title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('justifyRight', false, '')} className="p-1.5 text-slate-600 hover:bg-warm rounded-md transition-colors" title="Align Right">
            <AlignRight className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-warm-border mx-1"></div>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('undo', false, '')} className="p-1.5 text-slate-600 hover:bg-warm rounded-md transition-colors" title="Undo (Ctrl+Z)">
            <Undo className="w-4 h-4" />
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand('redo', false, '')} className="p-1.5 text-slate-600 hover:bg-warm rounded-md transition-colors" title="Redo (Ctrl+Y)">
            <Redo className="w-4 h-4" />
          </button>
        </div>
        
        <div className="w-full max-w-[1056px] bg-white shadow-page rounded-b-xl border border-warm-border print:border-none print:shadow-none p-4 sm:p-8 md:p-12 print:p-0 min-h-[1056px] relative print:min-h-0 print:block">
          <div id="rpm-content" className="w-full text-black print:text-black rpm-content-wrapper outline-none hover:ring-2 hover:ring-primary/30 hover:ring-offset-4 rounded-sm transition-shadow p-2 -m-2" contentEditable={!isGeneratingContinue && !isDownloading && !isStreaming} suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: processMarkdown(isStreaming ? streamHtml : currentHtml) }}
            onBlur={(e) => {
               if (onSaveEdit && !isStreaming) onSaveEdit(e.currentTarget.innerHTML);
               setCurrentHtml(e.currentTarget.innerHTML);
            }}
          />
          
          {isStreaming && (
            <div className="flex items-center gap-2 mt-2 text-indigo-600 text-xs">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              AI sedang merevisi dokumen...
            </div>
          )}
          
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
          onStreamUpdate={handleStreamUpdate}
        />

        <ComplianceCheckerModal
          isOpen={isComplianceCheckerOpen}
          onClose={() => setIsComplianceCheckerOpen(false)}
          htmlContent={currentHtml}
          formPhase={formData?.phase || ''}
        />

        <CanvaCodeViewer
          isOpen={isCanvaOpen}
          onClose={() => setIsCanvaOpen(false)}
          rpmHtml={currentHtml}
          topic={formData?.topic || ''}
        />
      </div>
    </div>
      </>
  );
}
