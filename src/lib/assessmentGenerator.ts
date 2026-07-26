export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'essay' | 'true_false';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  bloomLevel?: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
  points?: number;
}

export interface AssessmentBank {
  id: string;
  subject: string;
  topic: string;
  phase: string;
  questions: AssessmentQuestion[];
  createdAt: string;
}

export class AssessmentGenerator {
  private storageKey = 'rpm_assessment_bank';
  
  getAssessmentBank(): AssessmentBank[] {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }
  
  saveAssessmentBank(bank: AssessmentBank): void {
    const banks = this.getAssessmentBank();
    banks.unshift(bank);
    localStorage.setItem(this.storageKey, JSON.stringify(banks.slice(0, 100))); // Keep max 100
  }
  
  searchQuestions(subject?: string, topic?: string, bloomLevel?: string): AssessmentQuestion[] {
    const banks = this.getAssessmentBank();
    let allQuestions: AssessmentQuestion[] = [];
    
    banks.forEach(bank => {
      if (subject && !bank.subject.toLowerCase().includes(subject.toLowerCase())) return;
      if (topic && !bank.topic.toLowerCase().includes(topic.toLowerCase())) return;
      
      let questions = bank.questions;
      if (bloomLevel) {
        questions = questions.filter(q => q.bloomLevel === bloomLevel);
      }
      
      allQuestions.push(...questions);
    });
    
    return allQuestions;
  }
  
  generateAssessmentPrompt(
    subject: string,
    topic: string,
    phase: string,
    assessmentType: 'diagnostik' | 'formatif' | 'sumatif',
    questionCount: number = 10,
    bloomLevels: string[] = ['C1', 'C2', 'C3', 'C4']
  ): string {
    const bloomDescription = {
      C1: 'Mengingat (Remember)',
      C2: 'Memahami (Understand)',
      C3: 'Menerapkan (Apply)',
      C4: 'Menganalisis (Analyze)',
      C5: 'Mengevaluasi (Evaluate)',
      C6: 'Mencipta (Create)'
    };
    
    const selectedLevels = bloomLevels.map(level => `${level}: ${bloomDescription[level]}`).join(', ');
    
    return `Buatkan ${questionCount} soal asesmen ${assessmentType} untuk:
- Mata Pelajaran: ${subject}
- Topik: ${topic}
- Fase/Kelas: ${phase}

INSTRUKSI PENTING:
1. Distribusi Bloom's Taxonomy: ${selectedLevels}
2. Format soal pilihan ganda dengan 4 opsi (A, B, C, D)
3. Soal harus kontekstual dan relevan dengan kehidupan sehari-hari siswa
4. Setiap soal harus mengukur kompetensi yang berbeda
5. WAJIB sertakan KUNCI JAWABAN lengkap di akhir

FORMAT OUTPUT (HTML):
<div style="border: 1px solid #000; padding: 15px; margin-bottom: 15px; border-radius: 0 0 4px 4px;">
  <h4 style="color: #1a4185; margin-top: 0; margin-bottom: 10px; font-family: 'IBM Plex Sans', sans-serif; text-transform: uppercase;">SOAL ASESMEN ${assessmentType.toUpperCase()}</h4>
  
  <ol style="margin-bottom: 20px;">
    <li style="margin-bottom: 15px;">
      <p><b>[Soal 1 - Level Bloom C?]</b></p>
      <p>[Narasi soal yang kontekstual]</p>
      <ol type="A" style="margin-left: 20px;">
        <li>[Opsi A]</li>
        <li>[Opsi B]</li>
        <li>[Opsi C]</li>
        <li>[Opsi D]</li>
      </ol>
    </li>
    <!-- Ulangi untuk soal lainnya -->
  </ol>
  
  <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 15px; margin-top: 20px;">
    <h5 style="color: #0369a1; margin-top: 0; margin-bottom: 10px;">🔑 KUNCI JAWABAN</h5>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
      <tr style="background-color: #0ea5e9; color: white;">
        <th style="border: 1px solid #000; padding: 8px; text-align: center;">No</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center;">Jawaban</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center;">Bloom Level</th>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">1</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;"><b>[A/B/C/D]</b></td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">[C1/C2/C3/C4]</td>
      </tr>
      <!-- Ulangi untuk soal lainnya -->
    </table>
  </div>
</div>

Gunakan HTML sesuai format di atas. JANGAN gunakan markdown code block.`;
  }
  
  parseGeneratedQuestions(htmlContent: string, subject: string, topic: string, phase: string): AssessmentQuestion[] {
    const questions: AssessmentQuestion[] = [];
    
    // Simple parsing - in real implementation, you might use DOMParser
    const questionMatches = htmlContent.match(/<li[^>]*>[\s\S]*?<\/li>/gi);
    
    if (questionMatches) {
      questionMatches.forEach((match, index) => {
        const question: AssessmentQuestion = {
          id: `q-${Date.now()}-${index}`,
          type: 'multiple_choice',
          question: match,
          points: 10
        };
        questions.push(question);
      });
    }
    
    return questions;
  }
  
  exportToJSON(questions: AssessmentQuestion[]): string {
    return JSON.stringify(questions, null, 2);
  }
  
  importFromJSON(json: string): AssessmentQuestion[] {
    try {
      return JSON.parse(json);
    } catch (e) {
      throw new Error('Format JSON tidak valid');
    }
  }
}

export const assessmentGenerator = new AssessmentGenerator();
