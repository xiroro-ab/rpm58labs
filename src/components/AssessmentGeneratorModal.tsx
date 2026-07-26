import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, BookOpen, Download, Copy } from 'lucide-react';
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
  const [generatedHtml, setGeneratedHtml] = useState('');

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

  const existingQuestions = useMemo(() => {
    if (!currentHtml) return { diagnostik: 0, formatif: 0, sumatif: 0 };
    const count = (type: string) => {
      const regex = new RegExp(type, 'gi');
      return (currentHtml.match(regex) || []).length;
    };
    return {
      diagnostik: count('diagnostik'),
      formatif: count('formatif'),
      sumatif: count('sumatif')
    };
  }, [currentHtml]);

  const handleGenerate = async () => {
    if (!formData || !currentHtml) {
      toast.error('Tidak ada dokumen RPM untuk dijadikan referensi');
      return;
    }

    setIsGenerating(true);
    setGeneratedHtml('');

    try {
      const meetingTarget = selectedMeeting === 'semua'
        ? `${meetingCount} pertemuan`
        : selectedMeeting.replace('pertemuan-', 'Pertemuan ');

      const prompt = `Anda adalah asisten AI spesialis assessment pendidikan.

TUGAS: Buatkan soal ASESMEN ${assessmentType.toUpperCase()} untuk RPM berikut.

KONTEKS DOKUMEN RPM:
${currentHtml}

INSTRUKSI:
1. FOKUS pada ${meetingTarget}
2. Soal harus KONTEKSTUAL dengan materi di RPM di atas
3. KELUARKAN HANYA bagian assessment dalam format HTML
4. JANGAN ubah struktur RPM lainnya
5. JANGAN gunakan markdown code block

${assessmentType === 'diagnostik' ? `PENTING UNTUK ASESMEN DIAGNOSTIK:
- Buat 1 soal pertanyaan pemantik per pertemuan (total ${selectedMeeting === 'semua' ? meetingCount : 1} soal untuk ${selectedMeeting === 'semua' ? meetingCount + ' pertemuan' : selectedMeeting})
- Setiap soal harus sinkron dengan materi pertemuan tersebut
- Soal akan otomatis menjadi pertanyaan pemantik di bagian "Kegiatan Awal" RPM` : ''}

${assessmentType === 'formatif' ? `PENTING UNTUK ASESMEN FORMATIF:
- 5 soal per pertemuan (total ${selectedMeeting === 'semua' ? meetingCount * 5 : 5} soal)
- Fokus pada proses pembelajaran di kegiatan inti` : ''}

${assessmentType === 'sumatif' ? `PENTING UNTUK ASESMEN SUMATIF:
- 10 soal per pertemuan (total ${selectedMeeting === 'semua' ? meetingCount * 10 : 10} soal${selectedMeeting !== 'semua' ? ', pertemuan ' + selectedMeeting.replace('pertemuan-', '') : ' untuk ' + meetingCount + ' pertemuan'})
- 1 tema per pertemuan sesuai materi di RPM
- Soal pilihan ganda dengan opsi A, B, C, D vertikal
- Sertakan KUNCI JAWABAN di akhir dalam tabel
- Gunakan tag <ol> untuk penomoran soal` : ''}

FORMAT OUTPUT HANYA:
<div class="assessment-section">
  [Konten assessment HTML disini]
</div>`;

      const response = await fetch('/api/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentHtml,
          instruction: prompt
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal generate assessment');
      }

      const data = await response.json();
      const result = data.revisedHtml || '';

      // Extract only the assessment section
      const assessmentMatch = result.match(/<div class="assessment-section">[\s\S]*?<\/div>/i);
      const finalHtml = assessmentMatch ? assessmentMatch[0] : result;

      setGeneratedHtml(finalHtml);
      toast.success('Assessment berhasil di-generate!');
    } catch (error: any) {
      toast.error(error.message || 'Gagal generate assessment');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (!generatedHtml) return;
    onInsertToDocument(generatedHtml);
    toast.success('Assessment berhasil disisipkan ke dokumen!');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedHtml);
    toast.success('HTML berhasil disalin!');
  };

  if (!isOpen) return null;

  return (
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
                {meetingCount} pertemuan | {existingQuestions.sumatif} soal sumatif
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
                  onChange={(e) => { setAssessmentType(e.target.value as any); setGeneratedHtml(''); }}
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
                  onChange={(e) => { setSelectedMeeting(e.target.value); setGeneratedHtml(''); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  {meetingOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700 mb-1">Info Dokumen:</p>
                <p>• {meetingCount} pertemuan terdeteksi</p>
                <p>• Soal diagnostik: {existingQuestions.diagnostik}x ditemukan</p>
                <p>• Soal formatif: {existingQuestions.formatif}x ditemukan</p>
                <p>• Soal sumatif: {existingQuestions.sumatif}x ditemukan</p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Generating...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Generate Soal</>
                )}
              </button>
            </div>

            {/* Right Panel */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Preview</h3>
                {generatedHtml && (
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-md transition-colors">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                    <button onClick={handleInsert} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Insert ke Dokumen
                    </button>
                  </div>
                )}
              </div>
              <div className="border border-slate-200 rounded-lg bg-white min-h-[300px] sm:min-h-[400px]">
                {!generatedHtml ? (
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
                      dangerouslySetInnerHTML={{ __html: generatedHtml }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
