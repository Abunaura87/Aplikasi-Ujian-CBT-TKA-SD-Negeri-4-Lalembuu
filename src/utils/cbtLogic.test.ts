import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateToken,
  generateUniqueToken,
  generateTestCode,
  generateUniqueTestCode,
  validateTestCodeUniqueness,
  verifyProktorPassword,
  validateToken,
  calculateExamScore,
  formatDuration,
  getCurriculumTopics,
  getGradesForEducationLevel,
  getDefaultGradeForLevel,
  generateQuestionTemplateCsv,
  generateStudentTemplateCsv,
  generateQuestionTemplateTxt,
  parseUploadedQuestions,
  parseUploadedStudentsCsv,
  verifyActivatedTeacherEmail,
  createDemoTeacherAccount,
  createDemoStudentAccount,
} from './cbtLogic';
import { Question } from '../types/cbt';
import { INITIAL_TEACHER_ACCOUNTS } from '../data/sampleQuestions';

test('generateToken and generateUniqueToken produce distinct 6-char tokens', () => {
  const token = generateToken();
  assert.equal(token.length, 6);
  assert.match(token, /^[A-Z0-9]{6}$/);

  const existing = ['KLMNPQ', 'ABCDEF'];
  const unique = generateUniqueToken(existing);
  assert.equal(unique.length, 6);
  assert.equal(existing.includes(unique), false);
});

test('validateTestCodeUniqueness prevents duplicate or already-used test codes', () => {
  const usedCodes = ['CBT-2026-SD4-001', 'CBT-2026-SD4-LIT-002'];

  // Reject already used code (even lowercase)
  const duplicateCheck = validateTestCodeUniqueness('cbt-2026-sd4-001', usedCodes);
  assert.equal(duplicateCheck.isUnique, false);
  assert.match(duplicateCheck.message, /sudah terdaftar|pernah digunakan/i);

  // Accept fresh code
  const freshCheck = validateTestCodeUniqueness('CBT-2026-SD4-NUM-099', usedCodes);
  assert.equal(freshCheck.isUnique, true);
  assert.equal(freshCheck.cleanCode, 'CBT-2026-SD4-NUM-099');

  // generateUniqueTestCode never collides with usedCodes
  const generated = generateUniqueTestCode('IPAS', 'Kelas 5', usedCodes);
  assert.equal(usedCodes.includes(generated), false);
});

test('verifyProktorPassword rejects empty or unauthorized passwords', () => {
  assert.equal(verifyProktorPassword('').isValid, false);
  assert.equal(verifyProktorPassword('sembarang123').isValid, false);
  assert.equal(verifyProktorPassword('marhan123').isValid, true);
  assert.equal(verifyProktorPassword('customPass99', 'customPass99').isValid, true);
  assert.equal(verifyProktorPassword('marhan123', 'customPass99').isValid, false);
});

test('validateToken checks token activation and correctness per test code', () => {
  const activeToken = 'KLMNPQ';

  const inactiveResult = validateToken(activeToken, activeToken, false, 'CBT-2026-SD4-001');
  assert.equal(inactiveResult.isValid, false);
  assert.match(inactiveResult.message, /belum diaktifkan/i);

  const emptyResult = validateToken('', activeToken, true);
  assert.equal(emptyResult.isValid, false);

  const wrongResult = validateToken('WRONG1', activeToken, true, 'CBT-2026-SD4-001');
  assert.equal(wrongResult.isValid, false);
  assert.match(wrongResult.message, /tidak cocok/i);

  const validResult = validateToken('klmnpq', activeToken, true, 'CBT-2026-SD4-001');
  assert.equal(validResult.isValid, true);
});

test('calculateExamScore calculates correct score and stats', () => {
  const sampleQuestions: Question[] = [
    {
      id: 1,
      number: 1,
      text: 'Soal 1',
      options: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
      ],
      correctAnswer: 'A',
      subject: 'IPA',
      topic: 'Topic 1',
    },
    {
      id: 2,
      number: 2,
      text: 'Soal 2',
      options: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
      ],
      correctAnswer: 'B',
      subject: 'IPA',
      topic: 'Topic 2',
    },
  ];

  const result = calculateExamScore({ 1: 'A', 2: 'B' }, sampleQuestions);
  assert.equal(result.score, 100);
  assert.equal(result.correctCount, 2);
  assert.equal(result.passed, true);
});

test('CSV and TXT question template generation and upload parsing with answer keys', () => {
  const csvTemplate = generateQuestionTemplateCsv('IPAS');
  // Header should be comma-delimited so Excel splits columns cleanly
  const firstLine = csvTemplate.split(/\r?\n/)[0];
  assert.equal(firstLine, 'No,Stimulus_Bacaan,Pertanyaan,Opsi_A,Opsi_B,Opsi_C,Opsi_D,Kunci_Jawaban,Topik');

  const parsedCsv = parseUploadedQuestions(csvTemplate, 'IPAS');
  assert.equal(parsedCsv.success, true);
  assert.equal(parsedCsv.questions.length, 3);
  assert.equal(parsedCsv.questions[0].correctAnswer, 'A');
  assert.equal(parsedCsv.questions[1].correctAnswer, 'B');

  const txtTemplate = generateQuestionTemplateTxt('Literasi');
  const parsedTxt = parseUploadedQuestions(txtTemplate, 'Literasi');
  assert.equal(parsedTxt.success, true);
  assert.equal(parsedTxt.questions.length, 2);
  assert.equal(parsedTxt.questions[0].correctAnswer, 'A');
  assert.equal(parsedTxt.questions[1].correctAnswer, 'B');
});

