import React, { useState, useEffect } from 'react';
import { X, BookTemplate, Search, Plus, Trash2, Download, Upload, Star, Filter } from 'lucide-react';
import { Template, RPMFormData } from '../types';
import { templateManager } from '../lib/templateManager';
import toast from 'react-hot-toast';

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (formData: Partial<RPMFormData>) => void;
  currentFormData?: RPMFormData;
}

export function TemplateLibrary({ isOpen, onClose, onSelectTemplate, currentFormData }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [categories, setCategories] = useState<string[]>([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = () => {
    const allTemplates = templateManager.getAllTemplates();
    setTemplates(allTemplates);
    const cats = ['Semua', ...templateManager.getCategories()];
    setCategories(cats);
  };

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template.formData);
    toast.success(`Template "${template.name}" berhasil dimuat!`);
    onClose();
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!currentFormData) {
      toast.error('Tidak ada data form untuk disimpan sebagai template');
      return;
    }

    if (!newTemplate.name.trim()) {
      toast.error('Nama template harus diisi!');
      return;
    }

    try {
      const saved = templateManager.saveCustomTemplate(
        newTemplate.name,
        newTemplate.description || 'Template custom',
        newTemplate.category || 'Custom',
        currentFormData
      );
      
      toast.success('Template berhasil disimpan!');
      setIsCreatingTemplate(false);
      setNewTemplate({ name: '', description: '', category: '' });
      loadTemplates();
    } catch (error) {
      toast.error('Gagal menyimpan template');
    }
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Hapus template ini?')) {
      templateManager.deleteTemplate(id);
      toast.success('Template dihapus');
      loadTemplates();
    }
  };

  const handleExportTemplate = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `template_${template.name.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Template berhasil diekspor!');
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as Template;
        const saved = templateManager.saveCustomTemplate(
          imported.name + ' (Imported)',
          imported.description,
          imported.category,
          imported.formData as RPMFormData
        );
        toast.success('Template berhasil diimpor!');
        loadTemplates();
      } catch (error) {
        toast.error('File template tidak valid!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredTemplates = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'Semua' || t.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <BookTemplate className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Template Library</h2>
              <p className="text-xs text-slate-500 mt-0.5">Mulai cepat dengan template siap pakai</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
              />
            </div>
            <button
              onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Simpan Sebagai Template
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" />
              Import
              <input type="file" accept=".json" onChange={handleImportTemplate} className="hidden" />
            </label>
          </div>

          {isCreatingTemplate && (
            <div className="bg-white border border-purple-200 rounded-lg p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <h3 className="font-semibold text-sm text-slate-800">Buat Template Baru dari Form Saat Ini</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nama Template *"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Kategori (mis: Informatika)"
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Deskripsi singkat"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsCreatingTemplate(false)}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveCurrentAsTemplate}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors"
                >
                  Simpan Template
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                    selectedCategory === cat
                      ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookTemplate className="w-16 h-16 mb-4 opacity-20 mx-auto" />
              <p className="text-sm">Tidak ada template ditemukan.</p>
              <p className="text-xs mt-1">Coba ubah filter atau buat template baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div 
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="group relative bg-white border border-slate-200 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:border-purple-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${
                        template.isCustom 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {template.isCustom ? 'Custom' : 'Default'}
                      </span>
                      <span className="px-2 py-1 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-md">
                        {template.category}
                      </span>
                    </div>
                    {template.isCustom && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleExportTemplate(template, e)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Export template"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTemplate(template.id, e)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-sm mb-2 line-clamp-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="space-y-1.5 mb-3">
                    {template.formData.subject && (
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">Mapel:</span> {template.formData.subject}
                      </div>
                    )}
                    {template.formData.phase && (
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">Fase:</span> {template.formData.phase}
                      </div>
                    )}
                    {template.formData.learningModel && (
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">Model:</span> {template.formData.learningModel}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100">
                    Dibuat: {new Date(template.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
