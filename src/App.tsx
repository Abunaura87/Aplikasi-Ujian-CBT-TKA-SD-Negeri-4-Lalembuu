/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  db,
  auth,
  onAuthStateChanged,
  signInWithFirebaseGoogle,
  logoutFirebase,
  sanitizeTeacherForFirestore,
  handleFirestoreError,
  OperationType,
  User,
} from './firebase';
import {
  ExamConfig,
  Student,
  Question,
  ProktorTabType,
  AppBrandingConfig,
  TeacherAccount,
} from './types/cbt';
import {
  INITIAL_STUDENTS,
  INITIAL_TEST_SESSIONS,
  INITIAL_USED_TEST_CODES,
  INITIAL_TEACHER_ACCOUNTS,
} from './data/sampleQuestions';
import { generateUniqueToken } from './utils/cbtLogic';
import { sound } from './utils/soundEffects';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { ProktorPanel } from './components/ProktorPanel';
import { TestCodeActivationTab } from './components/TestCodeActivationTab';
import { ManualQuestionManagerTab } from './components/ManualQuestionManagerTab';
import { TeacherAccountActivationTab } from './components/TeacherAccountActivationTab';
import { StudentStatusTab } from './components/StudentStatusTab';
import { RankingTab } from './components/RankingTab';
import { StudentExamRoom } from './components/StudentExamRoom';
import { GoogleDriveArchiveModal } from './components/GoogleDriveArchiveModal';

