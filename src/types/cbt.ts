export interface Question {
  id: number;
  number: number;
  text: string;
  stimulus?: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  subject: string;
  topic: string;
}

export type TestSessionStatus = 'active' | 'inactive' | 'archived';

export interface ExamConfig {
  id: string;
  testCode: string;
  educationLevel: string;
  grade: string;
  subject: string;
  questionCount: number;
  durationMinutes: number;
  isTokenActive: boolean;
  token: string;
  tokenGeneratedAt: string;
  determinationMode: 'auto' | 'manual';
  materialTopics: [string, string, string];
  status: TestSessionStatus;
  createdAt: string;
  questions: Question[];
}

export type StudentStatus = 'idle' | 'in_progress' | 'completed' | 'blocked';

export interface Student {
  id: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  grade: string;
  testCode?: string;
  status: StudentStatus;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  answeredCount: number;
  totalQuestions: number;
  startTime?: string;
  endTime?: string;
  remainingSeconds: number;
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  flagged: Record<number, boolean>;
  ipAddress?: string;
  isDemo?: boolean;
}

export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  nip?: string;
  subject: string;
  grade: string;
  role: 'proktor' | 'guru_mapel';
  status: 'active' | 'inactive';
  isDemo?: boolean;
  activatedAt: string;
  avatarUrl?: string;
  ownerId?: string;
  firebaseVerified?: boolean;
}

export type ProktorTabType =
  | 'panel'
  | 'aktivasi'
  | 'soal'
  | 'akun'
  | 'peserta'
  | 'rangking';

export interface AppState {
  currentView: 'login' | 'proktor' | 'exam';
  activeProktorTab: ProktorTabType;
  fontSize: 'normal' | 'large' | 'xlarge';
  soundEnabled: boolean;
  loggedInRole: 'proktor' | 'student' | null;
  activeStudentId: string | null;
}

export interface AppBrandingConfig {
  loginAppTitle: string;
  logoDataUrl: string | null;
  navbarIconDataUrl?: string | null;
  pwaIconDataUrl?: string | null;
  pwaShortName?: string;
}

