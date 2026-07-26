import { Template, RPMFormData } from '../types';

export class TemplateManager {
  private storageKey = 'rpm_templates';
  
  getDefaultTemplates(): Template[] {
    return [
      {
        id: 'template-pbl-informatika',
        name: 'PBL - Informatika Kelas 7',
        description: 'Template Problem Based Learning untuk mata pelajaran Informatika fase D',
        category: 'Informatika',
        isCustom: false,
        createdAt: new Date().toISOString(),
        formData: {
          subject: 'Informatika',
          phase: 'Fase D (Kelas 7)',
          learningMode: 'Luring (Tatap Muka)',
          meetingCount: '2',
          learningModel: 'Problem Based Learning (PBL)',
          duration: '4 x 40 Menit',
          studentCharacteristics: 'Siswa aktif, senang berdiskusi, dan tertarik dengan teknologi'
        }
      },
      {
        id: 'template-pjbl-informatika',
        name: 'PjBL - Project Informatika',
        description: 'Template Project Based Learning untuk proyek pemrograman',
        category: 'Informatika',
        isCustom: false,
        createdAt: new Date().toISOString(),
        formData: {
          subject: 'Informatika',
          phase: 'Fase D (Kelas 8)',
          learningMode: 'Blended Learning',
          meetingCount: '4',
          learningModel: 'Project Based Learning (PjBL)',
          duration: '8 x 40 Menit',
          studentCharacteristics: 'Siswa kreatif, mampu bekerja dalam tim, dan memiliki dasar pemrograman'
        }
      },
      {
        id: 'template-discovery-umum',
        name: 'Discovery Learning - Umum',
        description: 'Template Discovery Learning untuk berbagai mata pelajaran',
        category: 'Umum',
        isCustom: false,
        createdAt: new Date().toISOString(),
        formData: {
          learningMode: 'Luring (Tatap Muka)',
          meetingCount: '2',
          learningModel: 'Discovery Learning',
          duration: '4 x 40 Menit',
          studentCharacteristics: 'Siswa aktif dan memiliki rasa ingin tahu tinggi'
        }
      },
      {
        id: 'template-daring',
        name: 'Pembelajaran Daring/Online',
        description: 'Template khusus untuk pembelajaran online menggunakan platform digital',
        category: 'Daring',
        isCustom: false,
        createdAt: new Date().toISOString(),
        formData: {
          learningMode: 'Daring (Online)',
          meetingCount: '3',
          duration: '3 x 40 Menit',
          studentCharacteristics: 'Siswa memiliki akses internet dan perangkat digital',
          additionalContext: 'Pembelajaran dilakukan via Google Meet/Zoom dengan breakout rooms untuk diskusi kelompok'
        }
      }
    ];
  }
  
  getAllTemplates(): Template[] {
    const custom = this.getCustomTemplates();
    const defaults = this.getDefaultTemplates();
    return [...defaults, ...custom];
  }
  
  getCustomTemplates(): Template[] {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }
  
  saveCustomTemplate(name: string, description: string, category: string, formData: RPMFormData): Template {
    const template: Template = {
      id: `custom-${Date.now()}`,
      name,
      description,
      category,
      formData,
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    
    const templates = this.getCustomTemplates();
    templates.unshift(template);
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
    
    return template;
  }
  
  deleteTemplate(id: string): void {
    const templates = this.getCustomTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }
  
  getTemplateById(id: string): Template | null {
    const all = this.getAllTemplates();
    return all.find(t => t.id === id) || null;
  }
  
  searchTemplates(query: string): Template[] {
    const all = this.getAllTemplates();
    const lowerQuery = query.toLowerCase();
    return all.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
    );
  }
  
  getTemplatesByCategory(category: string): Template[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }
  
  getCategories(): string[] {
    const templates = this.getAllTemplates();
    const categories = new Set(templates.map(t => t.category));
    return Array.from(categories);
  }
}

export const templateManager = new TemplateManager();