const BRANDING_STORAGE_KEY = 'cbt_sdn4_lalembuu_branding_v1';
const TEACHERS_STORAGE_KEY = 'cbt_sdn4_lalembuu_teachers_v1';

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'proktor' | 'exam'>(
    'login'
  );
  const [activeTab, setActiveTab] = useState<ProktorTabType>('panel');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(
    'normal'
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState<number>(75);

  // Dynamically scale root HTML font-size so all users can adjust text size across the entire app
  useEffect(() => {
    const htmlEl = document.documentElement;
    if (fontSize === 'xlarge') {
      htmlEl.style.fontSize = '18px';
    } else if (fontSize === 'large') {
      htmlEl.style.fontSize = '16.5px';
    } else {
      htmlEl.style.fontSize = '15px';
    }
  }, [fontSize]);

  // Branding state for Login Page (Logo & App Title configurable by Admin/Proktor)
  const [branding, setBranding] = useState<AppBrandingConfig>(() => {
    try {
      const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          loginAppTitle: parsed.loginAppTitle || 'Simulasi CBT / TKA',
          logoDataUrl: parsed.logoDataUrl || null,
        };
      }
    } catch {
      // ignore storage errors
    }
    return {
      loginAppTitle: 'Simulasi CBT / TKA',
      logoDataUrl: null,
    };
  });

  const handleUpdateBranding = (newBranding: AppBrandingConfig) => {
    setBranding(newBranding);
    try {
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(newBranding));
    } catch {
      // ignore storage quota errors
    }
  };

  // Teacher Google Accounts state (persisted locally + synced with Firestore when authenticated)
  const [teacherAccounts, setTeacherAccounts] = useState<TeacherAccount[]>(
    () => {
      try {
        const saved = localStorage.getItem(TEACHERS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // ignore storage errors
      }
      return INITIAL_TEACHER_ACCOUNTS;
    }
  );

  const [loggedInTeacher, setLoggedInTeacher] = useState<TeacherAccount>(
    INITIAL_TEACHER_ACCOUNTS[0]
  );

  // Firebase Auth state tracking
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // Sync teacherAccounts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        TEACHERS_STORAGE_KEY,
        JSON.stringify(teacherAccounts)
      );
    } catch {
      // ignore storage quota errors
    }
  }, [teacherAccounts]);

  // Real-time Firestore listener when Firebase Auth is ready and user is authenticated
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;
    const isEmailAdmin =
      firebaseUser.email?.trim().toLowerCase() === 'marhaniza05@gmail.com';
    const targetQuery = isEmailAdmin
      ? collection(db, 'teacher_accounts')
      : query(
          collection(db, 'teacher_accounts'),
          where('email', '==', (firebaseUser.email || '').trim().toLowerCase())
        );

    const unsubscribe = onSnapshot(
      targetQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: TeacherAccount[] = [];
          snapshot.forEach((docSnap) => {
            loaded.push(docSnap.data() as TeacherAccount);
          });
          setTeacherAccounts((prev) => {
            const byId = new Map(prev.map((item) => [item.id, item]));
            loaded.forEach((item) => byId.set(item.id, item));
            return Array.from(byId.values());
          });
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'teacher_accounts');
        } catch {
          // Logged structured FirestoreErrorInfo
        }
      }
    );
    return () => unsubscribe();
  }, [isAuthReady, firebaseUser]);

  const syncTeacherToFirestore = async (teacher: TeacherAccount) => {
    if (!auth.currentUser) return;
    const path = `teacher_accounts/${teacher.id}`;
    try {
      const payload = sanitizeTeacherForFirestore(
        teacher,
        auth.currentUser.uid
      );
      await setDoc(doc(db, 'teacher_accounts', String(payload.id)), payload);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch {
        // Logged structured FirestoreErrorInfo
      }
    }
  };

  const handleConnectFirebaseAuth = async () => {
    try {
      const user = await signInWithFirebaseGoogle();
      setFirebaseUser(user);
      const updatedTeacher: TeacherAccount = {
        ...loggedInTeacher,
        ownerId: user.uid,
        firebaseVerified: true,
      };
      setLoggedInTeacher(updatedTeacher);
      await syncTeacherToFirestore(updatedTeacher);
    } catch {
      // User closed popup or popup blocked
    }
  };

  const handleAddTeacherAccount = (newTeacher: TeacherAccount) => {
    const enriched: TeacherAccount = {
      ...newTeacher,
      ownerId: auth.currentUser?.uid || 'system',
    };
    setTeacherAccounts((prev) => [enriched, ...prev]);
    if (auth.currentUser) {
      syncTeacherToFirestore(enriched);
    }
  };

  const handleToggleTeacherStatus = (teacherId: string) => {
    setTeacherAccounts((prev) =>
      prev.map((t) => {
        if (t.id === teacherId) {
          const updated: TeacherAccount = {
            ...t,
            status: t.status === 'active' ? 'inactive' : 'active',
            ownerId: auth.currentUser?.uid || t.ownerId || 'system',
          };
          if (auth.currentUser) {
            syncTeacherToFirestore(updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleDeleteTeacherAccount = (teacherId: string) => {
    setTeacherAccounts((prev) => prev.filter((t) => t.id !== teacherId));
    if (auth.currentUser) {
      deleteDoc(doc(db, 'teacher_accounts', teacherId)).catch((error) => {
        try {
          handleFirestoreError(
            error,
            OperationType.DELETE,
            `teacher_accounts/${teacherId}`
          );
        } catch {
          // Logged structured FirestoreErrorInfo
        }
      });
    }
  };

  // Custom Proktor Password (optional override set by Proktor in panel)
  const [customProktorPassword, setCustomProktorPassword] =
    useState<string>('');

  // Multi-test sessions state (each with its own unique testCode, token, and questions)
  const [testSessions, setTestSessions] = useState<ExamConfig[]>(
    INITIAL_TEST_SESSIONS
  );
  const [activeSessionId, setActiveSessionId] = useState<string>(
    INITIAL_TEST_SESSIONS[0].id
  );

  // Registry of all used test codes (permanently locked to prevent duplicates)
  const [usedTestCodes, setUsedTestCodes] = useState<string[]>(
    INITIAL_USED_TEST_CODES
  );

  // Students list
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [activeStudent, setActiveStudent] = useState<Student>(
    INITIAL_STUDENTS[1]
  );

  const currentExamConfig =
    testSessions.find((s) => s.id === activeSessionId) || testSessions[0];

  const registerUsedCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    setUsedTestCodes((prev) => (prev.includes(clean) ? prev : [clean, ...prev]));
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    sound.setEnabled(nextVal);
    if (nextVal && soundVolume === 0) {
      setSoundVolume(75);
      sound.setVolume(75);
    }
  };

  const handleChangeSoundVolume = (newVol: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newVol)));
    setSoundVolume(clamped);
    sound.setVolume(clamped);
    if (clamped === 0) {
      setSoundEnabled(false);
    } else if (!soundEnabled) {
      setSoundEnabled(true);
    }
  };

  // Update active session or create a new session if the testCode was changed to a new unique code
  const handleUpdateConfig = (
    updatedConfig: ExamConfig,
    isNewTestCode: boolean
  ) => {
    registerUsedCode(updatedConfig.testCode);

    if (isNewTestCode) {
      const existingTokens = testSessions.map((s) => s.token);
      const distinctToken = generateUniqueToken(existingTokens);
      const newSession: ExamConfig = {
        ...updatedConfig,
        id: `session-${Date.now()}`,
        token: distinctToken,
        tokenGeneratedAt: new Date().toISOString(),
        isTokenActive: true,
        status: 'active',
        createdAt: new Intl.DateTimeFormat('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
      };
      setTestSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    } else {
      setTestSessions((prev) =>
        prev.map((s) => (s.id === updatedConfig.id ? updatedConfig : s))
      );
    }
  };

  const handleCreateTestSession = (newSession: ExamConfig) => {
    registerUsedCode(newSession.testCode);
    setTestSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleToggleSessionStatus = (
    sessionId: string,
    nextStatus: 'active' | 'inactive' | 'archived'
  ) => {
    setTestSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            status: nextStatus,
            isTokenActive: nextStatus === 'active' ? s.isTokenActive : false,
          };
        }
        return s;
      })
    );
  };

  const handleToggleSessionToken = (sessionId: string) => {
    setTestSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            isTokenActive: !s.isTokenActive,
          };
        }
        return s;
      })
    );
  };

  const handleRegenerateSessionToken = (sessionId: string) => {
    const existingTokens = testSessions.map((s) => s.token);
    const newToken = generateUniqueToken(existingTokens);
    setTestSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            token: newToken,
            tokenGeneratedAt: new Date().toISOString(),
            isTokenActive: true,
          };
        }
        return s;
      })
    );
  };

  const handleUpdateSessionQuestions = (
    sessionId: string,
    updatedQuestions: Question[]
  ) => {
    setTestSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            questions: updatedQuestions,
          };
        }
        return s;
      })
    );
  };

  const handleResetStudent = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            status: 'idle',
            score: 0,
            answeredCount: 0,
            answers: {},
            flagged: {},
            remainingSeconds: currentExamConfig.durationMinutes * 60,
          };
        }
        return s;
      })
    );
  };

  const handleAddStudent = (name: string, nisn: string, grade: string) => {
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      nisn,
      name,
      gender: 'L',
      grade,
      testCode: currentExamConfig.testCode,
      status: 'idle',
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      answeredCount: 0,
      totalQuestions: currentExamConfig.questionCount,
      remainingSeconds: currentExamConfig.durationMinutes * 60,
      answers: {},
      flagged: {},
      ipAddress: `192.168.1.${111 + students.length}`,
    };
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleImportStudents = (
    importedStudents: Student[],
    mode: 'append' | 'replace'
  ) => {
    if (mode === 'replace') {
      setStudents(importedStudents);
    } else {
      setStudents((prev) => [...importedStudents, ...prev]);
    }
  };

  const handleAddDemoStudent = (demoStudent: Student) => {
    setStudents((prev) => [demoStudent, ...prev]);
  };

  const handleSimulateLabWork = () => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.status === 'in_progress') {
          const newAnswered = Math.min(s.answeredCount + 2, s.totalQuestions);
          const isDone = newAnswered >= s.totalQuestions;
          return {
            ...s,
            answeredCount: newAnswered,
            remainingSeconds: Math.max(0, s.remainingSeconds - 120),
            status: isDone ? 'completed' : 'in_progress',
            score: isDone ? Math.floor(75 + Math.random() * 25) : s.score,
          };
        }
        if (s.status === 'idle' && Math.random() > 0.4) {
          return {
            ...s,
            status: 'in_progress',
            startTime: '08:15',
            answeredCount: 3,
            remainingSeconds: (currentExamConfig.durationMinutes - 5) * 60,
          };
        }
        return s;
      })
    );
  };

  const handleStudentFinish = (result: {
    score: number;
    correctCount: number;
    wrongCount: number;
    answeredCount: number;
    answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  }) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === activeStudent.id) {
          return {
            ...s,
            status: 'completed',
            testCode: currentExamConfig.testCode,
            score: result.score,
            correctAnswers: result.correctCount,
            wrongAnswers: result.wrongCount,
            answeredCount: result.answeredCount,
            answers: result.answers,
          };
        }
        return s;
      })
    );
  };

  const rootFontSize =
    fontSize === 'xlarge'
      ? 'text-lg'
      : fontSize === 'large'
      ? 'text-base'
      : 'text-sm';

  const activeTestCount = testSessions.filter(
    (s) => s.status === 'active'
  ).length;
  const activeTeacherCount = teacherAccounts.filter(
    (t) => t.status === 'active'
  ).length;

  return (
    <div
      className={`min-h-screen bg-[#77DD77] relative text-stone-900 font-sans ${rootFontSize}`}
    >
      {/* Global SDN 4 Lalembuu Photo Background Layer with 14% Opacity */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.14]"
        style={{
          backgroundImage: `url('/assets/aistudio/SDN_4_Lalembuu_2_12e252b3.jpg')`,
        }}
      />

      {/* 1. Login Page View */}
      {currentView === 'login' && (
        <LoginPage
          testSessions={testSessions}
          customProktorPassword={customProktorPassword}
          students={students}
          teacherAccounts={teacherAccounts}
          firebaseUser={firebaseUser}
          isAuthReady={isAuthReady}
          branding={branding}
          fontSize={fontSize}
          onChangeFontSize={setFontSize}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          soundVolume={soundVolume}
          onChangeSoundVolume={handleChangeSoundVolume}
          onLoginProktor={(proktorAccount) => {
            const nextProktor: TeacherAccount = {
              ...proktorAccount,
              role: 'proktor',
            };
            setLoggedInTeacher(nextProktor);
            if (auth.currentUser) {
              syncTeacherToFirestore(nextProktor);
            }
            setIsPreviewMode(false);
            setCurrentView('proktor');
            setActiveTab('panel');
          }}
          onLoginTeacher={(teacherAccount) => {
            const nextTeacher: TeacherAccount = {
              ...teacherAccount,
              role: 'guru_mapel',
            };
            setLoggedInTeacher(nextTeacher);
            if (auth.currentUser) {
              syncTeacherToFirestore(nextTeacher);
            }
            // Automatically select the session matching this teacher's subject if available
            const matchingSession = testSessions.find(
              (s) =>
                s.subject.toLowerCase() ===
                teacherAccount.subject.toLowerCase()
            );
            if (matchingSession) {
              setActiveSessionId(matchingSession.id);
            }
            setIsPreviewMode(false);
            setCurrentView('proktor');
            setActiveTab('panel');
          }}
          onLoginStudent={(selectedStudent, chosenSession) => {
            setActiveSessionId(chosenSession.id);
            setActiveStudent({
              ...selectedStudent,
              testCode: chosenSession.testCode,
              totalQuestions: chosenSession.questionCount,
              remainingSeconds: chosenSession.durationMinutes * 60,
            });
            setIsPreviewMode(false);
            setCurrentView('exam');
          }}
        />
      )}

      {/* 2. Proktor / Guru Panel View with Collapsible Left Sidebar */}
      {currentView === 'proktor' && (
        <div className="relative z-10 min-h-screen flex bg-transparent">
          <Sidebar
            isOpen={isSidebarOpen}
            onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
            currentTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenStudentExam={() => {
              setActiveStudent(students[1] || students[0]);
              setIsPreviewMode(true);
              setCurrentView('exam');
            }}
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            soundVolume={soundVolume}
            onChangeSoundVolume={handleChangeSoundVolume}
            onLogout={() => {
              logoutFirebase().catch(() => {});
              setCurrentView('login');
            }}
            testCode={currentExamConfig.testCode}
            activeSubject={currentExamConfig.subject}
            activeGrade={currentExamConfig.grade}
            activeTestCount={activeTestCount}
            activeTeacherCount={activeTeacherCount}
            loggedInTeacher={loggedInTeacher}
            branding={branding}
            onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
            firebaseUser={firebaseUser}
            onConnectFirebaseAuth={handleConnectFirebaseAuth}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <main
              className={`flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full transition-all ${
                !isSidebarOpen ? 'pt-16 sm:pt-14' : ''
              }`}
            >
              {activeTab === 'panel' && (
                <ProktorPanel
                  examConfig={currentExamConfig}
                  allSessions={testSessions}
                  usedTestCodes={usedTestCodes}
                  onSelectSession={setActiveSessionId}
                  onUpdateConfig={handleUpdateConfig}
                  onToggleTokenActive={() =>
                    handleToggleSessionToken(currentExamConfig.id)
                  }
                  onReleaseNewToken={() =>
                    handleRegenerateSessionToken(currentExamConfig.id)
                  }
                  onNavigateTab={setActiveTab}
                  customProktorPassword={customProktorPassword}
                  onUpdateProktorPassword={setCustomProktorPassword}
                  branding={branding}
                  onUpdateBranding={handleUpdateBranding}
                  onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
                  loggedInTeacher={loggedInTeacher}
                />
              )}

              {activeTab === 'aktivasi' &&
                loggedInTeacher.role === 'proktor' && (
                  <TestCodeActivationTab
                    testSessions={testSessions}
                    activeSessionId={activeSessionId}
                    usedTestCodes={usedTestCodes}
                    onSelectActiveSession={setActiveSessionId}
                    onCreateTestSession={handleCreateTestSession}
                    onToggleSessionStatus={handleToggleSessionStatus}
                    onToggleSessionToken={handleToggleSessionToken}
                    onRegenerateSessionToken={handleRegenerateSessionToken}
                  />
                )}

              {activeTab === 'soal' && (
                <ManualQuestionManagerTab
                  testSessions={testSessions}
                  selectedSessionId={activeSessionId}
                  onSelectSessionId={setActiveSessionId}
                  onUpdateSessionQuestions={handleUpdateSessionQuestions}
                />
              )}

              {activeTab === 'akun' &&
                loggedInTeacher.role === 'proktor' && (
                  <TeacherAccountActivationTab
                    teacherAccounts={teacherAccounts}
                    students={students}
                    activeExamConfig={currentExamConfig}
                    onAddTeacherAccount={handleAddTeacherAccount}
                    onToggleTeacherStatus={handleToggleTeacherStatus}
                    onDeleteTeacherAccount={handleDeleteTeacherAccount}
                    onAddDemoStudent={handleAddDemoStudent}
                    onSwitchLoggedInTeacher={(selectedTeacher) => {
                      setLoggedInTeacher(selectedTeacher);
                      if (selectedTeacher.role !== 'proktor') {
                        setActiveTab('panel');
                      }
                    }}
                    onStartDemoStudentExam={(demoStudent) => {
                      setActiveStudent({
                        ...demoStudent,
                        testCode: currentExamConfig.testCode,
                        totalQuestions: currentExamConfig.questionCount,
                        remainingSeconds:
                          currentExamConfig.durationMinutes * 60,
                      });
                      setIsPreviewMode(true);
                      setCurrentView('exam');
                    }}
                    firebaseUser={firebaseUser}
                    onConnectFirebaseAuth={handleConnectFirebaseAuth}
                  />
                )}

              {activeTab === 'peserta' && (
                <StudentStatusTab
                  students={students}
                  activeExamConfig={currentExamConfig}
                  onResetStudent={handleResetStudent}
                  onAddStudent={handleAddStudent}
                  onImportStudents={handleImportStudents}
                  onSimulateWork={handleSimulateLabWork}
                />
              )}

              {activeTab === 'rangking' && (
                <RankingTab
                  examConfig={currentExamConfig}
                  students={students}
                />
              )}
            </main>

            <footer className="py-4 border-t border-emerald-500/20 bg-white/90 backdrop-blur-md text-center text-xs text-[#11331F] font-semibold">
              <p>Copyright © 2026 SD Negeri 4 Lalembuu. All rights reserved.</p>
            </footer>
          </div>

          <GoogleDriveArchiveModal
            isOpen={isDriveModalOpen}
            onClose={() => setIsDriveModalOpen(false)}
            examConfig={currentExamConfig}
            students={students}
            loggedInTeacher={loggedInTeacher}
          />
        </div>
      )}

      {/* 3. Student Exam Room View */}
      {currentView === 'exam' && (
        <div className="relative z-10">
          <StudentExamRoom
            examConfig={currentExamConfig}
            student={activeStudent}
            questions={currentExamConfig.questions}
            onFinishExam={handleStudentFinish}
            onExitToLogin={() => setCurrentView('login')}
            onReturnToProktor={
              isPreviewMode ? () => setCurrentView('proktor') : undefined
            }
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            soundVolume={soundVolume}
            onChangeSoundVolume={handleChangeSoundVolume}
          />
        </div>
      )}
    </div>
  );
}

