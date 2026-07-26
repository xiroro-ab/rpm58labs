export interface ComplianceReport {
  score: number;
  overallStatus: 'pass' | 'warning' | 'fail';
  sections: ComplianceSection[];
  missingElements: string[];
  suggestions: string[];
}

export interface ComplianceSection {
  name: string;
  score: number;
  status: 'pass' | 'warning' | 'fail';
  items: ComplianceItem[];
}

export interface ComplianceItem {
  name: string;
  present: boolean;
  weight: number;
  detail?: string;
  suggestion?: string;
}

export interface CurriculumStandard {
  id: string;
  name: string;
  description: string;
  requiredElements: string[];
  phase: string;
}

export class ComplianceChecker {
  private standards: CurriculumStandard[] = [
    {
      id: 'fase-d',
      name: 'Fase D (Kelas 7-9)',
      description: 'Standar untuk Fase D - SMP',
      phase: 'Fase D',
      requiredElements: [
        'Capaian Pembelajaran',
        'Tujuan Pembelajaran',
        'Profil Pelajar Pancasila',
        'Asesmen Diagnostik',
        'Asesmen Formatif',
        'Asesmen Sumatif',
        'Kegiatan Pembelajaran Terstruktur',
        'Refleksi',
        'Diferensiasi Pembelajaran',
        'LKPD'
      ]
    },
    {
      id: 'umum',
      name: 'Standar Umum RPM',
      description: 'Standar minimum dokumen RPM',
      phase: 'Semua',
      requiredElements: [
        'Identitas Sekolah',
        'Kompetensi Awal',
        'Sarana Prasarana',
        'Target Peserta Didik',
        'Model Pembelajaran',
        'Moda Pembelajaran',
        'Alokasi Waktu',
        'Langkah Pembelajaran',
        'Media/Alat/Bahan',
        'Sumber Belajar',
        'Glosarium',
        'Daftar Pustaka'
      ]
    }
  ];