test('Student CSV template generation and bulk student upload parsing', () => {
  const studentCsv = generateStudentTemplateCsv('Kelas 5A');
  const firstLine = studentCsv.split(/\r?\n/)[0];
  assert.equal(firstLine, 'No,NISN,Nama_Lengkap,Jenis_Kelamin,Kelas,Komputer_Klien');

  const parsedStudents = parseUploadedStudentsCsv(
    studentCsv,
    'CBT-2026-SD4-LIT-001',
    15,
    45,
    10
  );
  assert.equal(parsedStudents.success, true);
  assert.equal(parsedStudents.students.length, 5);
  assert.equal(parsedStudents.students[0].name, 'Muhammad Rizky Pratama');
  assert.equal(parsedStudents.students[0].nisn, '0089123451');
  assert.equal(parsedStudents.students[0].gender, 'L');
  assert.equal(parsedStudents.students[1].gender, 'P');
});

test('getGradesForEducationLevel and getDefaultGradeForLevel synchronize SD/MI, SMP/MTs, and SMA/MA', () => {
  const sdGrades = getGradesForEducationLevel('Jenjang SD/MI');
  assert.equal(sdGrades.length, 6);
  assert.equal(sdGrades[0].value, 'Kelas 1');
  assert.equal(getDefaultGradeForLevel('Jenjang SD/MI'), 'Kelas 5');

  const smpGrades = getGradesForEducationLevel('Jenjang SMP/MTs');
  assert.equal(smpGrades.length, 3);
  assert.deepEqual(
    smpGrades.map((g) => g.value),
    ['Kelas 7', 'Kelas 8', 'Kelas 9']
  );
  assert.equal(getDefaultGradeForLevel('Jenjang SMP/MTs'), 'Kelas 8');

  const smaGrades = getGradesForEducationLevel('Jenjang SMA/MA');
  assert.equal(smaGrades.length, 3);
  assert.deepEqual(
    smaGrades.map((g) => g.value),
    ['Kelas 10', 'Kelas 11', 'Kelas 12']
  );
  assert.equal(getDefaultGradeForLevel('Jenjang SMA/MA'), 'Kelas 11');
});

test('formatDuration and getCurriculumTopics work properly across education levels', () => {
  assert.equal(formatDuration(90), '01:30');
  const topicsSd = getCurriculumTopics('Literasi Membaca', 'Kelas 5');
  assert.equal(topicsSd.length, 3);
  assert.match(topicsSd[0], /SD\/MI/);

  const topicsSmp = getCurriculumTopics('Numerasi Matematika', 'Kelas 8');
  assert.match(topicsSmp[0], /SMP\/MTs/);

  const topicsSma = getCurriculumTopics('IPAS', 'Kelas 11');
  assert.match(topicsSma[0], /SMA\/MA/);
});

test('verifyActivatedTeacherEmail validates active, inactive, and unregistered Google emails', () => {
  // Active teacher email
  const activeRes = verifyActivatedTeacherEmail(
    'hasnawati.sdn4@gmail.com',
    INITIAL_TEACHER_ACCOUNTS
  );
  assert.equal(activeRes.isValid, true);
  assert.equal(activeRes.teacher?.name, 'Hj. Hasnawati, S.Pd.');

  // Inactive teacher email
  const inactiveRes = verifyActivatedTeacherEmail(
    'nurliana.ipas@gmail.com',
    INITIAL_TEACHER_ACCOUNTS
  );
  assert.equal(inactiveRes.isValid, false);
  assert.match(inactiveRes.message, /Non-Aktif/i);

  // Unregistered email
  const unknownRes = verifyActivatedTeacherEmail(
    'bukan.guru@gmail.com',
    INITIAL_TEACHER_ACCOUNTS
  );
  assert.equal(unknownRes.isValid, false);
  assert.match(unknownRes.message, /belum terdaftar/i);
});

test('createDemoTeacherAccount and createDemoStudentAccount create ready-to-use demo accounts', () => {
  const demoTeacher = createDemoTeacherAccount(
    INITIAL_TEACHER_ACCOUNTS,
    'Budi Santoso, S.Pd.',
    'IPAS',
    'Kelas 6'
  );
  assert.equal(demoTeacher.status, 'active');
  assert.equal(demoTeacher.isDemo, true);
  assert.equal(demoTeacher.subject, 'IPAS');

  const verifyDemo = verifyActivatedTeacherEmail(demoTeacher.email, [
    ...INITIAL_TEACHER_ACCOUNTS,
    demoTeacher,
  ]);
  assert.equal(verifyDemo.isValid, true);

  const demoStudent = createDemoStudentAccount(
    [],
    'CBT-2026-SD4-LIT-001',
    15,
    45,
    'Putri Rahayu (Demo)',
    'Kelas 5B'
  );
  assert.equal(demoStudent.isDemo, true);
  assert.equal(demoStudent.testCode, 'CBT-2026-SD4-LIT-001');
  assert.equal(demoStudent.grade, 'Kelas 5B');
});


