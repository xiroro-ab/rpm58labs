import React, { useState, useEffect } from 'react';
import { RPMFormData } from '../types';
import toast from 'react-hot-toast';

const PREDEFINED_MODELS = [
  'Auto (Biar AI yang memilih)',
  'Problem Based Learning (PBL)',
  'Project Based Learning (PjBL)',
  'Discovery Learning',
  'Inquiry Learning',
  'Direct Instruction'
];

interface FormRPMProps {
  onSubmit: (data: RPMFormData) => void;
  isLoading: boolean;
}

export default function FormRPM({ onSubmit, isLoading }: FormRPMProps) {
  const [formData, setFormData] = useState<RPMFormData>(() => {
    const saved = localStorage.getItem('rpmFormData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved form data', e);
      }
    }
    return {
    school: '',
    headmaster: '',
    headmasterNip: '',
    teacher: '',
    teacherNip: '',
    subject: '',
    phase: 'Fase D (Kelas 7)',
    duration: '',
    topic: '',
    studentCharacteristics: '',
    learningMode: 'Luring (Tatap Muka)',
    meetingCount: '1',
    documentDate: new Date().toISOString().split('T')[0],
    learningModel: 'Problem Based Learning (PBL)',
    learningModelPhases: '',
    additionalContext: '',
  };
  });

  const isModelCustom = formData.learningModel ? !PREDEFINED_MODELS.includes(formData.learningModel) : false;

  useEffect(() => {
    localStorage.setItem('rpmFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading) {
          const form = document.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetForm = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-slate-800">Apakah Anda yakin ingin menghapus semua data form?</span>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              setFormData({
                school: '',
                headmaster: '',
                headmasterNip: '',
                teacher: '',
                teacherNip: '',
                subject: '',
                phase: 'Fase D (Kelas 7)',
                duration: '',
                topic: '',
                studentCharacteristics: '',
                learningMode: 'Luring (Tatap Muka)',
                meetingCount: '1',
                documentDate: new Date().toISOString().split('T')[0],
                learningModel: 'Problem Based Learning (PBL)',
                learningModelPhases: '',
                additionalContext: '',
              });
              localStorage.removeItem('rpmFormData');
              toast.success('Formulir berhasil dibersihkan', { icon: '🧹' });
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-md hover:bg-primary-dark transition-colors"
          >
            Hapus
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Data Identitas
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <input required type="text"
              name="school"
              value={formData.school}
              onChange={handleChange}
              placeholder="Nama Sekolah (mis: SMPN 58 Palembang)"
              className="w-full px-4 py-3 border border-warm-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input transition-all shadow-card"
            />
            
            <div className="bg-white border-l-4 border-primary/20 p-4 rounded-xl shadow-card transition-all hover:border-primary/40">
              <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2 block">Kepala Sekolah</span>
              <div className="grid grid-cols-1 gap-3">
                <input required type="text"
                  name="headmaster"
                  value={formData.headmaster}
                  onChange={handleChange}
                  placeholder="Nama Kepala Sekolah"
                  className="w-full px-3 py-2 border border-warm-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input transition-colors"
                />
                <input required type="text"
                  name="headmasterNip"
                  value={formData.headmasterNip}
                  onChange={handleChange}
                  placeholder="NIP Kepala Sekolah"
                  className="w-full px-3 py-2 border border-warm-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input transition-colors"
                />
              </div>
            </div>

            <div className="bg-white border-l-4 border-primary/20 p-4 rounded-xl shadow-card transition-all hover:border-primary/40">
               <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2 block">Guru Mata Pelajaran</span>
               <div className="grid grid-cols-1 gap-3">
                 <input required type="text"
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleChange}
                  placeholder="Nama Guru"
                  className="w-full px-3 py-2 border border-warm-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input transition-colors"
                />
                <input required type="text"
                  name="teacherNip"
                  value={formData.teacherNip}
                  onChange={handleChange}
                  placeholder="NIP Guru"
                  className="w-full px-3 py-2 border border-warm-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input transition-colors"
                />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input required type="text"
                name="subject"
                
                value={formData.subject}
                onChange={handleChange}
                placeholder="Mapel"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <select required name="phase"
                
                value={formData.phase}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Fase D (Kelas 7)">Fase D (Kelas 7)</option>
                <option value="Fase D (Kelas 8)">Fase D (Kelas 8)</option>
                <option value="Fase D (Kelas 9)">Fase D (Kelas 9)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input required type="text"
                name="duration"
                
                value={formData.duration}
                onChange={handleChange}
                placeholder="Alokasi Waktu (Misal: 2 x 45 Menit)"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="relative">
                <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-slate-500">Tanggal TTD</span>
                <input required type="date"
                  name="documentDate"
                  
                  value={formData.documentDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/><path d="M8 15h6"/></svg>
            Konten & Karakteristik
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <select required name="learningMode"
              
              value={formData.learningMode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Luring (Tatap Muka)">Luring (Tatap Muka)</option>
              <option value="Daring (Online)">Daring (Online)</option>
              <option value="Blended Learning">Blended Learning</option>
            </select>
            <div className="relative">
              <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-slate-500">Jumlah Pertemuan</span>
              <input
                type="number"
                name="meetingCount"
                required
                min="1"
                max="20"
                value={formData.meetingCount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          <select required name="learningModelSelect"
            value={isModelCustom ? 'custom' : formData.learningModel}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                handleChange({ target: { name: 'learningModel', value: '' } } as any);
              } else {
                handleChange({ target: { name: 'learningModel', value: e.target.value } } as any);
                handleChange({ target: { name: 'learningModelPhases', value: '' } } as any);
              }
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {PREDEFINED_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            <option value="custom">Lainnya (Ketik Manual)...</option>
          </select>
          {isModelCustom && (
            <div className="space-y-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-top-2">
              <input required type="text"
                name="learningModel"
                value={formData.learningModel}
                onChange={handleChange}
                placeholder="Nama Model Pembelajaran (Misal: Jigsaw)"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
              <textarea
                name="learningModelPhases"
                value={formData.learningModelPhases || ''}
                onChange={handleChange}
                placeholder="Fase/Sintaks Model (Opsional). Misal: 1. Orientasi, 2. Kelompok..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
              <p className="text-[10.5px] text-blue-600/80 leading-tight">
                *Opsional: Jika AI tidak tahu urutan fase dari model ini (misal karena model baru), silakan tulis urutan fasenya agar AI dapat menuliskannya dengan benar.
              </p>
            </div>
          )}
          <input required type="text"
            name="topic"
            
            value={formData.topic}
            onChange={handleChange}
            placeholder="Materi Pelajaran"
            className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <textarea required
            name="studentCharacteristics"
            
            rows={2}
            value={formData.studentCharacteristics}
            onChange={handleChange}
            placeholder="Karakteristik Siswa (misal: visual, senang diskusi grup)"
            className="w-full px-3 py-2 border border-slate-200 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <textarea
            name="additionalContext"
            rows={2}
            value={formData.additionalContext || ''}
            onChange={handleChange}
            placeholder="Konteks Tambahan (Kejadian sekitar, dll) - Opsional"
            className="w-full px-3 py-2 border border-slate-200 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

            <div className="p-6 border-t border-warm-border bg-white mt-auto flex flex-col gap-3 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.06)] relative z-20">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-lg shadow-button hover:shadow-button-hover transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              Generate RPM Baru
            </>
          )}
        </button>
        
        <button
          type="button"
          onClick={handleResetForm}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 font-medium rounded-lg hover:bg-slate-200 transition-all text-sm"
        >
          Bersihkan Form
        </button>
        
        <div className="text-center text-[10px] text-slate-400 mt-2">
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Ctrl</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Shift</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Enter</kbd>
          {' untuk generate cepat'}
        </div>
      </div>
    </form>
  );
}