  checkCompliance(htmlContent: string, formPhase: string): ComplianceReport {
    const content = htmlContent.toLowerCase();
    const sections: ComplianceSection[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    const missingElements: string[] = [];
    const suggestions: string[] = [];

    // Check Kop Surat (Header)
    const kopSuratItems: ComplianceItem[] = [
      { name: 'Logo Sekolah/Pemerintah', present: content.includes('logo'), weight: 5 },
      { name: 'Nama Sekolah', present: content.includes('smp') || content.includes('sma') || content.includes('sd'), weight: 5 },
      { name: 'Alamat Sekolah', present: content.includes('alamat') || content.includes('jalan'), weight: 5 },
    ];
    sections.push(this.createSection('Kop Surat', kopSuratItems));

    // Check Identitas
    const identitasItems: ComplianceItem[] = [
      { name: 'Satuan Pendidikan', present: content.includes('satuan pendidikan'), weight: 5, suggestion: 'Tambahkan baris "Satuan Pendidikan" di tabel identitas' },
      { name: 'Mata Pelajaran', present: content.includes('mata pelajaran'), weight: 10, suggestion: 'Tambahkan informasi mata pelajaran' },
      { name: 'Fase/Kelas', present: content.includes('fase') || content.includes('kelas'), weight: 10, suggestion: 'Cantumkan fase dan kelas' },
      { name: 'Nama Guru', present: content.includes('guru') || content.includes('teacher'), weight: 5, suggestion: 'Tambahkan nama guru pengampu' },
      { name: 'Alokasi Waktu', present: content.includes('alokasi waktu') || content.includes('menit'), weight: 10, suggestion: 'Cantumkan alokasi waktu pembelajaran' },
    ];
    sections.push(this.createSection('Identitas', identitasItems));

    // Check Desain Pembelajaran
    const desainItems: ComplianceItem[] = [
      { name: 'Capaian Pembelajaran (CP)', present: content.includes('capaian pembelajaran'), weight: 15, suggestion: 'Rumuskan Capaian Pembelajaran yang sesuai fase' },
      { name: 'Tujuan Pembelajaran (TP)', present: content.includes('tujuan pembelajaran'), weight: 15, suggestion: 'Tuliskan Tujuan Pembelajaran yang spesifik' },
      { name: 'Profil Pelajar Pancasila', present: content.includes('profil pelajar') || content.includes('pancasila') || content.includes('profil lulusan') || content.includes('gotong royong') || content.includes('kreatif') || content.includes('bernalar kritis') || content.includes('mandiri') || content.includes('berkebinekaan') || content.includes('beriman'), weight: 10, suggestion: 'Sebutkan dimensi Profil Pelajar Pancasila yang relevan (beriman, gotong royong, kreatif, bernalar kritis, mandiri, berkebinekaan global)' },
      { name: 'Model Pembelajaran', present: content.includes('model pembelajaran') || content.includes('pbl') || content.includes('model'), weight: 10, suggestion: 'Tentukan model pembelajaran yang digunakan (PBL, PjBL, dll)' },
      { name: 'Strategi & Metode', present: content.includes('strategi') || content.includes('metode'), weight: 5 },
    ];
    sections.push(this.createSection('Desain Pembelajaran', desainItems));

    // Check Pengalaman Belajar
    const pengalamanItems: ComplianceItem[] = [
      { name: 'Kegiatan Awal (Pendahuluan)', present: content.includes('kegiatan awal') || content.includes('pendahuluan'), weight: 10, suggestion: 'Tambahkan kegiatan pendahuluan/apersepsi' },
      { name: 'Kegiatan Inti (Sintaks Model)', present: content.includes('kegiatan inti'), weight: 15, suggestion: 'Jabarkan sintaks model pembelajaran secara lengkap' },
      { name: 'Kegiatan Penutup', present: content.includes('kegiatan penutup'), weight: 10, suggestion: 'Tambahkan kegiatan penutup dan refleksi' },
      { name: 'Alokasi Waktu per Kegiatan', present: content.includes('menit'), weight: 10, suggestion: 'Cantumkan alokasi menit untuk setiap kegiatan' },
      { name: 'Label Deep Learning', present: content.includes('mindful') || content.includes('meaningful') || content.includes('joyful'), weight: 5, suggestion: 'Sempatkan label Mindful/Meaningful/Joyful' },
    ];
    sections.push(this.createSection('Pengalaman Belajar', pengalamanItems));

    // Check Asesmen
    const asesmenItems: ComplianceItem[] = [
      { name: 'Asesmen Diagnostik', present: content.includes('asesmen diagnostik') || content.includes('asesmen awal'), weight: 15, suggestion: 'Tambahkan asesmen diagnostik/awal' },
      { name: 'Asesmen Formatif', present: content.includes('asesmen formatif') || content.includes('asesmen proses'), weight: 15, suggestion: 'Tambahkan asesmen formatif selama proses' },
      { name: 'Asesmen Sumatif', present: content.includes('asesmen sumatif') || content.includes('asesmen akhir'), weight: 15, suggestion: 'Tambahkan asesmen sumatif/akhir' },
      { name: 'Kunci Jawaban', present: content.includes('kunci jawaban'), weight: 10, suggestion: 'Sertakan kunci jawaban untuk soal PG' },
      { name: 'Rubrik Penilaian', present: content.includes('rubrik'), weight: 10, suggestion: 'Tambahkan rubrik penilaian' },
    ];
    sections.push(this.createSection('Asesmen', asesmenItems));

    // Check Refleksi & Lampiran
    const reflektifItems: ComplianceItem[] = [
      { name: 'Refleksi Guru', present: content.includes('refleksi guru') || content.includes('refleksi pendidik'), weight: 10, suggestion: 'Tambahkan refleksi untuk guru' },
      { name: 'Refleksi Peserta Didik', present: content.includes('refleksi peserta didik'), weight: 10, suggestion: 'Tambahkan refleksi untuk siswa' },
      { name: 'LKPD (Lembar Kerja)', present: content.includes('lkpd') || content.includes('lembar kerja'), weight: 10, suggestion: 'Lampirkan Lembar Kerja Peserta Didik' },
      { name: 'Bahan Bacaan/Materi', present: content.includes('bahan bacaan') || content.includes('materi pengayaan'), weight: 5, suggestion: 'Tambahkan bahan bacaan atau materi pengayaan' },
    ];
    sections.push(this.createSection('Refleksi & Lampiran', reflektifItems));

    // Calculate scores
    sections.forEach(section => {
      section.items.forEach(item => {
        totalWeight += item.weight;
        if (item.present) totalScore += item.weight;
        if (!item.present) {
          missingElements.push(item.name);
          if (item.suggestion) suggestions.push(item.suggestion);
        }
      });
    });

    const overallScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
    let overallStatus: 'pass' | 'warning' | 'fail';
    
    if (overallScore >= 80) overallStatus = 'pass';
    else if (overallScore >= 50) overallStatus = 'warning';
    else overallStatus = 'fail';

    // Add suggestions based on phase
    if (formPhase.includes('D')) {
      const phaseStandard = this.standards.find(s => s.id === 'fase-d');
      if (phaseStandard) {
        phaseStandard.requiredElements.forEach(elem => {
          if (!content.includes(elem.toLowerCase())) {
            suggestions.push(`Standar Fase D membutuhkan: ${elem}`);
          }
        });
      }
    }

    // General curriculum suggestions
    if (overallScore < 80) {
      suggestions.push('Dokumen RPM belum memenuhi standar minimum. Silakan lengkapi komponen yang kurang.');
    }

    return {
      score: overallScore,
      overallStatus,
      sections,
      missingElements: [...new Set(missingElements)],
      suggestions: [...new Set(suggestions)]
    };
  }

  private createSection(name: string, items: ComplianceItem[]): ComplianceSection {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const earnedWeight = items.filter(i => i.present).reduce((sum, item) => sum + item.weight, 0);
    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    let status: 'pass' | 'warning' | 'fail';
    if (score >= 80) status = 'pass';
    else if (score >= 50) status = 'warning';
    else status = 'fail';

    return { name, score, status, items };
  }

  getGradeLabel(score: number): string {
    if (score >= 90) return 'Sangat Baik (A)';
    if (score >= 80) return 'Baik (B)';
    if (score >= 65) return 'Cukup (C)';
    if (score >= 50) return 'Kurang (D)';
    return 'Sangat Kurang (E)';
  }

  getGradeColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  getGradeBg(score: number): string {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 65) return 'bg-blue-100 border-blue-300';
    if (score >= 50) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  }
}

export const complianceChecker = new ComplianceChecker();
