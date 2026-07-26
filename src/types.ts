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
