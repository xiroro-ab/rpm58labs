import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Download, Upload, Filter, Copy } from 'lucide-react';
import { assessmentGenerator } from '../lib/assessmentGenerator';
import { RPMFormData } from '../types';
import toast from 'react-hot-toast';

interface AssessmentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: RPMFormData | null;
  onInsertToDocument: (html: string) => void;
}

export function AssessmentGeneratorModal({ isOpen, onClose, formData, onInsertToDocument }: AssessmentGeneratorModalProps) {
  const [assessmentType, setAssessmentType] = useState<'diagnostik' | 'formatif' | 'sumatif'>('sumatif');
  const [questionCount, setQuestionCount] = useState(10);
  const [bloomLevels, setBloomLevels] = useState<string[]>(['C1', 'C2', 'C3', 'C4']);
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');

  const bloomOptions = [
    { value: 'C1', label: 'C1 - Mengingat', color: 'bg-green-100 text-green-700' },
    { value: 'C2', label: 'C2 - Memahami', color: 'bg-blue-100 text-blue-700' },
    { value: 'C3', label: 'C3 - Menerapkan', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'C4', label: 'C4 - Menganalisis', color: 'bg-orange-100 text-orange-700' },
    { value: 'C5', label: 'C5 - Mengevaluasi', color: 'bg-red-100 text-red-700' },
    { value: 'C6', label: 'C6 - Mencipta', color: 'bg-purple-100 text-purple-700' },
  ];

  const toggleBloomLevel = (level: string) => {
    setBloomLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const handleGenerate = async () => {
    if (!formData) {
      toast.error('Data form tidak tersedia');
      return;
    }

    if (bloomLevels.length === 0) {
      toast.error('Pilih minimal 1 level Bloom\'s Taxonomy');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = assessmentGenerator.generateAssessmentPrompt(
        formData.subject,
        customTopic || formData.topic,
        formData.phase,
        assessmentType,
        questionCount,
        bloomLevels
      );

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...formData,
            topic: customTopic || formData.topic
          },
          customApiKey: localStorage.getItem('customApiKey') || '',
          aiProvider: localStorage.getItem('aiProvider') || 'gemini',
          assessmentPrompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error('Gagal generate assessment');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');
      
      const decoder = new TextDecoder();
      let resultText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value, { stream: true });
        setGeneratedHtml(resultText);
      }

      toast.success('Assessment berhasil di-generate!');
    } catch (error: any) {
      toast.error(error.message || 'Gagal generate assessment');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedHtml) {
      onInsertToDocument(generatedHtml);
      toast.success('Assessment berhasil disisipkan ke dokumen!');
      onClose();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedHtml);
    toast.success('HTML berhasil disalin!');
  };

  const handleExport = () => {
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment_${assessmentType}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Assessment berhasil diekspor!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Assessment Generator</h2>
              <p className="text-xs text-slate-500 mt-0.5">Generate soal asesmen dengan AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Settings */}
          <div className="w-1/3 border-r border-slate-200 overflow-y-auto custom-scrollbar bg-slate-50/30 p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tipe Asesmen</label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="diagnostik">Asesmen Diagnostik</option>
                <option value="formatif">Asesmen Formatif</option>
                <option value="sumatif">Asesmen Sumatif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah Soal</label>
              <input
                type="number"
                min="5"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Topik Khusus (Opsional)</label>
              <input
                type="text"
                placeholder={formData?.topic || 'Gunakan topik dari form'}
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Bloom's Taxonomy Level
              </label>
              <div className="space-y-2">
                {bloomOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleBloomLevel(option.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                      bloomLevels.includes(option.value)
                        ? `${option.color} ring-2 ring-offset-1`
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !formData}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Assessment
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Preview Hasil</h3>
              {generatedHtml && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-md transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy HTML
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 text-xs font-semibold rounded-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                  <button
                    onClick={handleInsert}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    Insert ke Dokumen
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
              {!generatedHtml ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 mb-4 opacity-20 mx-auto" />
                    <p className="text-sm">Klik tombol Generate untuk membuat soal asesmen</p>
                    <p className="text-xs mt-2">AI akan membuat soal sesuai dengan kriteria yang dipilih</p>
                  </div>
                </div>
              ) : (
                <div 
                  className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: generatedHtml }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
