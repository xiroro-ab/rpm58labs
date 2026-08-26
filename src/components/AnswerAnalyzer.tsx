import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Loader2, Download, Upload, Image as ImageIcon, ClipboardPaste, FileSpreadsheet, BookOpen, PenLine, Trash2, Plus, CheckCircle2, AlertTriangle, History } from 'lucide-react';
import { QuestionBankItem, StudentAnswers, AnalyzeResult, HistoryItem, AnalysisSession } from '../types';

interface AnswerAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  customApiKey?: string;
}

const STEP_LABELS = ['Sumber Soal', 'Bank Soal', 'Jawaban Siswa', 'Hasil Analisis'];
const ANALYSES_KEY = 'rpmAnalysisHistory';
const MAX_SESSIONS = 12;

function loadAnalyses(): AnalysisSession[] {
  try {
    const raw = localStorage.getItem(ANALYSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse analysis history', e);
    return [];
  }
}

function persistAnalyses(sessions: AnalysisSession[]) {
  const save = (list: AnalysisSession[]) => localStorage.setItem(ANALYSES_KEY, JSON.stringify(list));
  try {
    save(sessions);
  } catch (e) {
    try {
      save(sessions.slice(0, Math.ceil(sessions.length / 2)));
    } catch (e2) {
      console.error('Failed to save analysis history (storage full)', e2);
    }
  }
}

export default function AnswerAnalyzer({ isOpen, onClose, history, customApiKey }: AnswerAnalyzerProps) {
  const [step, setStep] = useState(1);
  const [isWorking, setIsWorking] = useState(false);
  const [waitingFirst, setWaitingFirst] = useState(false);

  const [srcMode, setSrcMode] = useState<'rpm' | 'external'>('rpm');
  const [selectedRpmId, setSelectedRpmId] = useState('');
  const [extText, setExtText] = useState('');
  const [extImage, setExtImage] = useState<{ base64: string; mime: string; name: string } | null>(null);

  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);

  const [ansTab, setAnsTab] = useState<'file' | 'paste' | 'photo'>('file');
  const [pasteText, setPasteText] = useState('');
  const [photo, setPhoto] = useState<{ base64: string; mime: string; name: string } | null>(null);

  const [students, setStudents] = useState<StudentAnswers[]>([]);
  const [kkm, setKkm] = useState('75');
  const [className, setClassName] = useState('');

  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [metaInfo, setMetaInfo] = useState<{ subject: string; phase: string; teacher: string; school: string; headmaster: string }>({ subject: '', phase: '', teacher: '', school: '', headmaster: '' });
  const [isDownloading, setIsDownloading] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisSession[]>(() => loadAnalyses());
  const [showAnalyses, setShowAnalyses] = useState(false);

  if (!isOpen) return null;

  const resetAll = () => {
    setStep(1); setQuestions([]); setStudents([]); setResult(null);
    setExtText(''); setExtImage(null); setPasteText(''); setPhoto(null); setSelectedRpmId('');
    setShowAnalyses(false);
  };

  const saveSession = (r: AnalyzeResult) => {
    const session: AnalysisSession = {
      id: Date.now().toString(),
      title: `${metaInfo.subject || 'Analisis'}${metaInfo.phase || className ? ' - ' + (metaInfo.phase || className) : ''}`,
      date: new Date().toISOString(),
      kkm: parseInt(kkm) || 75,
      className,
      meta: metaInfo,
      questions: [...questions],
      students: [...students],
      result: r,
    };
    const next = [session, ...analyses].slice(0, MAX_SESSIONS);
    setAnalyses(next);
    persistAnalyses(next);
  };

  const restoreSession = (s: AnalysisSession) => {
    setQuestions(s.questions);
    setStudents(s.students);
    setResult(s.result);
    setMetaInfo(s.meta);
    setKkm(String(s.kkm));
    setClassName(s.className || '');
    setShowAnalyses(false);
    setStep(4);
  };

  const deleteSession = (id: string) => {
    const next = analyses.filter(a => a.id !== id);
    setAnalyses(next);
    persistAnalyses(next);
    toast.success('Riwayat analisis dihapus');
  };

  const readFileBase64 = (file: File, cb: (base64: string, mime: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      cb(dataUrl.split(',')[1] || '', dataUrl.split(',')[0]?.replace('data:', '').replace(';base64', '') || file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    let payload: any = { customApiKey };
    if (srcMode === 'rpm') {
      const item = history.find(h => h.id === selectedRpmId);
      if (!item) { toast.error('Pilih dokumen RPM terlebih dahulu.'); return; }
      payload.sourceHtml = item.markdown;
      setMetaInfo({
        subject: item.formData.subject || '', phase: item.formData.phase || '',
        teacher: item.formData.teacher || '', school: item.formData.school || '', headmaster: item.formData.headmaster || '',
      });
    } else {
      if (!extText.trim() && !extImage) { toast.error('Tempel soal atau unggah fotonya dulu.'); return; }
      payload.text = extText;
      if (extImage) { payload.imageBase64 = extImage.base64; payload.imageMime = extImage.mime; }
    }

    setIsWorking(true); setWaitingFirst(true);
    try {
      const res = await fetch('/api/extract-questions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Gagal mengekstrak soal.');
      setQuestions(data.questions);
      setStep(2);
      toast.success(`${data.questions.length} soal berhasil diekstrak.`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengekstrak soal.', { duration: 6000 });
    } finally { setIsWorking(false); setWaitingFirst(false); }
  };

  const handleParseAnswers = async () => {
    let payload: any = { customApiKey };
    if (ansTab === 'file') {
      const input = document.getElementById('analyzer-csv-input') as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (!file) { toast.error('Pilih file CSV/TXT rekap jawaban.'); return; }
      const text = await file.text();
      payload.csvText = text;
    } else if (ansTab === 'paste') {
      if (!pasteText.trim()) { toast.error('Tempel dulu teks jawaban siswanya.'); return; }
      payload.text = pasteText;
    } else {
      if (!photo) { toast.error('Unggah atau jepret foto lembar jawabannya.'); return; }
      payload.imageBase64 = photo.base64; payload.imageMime = photo.mime;
    }

    setIsWorking(true); setWaitingFirst(true);
    try {
      const res = await fetch('/api/parse-answers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Gagal membaca jawaban.');
      setStudents(data.students);
      toast.success(`${data.students.length} siswa berhasil dibaca. Periksa dan perbaiki jika ada salah baca.`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal membaca jawaban.', { duration: 6000 });
    } finally { setIsWorking(false); setWaitingFirst(false); }
  };

  const handleAnalyze = async () => {
    if (questions.length === 0) { toast.error('Bank soal kosong.'); return; }
    if (students.length === 0) { toast.error('Belum ada jawaban siswa.'); return; }

    setIsWorking(true); setWaitingFirst(true);
    try {
      const res = await fetch('/api/analyze-results', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions, students, kkm,
          meta: { ...metaInfo, phase: metaInfo.phase || className },
          customApiKey,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Gagal menganalisis.');
      setResult(data);
      setStep(4);
      saveSession(data);
      toast.success('Analisis selesai! Tersimpan di riwayat.');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menganalisis.', { duration: 6000 });
    } finally { setIsWorking(false); setWaitingFirst(false); }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setIsDownloading(true);
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: result.reportHtml,
          filename: `Analisis_${metaInfo.subject || 'Mapel'}_Kelas_${metaInfo.phase || className || ''}.pdf`,
          footerText: `Analisis Hasil Belajar ${metaInfo.subject || ''} ${metaInfo.phase ? '- ' + metaInfo.phase : ''} ${metaInfo.school ? '- ' + metaInfo.school : ''}`,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Gagal dari server');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Analisis_${metaInfo.subject || 'Mapel'}_Kelas_${metaInfo.phase || className || ''}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF laporan berhasil diunduh!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat PDF');
    } finally { setIsDownloading(false); }
  };

  const updateQuestion = (idx: number, patch: Partial<QuestionBankItem>) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
  };
  const updateStudentAnswer = (si: number, qNum: string, val: string) => {
    setStudents(prev => prev.map((s, i) => i === si ? { ...s, answers: { ...s.answers, [qNum]: val } } : s));
  };

  const soloBadge = (solo: string) => {
    const map: Record<string, string> = {
      prestructural: 'bg-red-100 text-red-700',
      unistructural: 'bg-orange-100 text-orange-700',
      multistructural: 'bg-yellow-100 text-yellow-700',
      relational: 'bg-green-100 text-green-700',
      extended: 'bg-blue-100 text-blue-700',
    };
    return map[solo] || 'bg-slate-100 text-slate-600';
  };
  const SOLO_NAMES: Record<string, string> = {
    prestructural: 'Prestruktural', unistructural: 'Unistruktural', multistructural: 'Multistruktural',
    relational: 'Relasional', extended: 'Abstrak Diperluas',
  };

  return (
    <>
      <LoadingOverlayLocal isVisible={waitingFirst} message={step >= 3 && !result ? 'AI sedang membaca & mengoreksi jawaban...' : 'AI sedang bekerja...'} />
      <LoadingOverlayLocal isVisible={isDownloading} message="Menyiapkan PDF Laporan Analisis..." />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-md">
                <CheckCircle2 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Koreksi &amp; Analisis Jawaban Siswa</h2>
                <p className="text-xs text-slate-500 mt-0.5">Koreksi otomatis + Taksonomi SOLO + Laporan PDF</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analyses.length > 0 && (
                <button
                  onClick={() => setShowAnalyses(!showAnalyses)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    showAnalyses
                      ? 'bg-violet-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-violet-50 border border-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat ({analyses.length})</span>
                </button>
              )}
              <button onClick={() => { resetAll(); onClose(); }} className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stepper */}
          {!showAnalyses && (
          <div className="flex items-center gap-1 px-5 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <React.Fragment key={n}>
                  {i > 0 && <div className={`flex-1 h-0.5 min-w-[12px] rounded ${done ? 'bg-violet-500' : 'bg-slate-200'}`} />}
                  <button
                    onClick={() => { if (done) setStep(n); }}
                    disabled={!done && !active}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      active ? 'bg-violet-600 text-white shadow'
                        : done ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 cursor-pointer'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] ${active ? 'bg-white/25' : done ? 'bg-violet-500 text-white' : 'bg-slate-300 text-white'}`}>{done ? '✓' : n}</span>
                    {label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
            {showAnalyses ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600 mb-3">Riwayat analisis tersimpan di perangkat ini ({analyses.length}/{MAX_SESSIONS}). Klik untuk membuka kembali hasilnya.</p>
                {analyses.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <History className="w-10 h-10 mb-2 opacity-20 mx-auto" />
                    <p className="text-sm">Belum ada riwayat analisis</p>
                  </div>
                )}
                {analyses.map(s => (
                  <div
                    key={s.id}
                    onClick={() => restoreSession(s)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 cursor-pointer transition-all flex items-start justify-between gap-2 bg-white"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-800 text-sm truncate">{s.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' • '}{s.students.length} siswa • {s.questions.length} soal • Rata-rata {s.result.stats.average} • Tuntas {s.result.stats.tuntasCount}/{s.result.stats.count}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.meta.subject && <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-semibold rounded">{s.meta.subject}</span>}
                        {(s.meta.phase || s.className) && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded">{s.meta.phase || s.className}</span>}
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded">KKM {s.kkm}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setShowAnalyses(false)} className="mt-3 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                  ← Tutup Riwayat
                </button>
              </div>
            ) : (
            <>
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSrcMode('rpm')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${srcMode === 'rpm' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-violet-300 bg-white'}`}
                  >
                    <BookOpen className="w-6 h-6 text-violet-600 mb-2" />
                    <h3 className="font-bold text-slate-800 text-sm">Dari Dokumen RPM</h3>
                    <p className="text-xs text-slate-500 mt-1">Ambil soal Asesmen Sumatif dari RPM yang sudah dibuat.</p>
                  </button>
                  <button
                    onClick={() => setSrcMode('external')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${srcMode === 'external' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-violet-300 bg-white'}`}
                  >
                    <PenLine className="w-6 h-6 text-violet-600 mb-2" />
                    <h3 className="font-bold text-slate-800 text-sm">Soal Eksternal</h3>
                    <p className="text-xs text-slate-500 mt-1">Tempel teks soal, atau foto naskah soal ulangan.</p>
                  </button>
                </div>

                {srcMode === 'rpm' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Riwayat RPM</label>
                    <select
                      value={selectedRpmId}
                      onChange={(e) => setSelectedRpmId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                    >
                      <option value="">— Pilih dokumen —</option>
                      {history.map(h => (
                        <option key={h.id} value={h.id}>{h.title} ({new Date(h.date).toLocaleDateString('id-ID')})</option>
                      ))}
                    </select>
                    {history.length === 0 && <p className="text-xs text-red-500 mt-1">Belum ada riwayat RPM. Buat RPM dulu atau pakai Soal Eksternal.</p>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Teks Soal + Kunci Jawaban</label>
                      <textarea
                        value={extText}
                        onChange={(e) => setExtText(e.target.value)}
                        rows={7}
                        placeholder={'Contoh:\n1. Proses tumbuhan membuat makanan disebut...\nA. Respirasi\nB. Fotosintesis\n...\nKUNCI JAWABAN:\n1. B'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">atau Foto Naskah Soal</label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) readFileBase64(f, (b64, mime) => setExtImage({ base64: b64, mime, name: f.name }));
                        }}
                        className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                      />
                      {extImage && <p className="text-xs text-green-600 mt-1">Foto siap: {extImage.name}</p>}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleExtract}
                  disabled={isWorking}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-all shadow-button"
                >
                  {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Ekstrak Soal dengan AI
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-slate-600">Periksa hasil ekstraksi AI. Pastikan <b>kunci jawaban benar</b> sebelum lanjut.</p>
                  <button
                    onClick={() => setQuestions(prev => [...prev, { number: prev.length + 1, type: 'pg', question: '', options: [], answer: '' }])}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Soal
                  </button>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="max-h-[45vh] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 w-10">No</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 w-24">Jenis</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Soal</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 w-40">Kunci</th>
                          <th className="px-2 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {questions.map((q, idx) => (
                          <tr key={idx}>
                            <td className="px-2 py-1.5 text-slate-500 text-xs">{idx + 1}</td>
                            <td className="px-2 py-1.5">
                              <select
                                value={q.type}
                                onChange={(e) => updateQuestion(idx, { type: e.target.value as 'pg' | 'essay' })}
                                className="w-full border border-slate-200 rounded px-1 py-1 text-xs"
                              >
                                <option value="pg">PG</option>
                                <option value="essay">Uraian</option>
                              </select>
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                value={q.question}
                                onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                                className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                                placeholder="Teks soal..."
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                value={q.answer}
                                onChange={(e) => updateQuestion(idx, { answer: e.target.value })}
                                className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-semibold"
                                placeholder={q.type === 'pg' ? 'A / B / C / D' : 'Kunci singkat'}
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <button
                                onClick={() => setQuestions(prev => prev.filter((_, i) => i !== idx).map((qq, i) => ({ ...qq, number: i + 1 })))}
                                className="p-1 text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">← Kembali</button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={questions.length === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-all"
                  >
                    Lanjut Input Jawaban →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {!result && students.length === 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-2 max-w-lg">
                      <button onClick={() => setAnsTab('file')} className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold ${ansTab === 'file' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-violet-300'}`}>
                        <FileSpreadsheet className="w-5 h-5" /> File Rekap (CSV)
                      </button>
                      <button onClick={() => setAnsTab('paste')} className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold ${ansTab === 'paste' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-violet-300'}`}>
                        <ClipboardPaste className="w-5 h-5" /> Tempel Teks
                      </button>
                      <button onClick={() => setAnsTab('photo')} className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold ${ansTab === 'photo' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-violet-300'}`}>
                        <ImageIcon className="w-5 h-5" /> Foto Lembar
                      </button>
                    </div>

                    {ansTab === 'file' && (
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><FileSpreadsheet className="w-4 h-4" /> File CSV/TXT (ekspor Google Form → Google Sheets → Download CSV)</label>
                        <input id="analyzer-csv-input" type="file" accept=".csv,.txt,text/csv,text/plain" className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                        <p className="text-xs text-slate-400 mt-1">Harus ada kolom "Nama". Kolom lain dibaca sebagai nomor soal.</p>
                      </div>
                    )}
                    {ansTab === 'paste' && (
                      <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6}
                        placeholder={'Contoh bebas:\nBudi: 1.A 2.C 3.B\nAni - 8A | 1.B 2.A ...\natau tempel langsung isi spreadsheet'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
                    )}
                    {ansTab === 'photo' && (
                      <div>
                        <input type="file" accept="image/*" capture="environment"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) readFileBase64(f, (b64, mime) => setPhoto({ base64: b64, mime, name: f.name })); }}
                          className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                        {photo && <p className="text-xs text-green-600 mt-1">Foto siap: {photo.name}</p>}
                      </div>
                    )}

                    <button onClick={handleParseAnswers} disabled={isWorking}
                      className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-all">
                      {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Baca Jawaban dengan AI
                    </button>
                  </>
                )}

                {students.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">KKM</label>
                        <input type="number" min={0} max={100} value={kkm} onChange={(e) => setKkm(e.target.value)} className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Kelas (opsional)</label>
                        <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="mis. 8A" className="w-28 px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Periksa hasil bacaan AI di tabel — perbaiki yang salah sebelum koreksi.
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto custom-scrollbar max-h-[38vh]">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 sticky left-0 bg-slate-50 min-w-[140px]">Nama Siswa</th>
                              {questions.map(q => (
                                <th key={q.number} className="px-1 py-2 text-center text-xs font-semibold text-slate-600 min-w-[56px]" title={q.question}>
                                  {q.number}{q.type === 'essay' ? '*' : ''}
                                </th>
                              ))}
                              <th className="px-2 py-2 w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {students.map((s, si) => (
                              <tr key={si}>
                                <td className="px-2 py-1 sticky left-0 bg-white">
                                  <input value={s.name} onChange={(e) => setStudents(prev => prev.map((x, i) => i === si ? { ...x, name: e.target.value } : x))} className="w-full border border-transparent hover:border-slate-200 focus:border-violet-400 rounded px-1 py-0.5 text-sm font-medium" />
                                </td>
                                {questions.map(q => (
                                  <td key={q.number} className="px-1 py-1">
                                    <input value={s.answers[String(q.number)] || ''} onChange={(e) => updateStudentAnswer(si, String(q.number), e.target.value)}
                                      className="w-full border border-slate-200 rounded px-1 py-0.5 text-xs text-center uppercase focus:border-violet-400" />
                                  </td>
                                ))}
                                <td className="px-2 py-1">
                                  <button onClick={() => setStudents(prev => prev.filter((_, i) => i !== si))} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">* = soal uraian (dikoreksi AI)</p>

                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setStep(2)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">← Kembali</button>
                      <button onClick={handleParseAnswers} disabled={isWorking} className="px-4 py-2 text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg">
                        Ganti Sumber Jawaban
                      </button>
                      <button onClick={handleAnalyze} disabled={isWorking}
                        className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-all shadow-button">
                        {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Koreksi &amp; Analisis Sekarang
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 4 && result && (() => {
              const st = result.stats;
              const distMax = Math.max(...Object.values(st.soloDist), 1);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
                      <p className="text-xs font-semibold text-violet-600 uppercase">Rata-rata</p>
                      <p className="text-2xl font-extrabold text-violet-700">{st.average}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                      <p className="text-xs font-semibold text-green-600 uppercase">Tuntas (KKM {st.kkm})</p>
                      <p className="text-2xl font-extrabold text-green-700">{st.tuntasCount}/{st.count}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 uppercase">Tertinggi</p>
                      <p className="text-2xl font-extrabold text-blue-700">{st.highest}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-xs font-semibold text-red-600 uppercase">Terendah</p>
                      <p className="text-2xl font-extrabold text-red-700">{st.lowest}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Distribusi Level Taksonomi SOLO</h3>
                    <div className="space-y-2">
                      {Object.entries(SOLO_NAMES).map(([k, label]) => {
                        const n = st.soloDist[k] || 0;
                        return (
                          <div key={k} className="flex items-center gap-2">
                            <span className="w-32 text-xs text-slate-600 shrink-0">{label}</span>
                            <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                              <div className="h-full bg-violet-500 rounded" style={{ width: `${(n / distMax) * 100}%`, minWidth: n > 0 ? '8px' : 0 }} />
                            </div>
                            <span className="w-10 text-right text-xs font-bold text-slate-700">{n}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <h3 className="text-sm font-bold text-slate-700 p-3 bg-slate-50 border-b border-slate-200">Daftar Nilai Siswa</h3>
                    <div className="overflow-x-auto custom-scrollbar max-h-[30vh]">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-2 text-left text-xs text-slate-600">Nama</th>
                            <th className="px-2 py-2 text-center text-xs text-slate-600">PG</th>
                            <th className="px-2 py-2 text-center text-xs text-slate-600">Nilai</th>
                            <th className="px-2 py-2 text-center text-xs text-slate-600">Status</th>
                            <th className="px-2 py-2 text-left text-xs text-slate-600">SOLO</th>
                            <th className="px-2 py-2 text-left text-xs text-slate-600">Catatan Uraian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.results.map((r, i) => (
                            <tr key={i}>
                              <td className="px-2 py-1.5 font-medium text-slate-700">{r.name}</td>
                              <td className="px-2 py-1.5 text-center text-xs">{r.pgTotal ? `${r.pgCorrect}/${r.pgTotal}` : '-'}</td>
                              <td className={`px-2 py-1.5 text-center font-bold ${r.tuntas ? 'text-green-600' : 'text-red-600'}`}>{r.value}</td>
                              <td className="px-2 py-1.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.tuntas ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.tuntas ? 'Tuntas' : 'Remedial'}</span>
                              </td>
                              <td className="px-2 py-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${soloBadge(r.solo)}`} title={r.soloReason}>{SOLO_NAMES[r.solo] || r.solo}</span>
                              </td>
                              <td className="px-2 py-1.5 text-xs text-slate-500 max-w-[220px] truncate" title={Object.entries(r.essayFeedback).map(([n, f]) => `No${n}: ${f}`).join('\n')}>
                                {Object.values(r.essayFeedback)[0] || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <h3 className="text-sm font-bold text-slate-700 p-3 bg-slate-50 border-b border-slate-200">Analisis Butir Soal</h3>
                    <div className="overflow-x-auto custom-scrollbar max-h-[24vh]">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-2 text-center text-xs text-slate-600">No</th>
                            <th className="px-2 py-2 text-center text-xs text-slate-600">Jenis</th>
                            <th className="px-2 py-2 text-left text-xs text-slate-600">Soal</th>
                            <th className="px-2 py-2 text-center text-xs text-slate-600">% Ketepatan</th>
                            <th className="px-2 py-2 text-center text-xs text-slate-600">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.itemAnalysis.map(it => (
                            <tr key={it.number}>
                              <td className="px-2 py-1.5 text-center text-slate-500">{it.number}</td>
                              <td className="px-2 py-1.5 text-center text-xs">{it.type === 'pg' ? 'PG' : 'Uraian'}</td>
                              <td className="px-2 py-1.5 text-xs text-slate-600 max-w-[280px] truncate" title={it.question}>{it.question}</td>
                              <td className={`px-2 py-1.5 text-center font-bold ${it.correctPct >= 75 ? 'text-green-600' : it.correctPct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{it.correctPct}%</td>
                              <td className="px-2 py-1.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.status === 'Baik' ? 'bg-green-100 text-green-700' : it.status === 'Sedang' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{it.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-violet-100 bg-violet-50/50 space-y-2 text-sm">
                    <h3 className="font-bold text-slate-700 mb-1">Rekomendasi AI</h3>
                    {result.narrative.analisisKlasikal && <p><b className="text-slate-700">Analisis Klasikal:</b> {result.narrative.analisisKlasikal}</p>}
                    {result.narrative.remedial && <p><b className="text-slate-700">Remedial:</b> {result.narrative.remedial}</p>}
                    {result.narrative.pengayaan && <p><b className="text-slate-700">Pengayaan:</b> {result.narrative.pengayaan}</p>}
                    {result.narrative.saranTindakLanjut && <p><b className="text-slate-700">Tindak Lanjut:</b> {result.narrative.saranTindakLanjut}</p>}
                    {result.narrative.catatanSoal.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1">
                        {result.narrative.catatanSoal.map(c => <li key={c.number}><b>Soal {c.number}:</b> {c.catatan}</li>)}
                      </ul>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setStep(3)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">← Ubah Jawaban</button>
                    <button onClick={resetAll} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Analisis Baru</button>
                    <button onClick={handleDownloadPDF} disabled={isDownloading}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-all shadow-button ml-auto">
                      <Download className="w-4 h-4" />
                      Unduh Laporan PDF
                    </button>
                  </div>
                </div>
              )})()}
            </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function LoadingOverlayLocal({ isVisible, message }: { isVisible: boolean; message: string }) {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3 shadow-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-sm font-semibold text-slate-700">{message}</p>
      </div>
    </div>
  );
}
