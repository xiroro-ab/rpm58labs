import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Sparkles, BookOpen, Download, Copy, Loader2 } from 'lucide-react';
import { RPMFormData } from '../types';
import toast from 'react-hot-toast';

interface AssessmentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: RPMFormData | null;
  currentHtml: string;
  onInsertToDocument: (html: string) => void;
}

export function AssessmentGeneratorModal({ isOpen, onClose, formData, currentHtml, onInsertToDocument }: AssessmentGeneratorModalProps) {
  const [assessmentType, setAssessmentType] = useState<'diagnostik' | 'formatif' | 'sumatif'>('sumatif');
  const [selectedMeeting, setSelectedMeeting] = useState<string>('semua');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWaitingForFirstChunk, setIsWaitingForFirstChunk] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [streamBuffer, setStreamBuffer] = useState('');
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const meetingCount = useMemo(() => {
    return Math.max(1, parseInt(formData?.meetingCount || '1'));
  }, [formData]);

  const meetingOptions = useMemo(() => {
    const options = [{ value: 'semua', label: `Semua Pertemuan (${meetingCount})` }];
    for (let i = 1; i <= meetingCount; i++) {
      options.push({ value: `pertemuan-${i}`, label: `Pertemuan ${i}` });
    }
    return options;
  }, [meetingCount]);

  useEffect(() => {
    if (!isOpen) {
      setGeneratedHtml('');
      setStreamBuffer('');
      setIsGenerating(false);
      setIsWaitingForFirstChunk(false);
      if (readerRef.current) {
        readerRef.current.cancel();
        readerRef.current = null;
      }
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!formData || !currentHtml) {
      toast.error('Tidak ada dokumen RPM');
      return;
    }

    setIsGenerating(true);
    setIsWaitingForFirstChunk(true);
    setGeneratedHtml('');
    setStreamBuffer('');

    try {
      const meetingTarget = selectedMeeting === 'semua'
        ? `semua ${meetingCount} pertemuan`
        : `Pertemuan ${selectedMeeting.replace('pertemuan-', '')}`;

      const instruction = `Buat soal ASESMEN ${assessmentType.toUpperCase()} untuk ${meetingTarget}.

DETAIL:
- Tipe: ${assessmentType}
- Target: ${meetingTarget}
- Total pertemuan dalam dokumen: ${meetingCount}

${assessmentType === 'diagnostik' ? `PENTING:
- 1 soal per pertemuan (total ${selectedMeeting === 'semua' ? meetingCount : 1} soal)
- Soal berupa pertanyaan pemantik yang relevan dengan materi tiap pertemuan` : ''}

${assessmentType === 'formatif' ? `PENTING:
- 5 soal per pertemuan (total ${selectedMeeting === 'semua' ? meetingCount * 5 : 5} soal)
- Fokus pada proses pembelajaran` : ''}

${assessmentType === 'sumatif' ? `PENTING:
- 10 soal per pertemuan (total ${selectedMeeting === 'semua' ? meetingCount * 10 : 10} soal)
- Pilihan ganda, opsi A B C D vertikal
- Sertakan KUNCI JAWABAN dalam tabel di akhir` : ''}

FORMAT: HTML murni, tanpa markdown code block, langsung konten assessment.`;

      const response = await fetch('/api/revise-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: currentHtml, instruction })
      });

      if (!response.ok) {
        throw new Error('Gagal generate assessment');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');
      readerRef.current = reader;

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
        setStreamBuffer(resultText);
      }

      const cleanHtml = resultText.replace(/^```html\n?/i, '').replace(/```$/i, '').trim();
      setGeneratedHtml(cleanHtml);
      setStreamBuffer('');
      toast.success('Assessment berhasil di-generate!');
    } catch (error: any) {
      toast.error(error.message || 'Gagal generate assessment');
    } finally {
      setIsGenerating(false);
      setIsWaitingForFirstChunk(false);
      readerRef.current = null;
    }
  };

  const handleInsert = () => {
    const content = generatedHtml || streamBuffer;
    if (!content) return;
    
    const clean = content.replace(/^```html\n?/i, '').replace(/```$/i, '').trim();
    
    // Find and replace the assessment section in the document
    const asesmenSectionRegex = /<div[^>]*style="[^"]*background-color:\s*#1a4185[^"]*"[^>]*>\s*IV\.\s*ASESMEN[\s\S]*?(?=<div[^>]*style="[^"]*background-color:\s*#1a4185[^"]*"[^>]*>\s*V\.)/i;
    const lampiranSectionRegex = /<div[^>]*style="[^"]*background-color:\s*#1a4185[^"]*"[^>]*>\s*IV\.\s*ASESMEN[\s\S]*?(?=<div[^>]*style="[^"]*background-color:\s*#1a4185[^"]*"[^>]*>\s*Lampiran)/i;
    
    let newHtml = currentHtml;
    
    if (asesmenSectionRegex.test(newHtml)) {
      newHtml = newHtml.replace(asesmenSectionRegex, `<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">IV. ASESMEN PEMBELAJARAN</div>\n${clean}`);
      onInsertToDocument(newHtml);
      toast.success('Assessment berhasil diganti!');
      onClose();
    } else if (lampiranSectionRegex.test(newHtml)) {
      newHtml = newHtml.replace(lampiranSectionRegex, `<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">IV. ASESMEN PEMBELAJARAN</div>\n${clean}`);
      onInsertToDocument(newHtml);
      toast.success('Assessment berhasil diganti!');
      onClose();
    } else {
      // Append at the bottom as fallback
      onInsertToDocument(currentHtml + '\n\n' + clean);
      toast.success('Assessment ditambahkan!');
      onClose();
    }
  };

  const handleCopy = () => {
    const content = generatedHtml || streamBuffer;
    navigator.clipboard.writeText(content);
    toast.success('HTML berhasil disalin!');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Loading Overlay - Same style as RPM generation */}
      {isWaitingForFirstChunk && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-700">AI sedang menyusun soal...</p>
            <p className="text-xs text-slate-400 text-center">
              Menganalisis RPM dan membuat soal {assessmentType === 'diagnostik' ? 'diagnostik' : assessmentType === 'formatif' ? 'formatif' : 'sumatif'}
            </p>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-slate-800 truncate">Generate Soal</h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                  {meetingCount} pertemuan
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Left Panel */}
              <div className="w-full lg:w-72 space-y-4 shrink-0">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipe Asesmen</label>
                  <select
                    value={assessmentType}
                    onChange={(e) => { setAssessmentType(e.target.value as any); setGeneratedHtml(''); setStreamBuffer(''); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="diagnostik">Asesmen Diagnostik</option>
                    <option value="formatif">Asesmen Formatif</option>
                    <option value="sumatif">Asesmen Sumatif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Pertemuan</label>
                  <select
                    value={selectedMeeting}
                    onChange={(e) => { setSelectedMeeting(e.target.value); setGeneratedHtml(''); setStreamBuffer(''); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    {meetingOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700 mb-1">Info:</p>
                  <p>• {meetingCount} pertemuan</p>
                  {assessmentType === 'sumatif' && <p>• {selectedMeeting === 'semua' ? meetingCount * 10 : 10} soal</p>}
                  {assessmentType === 'formatif' && <p>• {selectedMeeting === 'semua' ? meetingCount * 5 : 5} soal</p>}
                  {assessmentType === 'diagnostik' && <p>• {selectedMeeting === 'semua' ? meetingCount : 1} soal</p>}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Generate Soal</>
                  )}
                </button>
              </div>

              {/* Right Panel */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800">Preview</h3>
                  {(generatedHtml || streamBuffer) && !isWaitingForFirstChunk && (
                    <div className="flex gap-2">
                      <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-md transition-colors">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                      <button onClick={handleInsert} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 transition-colors">
                        <Download className="w-3.5 h-3.5" /> {generatedHtml ? 'Replace di RPM' : 'Simpan'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="border border-slate-200 rounded-lg bg-white min-h-[300px] sm:min-h-[400px]">
                  {!streamBuffer && !generatedHtml && !isGenerating ? (
                    <div className="flex items-center justify-center h-[300px] sm:h-[400px] text-slate-400">
                      <div className="text-center px-4">
                        <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-20 mx-auto" />
                        <p className="text-sm">Pilih tipe & target, lalu klik Generate</p>
                        <p className="text-xs mt-1">Soal akan dibuat berdasarkan RPM Anda</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5 overflow-y-auto max-h-[400px] sm:max-h-[500px]">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: streamBuffer || generatedHtml }}
                      />
                      {isGenerating && !isWaitingForFirstChunk && (
                        <div className="flex items-center gap-2 mt-3 text-emerald-600 text-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Menulis...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
