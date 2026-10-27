import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateToken,
  generateUniqueToken,
  validateTestCodeUniqueness,
  verifyProktorPassword,
  validateToken,
  calculateExamScore,
  getGradesForEducationLevel,
  getDefaultGradeForLevel,
  generateQuestionTemplateCsv,
  generateStudentTemplateCsv,
  parseUploadedQuestions,
  parseUploadedStudentsCsv,
  verifyActivatedTeacherEmail,
  normalizeBrandingConfig,
  resolveBrandIcons,
  generateDesktopShortcutContent,
} from './cbtLogic';

describe('cbtLogic Pure Unit Tests', () => {
  it('generates valid 6-char tokens without confusing chars', () => {
    const token = generateToken();
    assert.equal(token.length, 6);
    assert.equal(/[01OI]/.test(token), false);
    const unique = generateUniqueToken([token]);
    assert.notEqual(unique, token);
  });

  it('validates test code uniqueness accurately', () => {
    const used = ['CBT-2026-SD4-LIT-001'];
    const dupCheck = validateTestCodeUniqueness('cbt-2026-sd4-lit-001', used);
    assert.equal(dupCheck.isUnique, false);

    const okCheck = validateTestCodeUniqueness('CBT-2026-SD4-NUM-009', used);
    assert.equal(okCheck.isUnique, true);
  });

  it('enforces custom proktor password when set and falls back to default when empty', () => {
    // Default password works when customPassword is empty
    assert.equal(verifyProktorPassword('marhan123', '').isValid, true);
    assert.equal(verifyProktorPassword('proktor123', '').isValid, true);

    // When customPassword is saved, only customPassword is accepted and default is rejected
    const customPass = 'LalembuuBaru2026!';
    assert.equal(verifyProktorPassword(customPass, customPass).isValid, true);
    assert.equal(verifyProktorPassword('marhan123', customPass).isValid, false);
    assert.equal(verifyProktorPassword('wrongpass', customPass).isValid, false);
  });

  it('normalizes branding config and resolves login, navbar, and install icons', () => {
    const def = normalizeBrandingConfig(null);
    assert.equal(def.loginAppTitle, 'Simulasi CBT / TKA');
    assert.equal(def.pwaShortName, 'CBT SDN 4');

    const resolvedDefault = resolveBrandIcons(def);
    assert.equal(resolvedDefault.loginLogoUrl, null);
    assert.equal(resolvedDefault.navbarIconUrl, null);
    assert.equal(resolvedDefault.installIconUrl, '/pwa-192x192.png');

    const custom = normalizeBrandingConfig({
      loginAppTitle: 'ANBK SDN 4 Lalembuu',
      logoDataUrl: 'data:image/png;base64,LOGINLOGO',
      navbarIconDataUrl: 'data:image/png;base64,NAVBARICON',
      pwaIconDataUrl: 'data:image/png;base64,PWAICON',
      pwaShortName: 'ANBK SDN 4 LALEMBUU LONG',
    });
    assert.equal(custom.pwaShortName, 'ANBK SDN 4 L'); // truncated to 12 chars
    const resolvedCustom = resolveBrandIcons(custom);
    assert.equal(resolvedCustom.loginLogoUrl, 'data:image/png;base64,LOGINLOGO');
    assert.equal(resolvedCustom.navbarIconUrl, 'data:image/png;base64,NAVBARICON');
    assert.equal(resolvedCustom.installIconUrl, 'data:image/png;base64,PWAICON');
  });

  it('generates valid desktop shortcut .url content', () => {
    const shortcut = generateDesktopShortcutContent(
      'http://localhost:3000',
      '/pwa-192x192.png'
    );
    assert.equal(shortcut.includes('[InternetShortcut]'), true);
    assert.equal(shortcut.includes('URL=http://localhost:3000'), true);
    assert.equal(shortcut.includes('IconFile=/pwa-192x192.png'), true);
  });

  it('synchronizes education level with grade options for SD/MI, SMP/MTs, and SMA/MA', () => {
    const sdGrades = getGradesForEducationLevel('Jenjang SD/MI');
    assert.equal(sdGrades.length, 6);
    assert.equal(getDefaultGradeForLevel('Jenjang SD/MI'), 'Kelas 5');

    const smpGrades = getGradesForEducationLevel('Jenjang SMP/MTs');
    assert.equal(smpGrades.length, 3);
    assert.equal(smpGrades[0].value, 'Kelas 7');
    assert.equal(getDefaultGradeForLevel('Jenjang SMP/MTs'), 'Kelas 8');

    const smaGrades = getGradesForEducationLevel('Jenjang SMA/MA');
    assert.equal(smaGrades.length, 3);
    assert.equal(smaGrades[0].value, 'Kelas 10');
    assert.equal(getDefaultGradeForLevel('Jenjang SMA/MA'), 'Kelas 11');
  });

  it('generates and parses RFC 4180 question and student CSV templates cleanly', () => {
    const qCsv = generateQuestionTemplateCsv('Literasi Membaca');
    const parsedQ = parseUploadedQuestions(qCsv, 'Literasi Membaca');
    assert.equal(parsedQ.success, true);
    assert.equal(parsedQ.questions.length, 3);

    const sCsv = generateStudentTemplateCsv('Kelas 5A');
    const parsedS = parseUploadedStudentsCsv(sCsv, 'CBT-2026-SD4-LIT-001');
    assert.equal(parsedS.success, true);
    assert.equal(parsedS.students.length, 5);
  });

  it('validates student token and calculates exam score accurately', () => {
    assert.equal(
      validateToken('ABCDEF', 'ABCDEF', true, 'CBT-01').isValid,
      true
    );
    assert.equal(
      validateToken('ABCDEF', 'ABCDEF', false, 'CBT-01').isValid,
      false
    );

    const scoreRes = calculateExamScore(
      { 1: 'A', 2: 'C' },
      [
        {
          id: 1,
          number: 1,
          text: 'Q1',
          options: [],
          correctAnswer: 'A',
          subject: 'Matematika',
          topic: 'T1',
        },
        {
          id: 2,
          number: 2,
          text: 'Q2',
          options: [],
          correctAnswer: 'B',
          subject: 'Matematika',
          topic: 'T2',
        },
      ]
    );
    assert.equal(scoreRes.score, 50);
    assert.equal(scoreRes.correctCount, 1);
    assert.equal(scoreRes.wrongCount, 1);
  });

  it('verifies activated teacher Google email', () => {
    const teachers = [
      {
        id: 't1',
        name: 'Guru 1',
        email: 'guru1@gmail.com',
        subject: 'IPAS',
        grade: 'Kelas 5',
        role: 'guru_mapel' as const,
        status: 'active' as const,
        activatedAt: '2026',
      },
    ];
    assert.equal(
      verifyActivatedTeacherEmail('guru1@gmail.com', teachers).isValid,
      true
    );
    assert.equal(
      verifyActivatedTeacherEmail('unknown@gmail.com', teachers).isValid,
      false
    );
  });
});
