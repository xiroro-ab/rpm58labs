import React, { useState, useEffect } from 'react';
import { RPMFormData } from '../types';
import toast from 'react-hot-toast';

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
    additionalContext: '',
  };
  });

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
        <span className="text-sm font-medium text-slate-800 dark:text-gray-100">Apakah Anda yakin ingin menghapus semua data form?</span>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-gray-700 rounded-md hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
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
                additionalContext: '',
              });
              localStorage.removeItem('rpmFormData');
              toast.success('Formulir berhasil dibersihkan', { icon: '🧹' });
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-primary dark:bg-blue-600 rounded-md hover:bg-primary-dark dark:hover:bg-blue-500 transition-colors"
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
      <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar dark:bg-gray-900 dark:text-gray-100">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary dark:text-blue-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Data Identitas
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <span className="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Nama Sekolah</span>
              <input required type="text"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="mis: SMPN 58 Palembang"
                className="w-full px-4 py-3 border border-warm-border dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input dark:bg-gray-800 dark:text-gray-100 transition-all shadow-card hover:shadow-card-hover"
              />
            </div>
            
            <div className="bg-white dark:bg-gray-800 border-l-4 border-primary/20 dark:border-blue-500/30 p-4 rounded-xl shadow-card hover:shadow-card-hover transition-all">
              <span className="text-[10px] font-bold text-primary/70 dark:text-blue-400 uppercase tracking-wider mb-2 block">Kepala Sekolah</span>
              <div className="grid grid-cols-1 gap-3">
                <input required type="text"
                  name="headmaster"
                  value={formData.headmaster}
                  onChange={handleChange}
                  placeholder="Nama Kepala Sekolah"
                  className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-700 dark:text-gray-100 transition-all hover:shadow-card-hover"
                />
                <input required type="text"
                  name="headmasterNip"
                  value={formData.headmasterNip}
                  onChange={handleChange}
                  placeholder="NIP Kepala Sekolah"
                  className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-700 dark:text-gray-100 transition-all hover:shadow-card-hover"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border-l-4 border-primary-light/20 dark:border-blue-400/30 p-4 rounded-xl shadow-card hover:shadow-card-hover transition-all">
               <span className="text-[10px] font-bold text-primary/70 dark:text-blue-400 uppercase tracking-wider mb-2 block">Guru Mata Pelajaran</span>
               <div className="grid grid-cols-1 gap-3">
                 <input required type="text"
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleChange}
                  placeholder="Nama Guru"
                  className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-700 dark:text-gray-100 transition-all hover:shadow-card-hover"
                />
                <input required type="text"
                  name="teacherNip"
                  value={formData.teacherNip}
                  onChange={handleChange}
                  placeholder="NIP Guru"
                  className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-700 dark:text-gray-100 transition-all hover:shadow-card-hover"
                />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute -top-2 left-2 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Mata Pelajaran</span>
                <input required type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Informatika"
                  className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input dark:bg-gray-800 dark:text-gray-100 transition-all hover:shadow-card-hover"
                />
              </div>
              <div className="relative">
                <span className="absolute -top-2 left-2 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Fase / Kelas</span>
                <select required name="phase"
                  value={formData.phase}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm bg-input dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all hover:shadow-card-hover"
                >
                  <option value="Fase D (Kelas 7)">Fase D (Kelas 7)</option>
                  <option value="Fase D (Kelas 8)">Fase D (Kelas 8)</option>
                  <option value="Fase D (Kelas 9)">Fase D (Kelas 9)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute -top-2 left-2 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Alokasi Waktu</span>
                <input required type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="Misal: 2 x 45 Menit"
                  className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input dark:bg-gray-800 dark:text-gray-100 transition-all hover:shadow-card-hover"
                />
              </div>
              <div className="relative">
                <span className="absolute -top-2 left-2 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Tanggal TTD</span>
                <input required type="date"
                  name="documentDate"
                  value={formData.documentDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input dark:bg-gray-800 dark:text-gray-100 transition-all hover:shadow-card-hover"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary dark:text-blue-400"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/><path d="M8 15h6"/></svg>
            Konten & Karakteristik
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute -top-2 left-2 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Moda Pembelajaran</span>
              <select required name="learningMode"
                value={formData.learningMode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm bg-input dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all hover:shadow-card-hover"
              >
                <option value="Luring (Tatap Muka)">Luring (Tatap Muka)</option>
                <option value="Daring (Online)">Daring (Online)</option>
                <option value="Blended Learning">Blended Learning</option>
              </select>
            </div>
            <div className="relative">
              <span className="absolute -top-2 left-2 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Jumlah Pertemuan</span>
              <input
                type="number"
                name="meetingCount"
                required
                min="1"
                max="20"
                value={formData.meetingCount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input dark:bg-gray-800 dark:text-gray-100 transition-all hover:shadow-card-hover"
              />
            </div>
          </div>
          <div className="relative">
            <span className="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Model Pembelajaran</span>
            <select required name="learningModel"
              value={formData.learningModel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm bg-input dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all hover:shadow-card-hover"
            >
              <option value="Auto (Biar AI yang memilih)">Auto (Biar AI yang memilih)</option>
              <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
              <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
              <option value="Discovery Learning">Discovery Learning</option>
              <option value="Inquiry Learning">Inquiry Learning</option>
              <option value="Direct Instruction">Direct Instruction</option>
            </select>
          </div>
          <div className="relative">
            <span className="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Materi Pelajaran</span>
            <input required type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="Materi Pelajaran"
              className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input dark:bg-gray-800 dark:text-gray-100 transition-all hover:shadow-card-hover"
            />
          </div>
          <div className="relative">
            <span className="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Karakteristik Siswa</span>
            <textarea required
              name="studentCharacteristics"
              rows={2}
              value={formData.studentCharacteristics}
              onChange={handleChange}
              placeholder="misal: visual, senang diskusi grup"
              className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input dark:bg-gray-800 dark:text-gray-100 transition-all hover:shadow-card-hover"
            />
          </div>
          <div className="relative">
            <span className="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[10px] font-semibold text-slate-500 dark:text-gray-400 z-10">Konteks Tambahan</span>
            <textarea
              name="additionalContext"
              rows={2}
              value={formData.additionalContext || ''}
              onChange={handleChange}
              placeholder="Kejadian sekitar, dll - Opsional"
              className="w-full px-3 py-2 border border-warm-border dark:border-gray-600 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-input dark:bg-gray-800 dark:text-gray-100 transition-all hover:shadow-card-hover"
            />
          </div>
        </div>
      </div>

            <div className="p-6 border-t border-warm-border dark:border-gray-700 bg-white dark:bg-gray-900 mt-auto flex flex-col gap-3 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.2)] relative z-20">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary-light dark:from-blue-600 dark:to-blue-500 text-white font-bold rounded-lg shadow-button hover:shadow-button-hover transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
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
          className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 dark:text-gray-400 font-medium rounded-lg hover:bg-warm dark:hover:bg-gray-700 hover:text-primary dark:hover:text-blue-400 transition-all text-sm"
        >
          Bersihkan Form
        </button>
        
        <div className="text-center text-[10px] text-slate-400 dark:text-gray-500 mt-2">
          <kbd className="px-1.5 py-0.5 bg-warm dark:bg-gray-700 border border-warm-border dark:border-gray-600 rounded text-[9px] font-mono">Ctrl</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 bg-warm dark:bg-gray-700 border border-warm-border dark:border-gray-600 rounded text-[9px] font-mono">Shift</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 bg-warm dark:bg-gray-700 border border-warm-border dark:border-gray-600 rounded text-[9px] font-mono">Enter</kbd>
          {' untuk generate cepat'}
        </div>
      </div>
    </form>
  );
}