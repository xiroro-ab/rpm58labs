export interface RPMFormData {
  school: string;
  headmaster: string;
  headmasterNip: string;
  teacher: string;
  teacherNip: string;
  subject: string;
  phase: string;
  duration: string;
  topic: string;
  studentCharacteristics: string;
  learningMode: string;
  meetingCount: string;
  documentDate: string;
  learningModel: string;
  additionalContext?: string;
}

export interface ApiPayload {
  data: RPMFormData;
  customApiKey?: string;
  aiProvider?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  date: string;
  formData: RPMFormData;
  markdown: string;
}

export type QuestionType = 'pg' | 'essay';

export interface QuestionBankItem {
  number: number;
  type: QuestionType;
  question: string;
  options: string[];
  answer: string;
}

export interface StudentAnswers {
  name: string;
  answers: Record<string, string>;
}

export interface StudentResult {
  name: string;
  pgCorrect: number;
  pgTotal: number;
  essayScores: Record<string, number>;
  essayFeedback: Record<string, string>;
  value: number;
  tuntas: boolean;
  solo: string;
  soloReason: string;
}

export interface ItemAnalysis {
  number: number;
  type: QuestionType;
  question: string;
  correctPct: number;
  status: string;
}

export interface ClassStats {
  count: number;
  average: number;
  highest: number;
  lowest: number;
  tuntasCount: number;
  kkm: number;
  soloDist: Record<string, number>;
}

export interface AnalyzeResult {
  results: StudentResult[];
  stats: ClassStats;
  itemAnalysis: ItemAnalysis[];
  narrative: {
    analisisKlasikal: string;
    remedial: string;
    pengayaan: string;
    saranTindakLanjut: string;
    catatanSoal: { number: number; catatan: string }[];
  };
  reportHtml: string;
}

export interface AnalysisSession {
  id: string;
  title: string;
  date: string;
  kkm: number;
  className: string;
  meta: { subject: string; phase: string; teacher: string; school: string; headmaster: string };
  questions: QuestionBankItem[];
  students: StudentAnswers[];
  result: AnalyzeResult;
}
