import { Question, Student, TeacherAccount } from '../types/cbt';

/**
 * Generates a clean 6-character uppercase token avoiding confusing characters (O, 0, I, 1).
 */
export function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    token += chars[randomIndex];
  }
  return token;
}

/**
 * Generates a 6-character token guaranteed to be distinct from existing tokens.
 */
export function generateUniqueToken(existingTokens: string[] = []): string {
  const upperSet = new Set(existingTokens.map((t) => t.trim().toUpperCase()));
  let token = generateToken();
  let attempts = 0;
  while (upperSet.has(token) && attempts < 50) {
    token = generateToken();
    attempts++;
  }
  return token;
}

/**
 * Generates a standardized test code for SD Negeri 4 Lalembuu.
 */
export function generateTestCode(subject: string, grade: string): string {
  const currentYear = new Date().getFullYear() || 2026;
  const subCode = (subject || 'CBT')
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase() || 'CBT';
  const gradeNum = (grade || '5').replace(/[^0-9]/g, '') || '5';
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `CBT-${currentYear}-SD4-${subCode}-K${gradeNum}-${randomSuffix}`;
}

/**
 * Generates a new test code guaranteed not to exist in usedCodes.
 */
export function generateUniqueTestCode(
  subject: string,
  grade: string,
  usedCodes: string[] = []
): string {
  const usedSet = new Set(usedCodes.map((c) => c.trim().toUpperCase()));
  let candidate = generateTestCode(subject, grade);
  let attempts = 0;
  while (usedSet.has(candidate) && attempts < 100) {
    candidate = generateTestCode(subject, grade);
    attempts++;
  }
  return candidate;
}

/**
 * Validates that a candidate test code is non-empty and has never been used before.
 */
export function validateTestCodeUniqueness(
  inputCode: string,
  usedCodes: string[]
): {
  isUnique: boolean;
  cleanCode: string;
  message: string;
} {
  const cleanCode = (inputCode || '').trim().toUpperCase();
  if (!cleanCode || cleanCode.length < 4) {
    return {
      isUnique: false,
      cleanCode,
      message: 'Kode tes minimal harus terdiri dari 4 karakter.',
    };
  }

  const usedSet = new Set(usedCodes.map((c) => c.trim().toUpperCase()));
  if (usedSet.has(cleanCode)) {
    return {
      isUnique: false,
      cleanCode,
      message: `Kode tes "${cleanCode}" sudah terdaftar atau pernah digunakan sebelumnya. Gunakan kode tes baru agar tidak ganda.`,
    };
  }

  return {
    isUnique: true,
    cleanCode,
    message: 'Kode tes unik dan tersedia untuk diaktifkan.',
  };
}

/**
 * Verifies Proktor login password.
 */
export function verifyProktorPassword(
  inputPassword: string,
  customPassword?: string
): {
  isValid: boolean;
  message: string;
} {
  const trimmed = (inputPassword || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      message: 'Password otorisasi guru/proktor wajib diisi.',
    };
  }

  if (customPassword && customPassword.trim().length > 0) {
    if (trimmed === customPassword.trim()) {
      return { isValid: true, message: 'Otorisasi proktor berhasil.' };
    }
    return {
      isValid: false,
      message: 'Password proktor yang Anda masukkan salah. Akses ditolak.',
    };
  }

  // Accepted master passwords for Proktor Marhan, S.Pd.I., M.Pd.
  const validMasterPasswords = ['marhan123', 'proktor123', 'sdn4lalembuu', 'marhan2026'];
  if (validMasterPasswords.includes(trimmed.toLowerCase())) {
    return { isValid: true, message: 'Otorisasi proktor berhasil.' };
  }

  return {
    isValid: false,
    message: 'Password proktor tidak valid. Hanya Guru/Proktor resmi yang memiliki otorisasi masuk.',
  };
}

/**
 * Validates student token input against the selected test's active token.
 */
export function validateToken(
  inputToken: string,
  activeToken: string,
  isTokenActive: boolean,
  testCode?: string
): {
  isValid: boolean;
  message: string;
} {
  const codeLabel = testCode ? ` untuk kode tes ${testCode}` : '';
  if (!isTokenActive) {
    return {
      isValid: false,
      message: `Token ujian${codeLabel} belum diaktifkan oleh Proktor (Marhan, S.Pd.I., M.Pd.). Silakan hubungi proktor lab.`,
    };
  }

  const cleanInput = (inputToken || '').trim().toUpperCase();
  const cleanActive = (activeToken || '').trim().toUpperCase();

  if (!cleanInput) {
    return {
      isValid: false,
      message: 'Token ujian tidak boleh kosong. Masukkan 6 digit token sesuai kode tes yang diarahkan guru.',
    };
  }

  if (cleanInput !== cleanActive) {
    return {
      isValid: false,
      message: `Token ujian tidak cocok dengan kode tes${codeLabel}. Pastikan token sesuai arahan proktor.`,
    };
  }

  return {
    isValid: true,
    message: 'Token valid. Mempersiapkan simulasi ujian...',
  };
}

/**
 * Calculates score, correct, wrong, and unanswered stats.
 */
export function calculateExamScore(
  answers: Record<number, string>,
  questions: Question[]
): {
  score: number;
  correctCount: number;
  wrongCount: number;
  answeredCount: number;
  totalQuestions: number;
  passed: boolean;
} {
  const total = questions.length;
  if (total === 0) {
    return {
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      answeredCount: 0,
      totalQuestions: 0,
      passed: false,
    };
  }

  let correctCount = 0;
  let wrongCount = 0;
  let answeredCount = 0;

  for (const q of questions) {
    const studentAnswer = answers[q.number];
    if (studentAnswer) {
      answeredCount++;
      if (studentAnswer.toUpperCase() === q.correctAnswer.toUpperCase()) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }
  }

  const score = Math.round((correctCount / total) * 100);
  const passed = score >= 70; // Standar KKM SD

  return {
    score,
    correctCount,
    wrongCount,
    answeredCount,
    totalQuestions: total,
    passed,
  };
}

/**
 * Formats time in seconds to mm:ss or hh:mm:ss.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSecs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSecs)}`;
  }
  return `${pad(minutes)}:${pad(remainingSecs)}`;
}

/**
 * Returns the list of valid grades (Kelas) synchronized with the selected Education Level (Jenjang Pendidikan).
 */
export function getGradesForEducationLevel(
  educationLevel: string
): { value: string; label: string }[] {
  const level = (educationLevel || '').toUpperCase();
  if (level.includes('SMP') || level.includes('MTS')) {
    return [
      { value: 'Kelas 7', label: 'Kelas 7 SMP/MTs' },
      { value: 'Kelas 8', label: 'Kelas 8 SMP/MTs (Standar ANBK / TKA)' },
      { value: 'Kelas 9', label: 'Kelas 9 SMP/MTs (Ujian Akhir Jenjang)' },
    ];
  }
  if (level.includes('SMA') || level.includes('MA') || level.includes('SMK')) {
    return [
      { value: 'Kelas 10', label: 'Kelas 10 SMA/MA' },
      { value: 'Kelas 11', label: 'Kelas 11 SMA/MA (Standar ANBK / TKA)' },
      { value: 'Kelas 12', label: 'Kelas 12 SMA/MA (Ujian Akhir Jenjang)' },
    ];
  }
  return [
    { value: 'Kelas 1', label: 'Kelas 1 SD/MI' },
    { value: 'Kelas 2', label: 'Kelas 2 SD/MI' },
    { value: 'Kelas 3', label: 'Kelas 3 SD/MI' },
    { value: 'Kelas 4', label: 'Kelas 4 SD/MI' },
    { value: 'Kelas 5', label: 'Kelas 5 SD/MI (Standar ANBK / TKA)' },
    { value: 'Kelas 6', label: 'Kelas 6 SD/MI (Ujian Akhir Jenjang)' },
  ];
}

/**
 * Returns the default ANBK/TKA grade when switching education levels.
 */
export function getDefaultGradeForLevel(educationLevel: string): string {
  const level = (educationLevel || '').toUpperCase();
  if (level.includes('SMP') || level.includes('MTS')) {
    return 'Kelas 8';
  }
  if (level.includes('SMA') || level.includes('MA') || level.includes('SMK')) {
    return 'Kelas 11';
  }
  return 'Kelas 5';
}

/**
 * Escapes a single CSV field according to RFC 4180 so Excel splits columns cleanly.
 */
export function escapeCsvField(val: string | number): string {
  const str = String(val ?? '')
    .replace(/\r?\n/g, ' ')
    .trim();
  if (str.includes(',') || str.includes('"') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Returns curriculum topics synchronized with subject and grade (SD/MI, SMP/MTs, SMA/MA).
 */
export function getCurriculumTopics(subject: string, grade: string): [string, string, string] {
  const subLower = (subject || '').toLowerCase();
  const gradeNum = parseInt((grade || '5').replace(/[^0-9]/g, ''), 10) || 5;
  const levelLabel =
    gradeNum >= 10
      ? 'SMA/MA'
      : gradeNum >= 7
      ? 'SMP/MTs'
      : 'SD/MI';

  if (subLower.includes('literasi') || subLower.includes('bahasa')) {
    return [
      `Menemukan Informasi (${grade} ${levelLabel}): Membaca teks fiksi dan informasi, memahami gagasan utama serta menentukan ide pokok paragraf.`,
      `Interpretasi & Integrasi (${grade} ${levelLabel}): Mengidentifikasi simpulan teks, perbandingan struktur informasi, dan makna tersirat dalam bacaan.`,
      `Refleksi & Evaluasi (${grade} ${levelLabel}): Menilai keakuratan fakta dan argumen dalam teks serta mengaitkan isi bacaan dengan konteks kehidupan nyata.`,
    ];
  }

  if (subLower.includes('numerasi') || subLower.includes('matematika')) {
    return [
      `Bilangan & Aljabar (${grade} ${levelLabel}): Operasi hitung bilangan, rasio, proporsi, persamaan, serta pemecahan masalah numerasi kontekstual.`,
      `Geometri & Pengukuran (${grade} ${levelLabel}): Karakteristik bangun datar dan ruang, teorema pengukuran luas/volume, serta penalaran spasial.`,
      `Data & Ketidakpastian (${grade} ${levelLabel}): Menganalisis diagram statistik, tabel distribusi frekuensi, rata-rata, dan peluang kejadian sederhana.`,
    ];
  }

  if (subLower.includes('ipa') || subLower.includes('ipas')) {
    return [
      `Makhluk Hidup & Ekosistem (${grade} ${levelLabel}): Interaksi komponen biotik dan abiotik dalam ekosistem, sistem organ, serta pelestarian lingkungan.`,
      `Zat, Energi & Gaya (${grade} ${levelLabel}): Hukum gerak dan gaya, konversi energi listrik dan kalor, serta sifat fisika dan kimia zat.`,
      `Bumi, Antariksa & Mitigasi (${grade} ${levelLabel}): Dinamika litosfer dan atmosfer, sistem tata surya, perubahan iklim, dan mitigasi bencana alam.`,
    ];
  }

  if (subLower.includes('agama') || subLower.includes('pai')) {
    return [
      `Al-Qur'an & Hadis (${grade} ${levelLabel}): Membaca, memahami kandungan ayat pilihan dan hadis keutamaan ilmu serta hukum bacaan tajwid.`,
      `Akidah & Akhlak (${grade} ${levelLabel}): Mengimani rukun iman, meneladani sifat mulia rasul, serta adab berbakti kepada orang tua dan guru.`,
      `Fikih Ibadah & Sejarah Peradaban Islam (${grade} ${levelLabel}): Ketentuan ibadah wajib dan sunnah, muamalah, serta sejarah keteladanan tokoh Islam.`,
    ];
  }

  return [
    `Pengenalan Konsep Dasar & Pemahaman Fakta ${subject} untuk ${grade} tingkat ${levelLabel}.`,
    `Aplikasi dan Penerapan Konsep ${subject} dalam Kehidupan Sehari-hari Peserta Didik (${grade} ${levelLabel}).`,
    `Penalaran Kritis, Pemecahan Masalah Kontekstual, dan Evaluasi Logis Materi Pokok Pembelajaran ${grade} ${levelLabel}.`,
  ];
}

/**
 * Generates a neat, Excel-ready comma-separated CSV template string for manual question authoring + answer key.
 * Uses standard RFC 4180 comma delimiter so Microsoft Excel splits columns A-I automatically without cramming into column A.
 */
export function generateQuestionTemplateCsv(subject: string = 'Literasi & Numerasi'): string {
  const headers = [
    'No',
    'Stimulus_Bacaan',
    'Pertanyaan',
    'Opsi_A',
    'Opsi_B',
    'Opsi_C',
    'Opsi_D',
    'Kunci_Jawaban',
    'Topik',
  ];

  const sampleRows = [
    [
      1,
      'Hutan Mangrove di Pesisir Konawe Selatan memiliki peranan penting untuk mencegah abrasi pantai.',
      'Apa manfaat utama penanaman hutan mangrove bagi wilayah pesisir?',
      'Mencegah abrasi pantai dan melindungi biota laut',
      'Mempercepat penguapan air laut',
      'Menjadikan pantai kering',
      'Menaikkan gelombang ombak',
      'A',
      `Ekosistem dan Lingkungan (${subject})`,
    ],
    [
      2,
      'Koperasi Sekolah membeli 5 dus pensil. Setiap dus berisi 12 batang pensil.',
      'Jika seluruh pensil dibagikan kepada 15 siswa sama banyak, berapa pensil yang diterima setiap siswa?',
      '3 batang pensil',
      '4 batang pensil',
      '5 batang pensil',
      '6 batang pensil',
      'B',
      'Operasi Hitung Bilangan',
    ],
    [
      3,
      'Warga Desa Lalembuu mengadakan kerja bakti membersihkan saluran air setiap hari Minggu pagi.',
      'Nilai Pancasila yang tercermin dari kegiatan warga tersebut adalah...',
      'Persatuan dan gotong royong',
      'Mementingkan diri sendiri',
      'Persaingan antar warga',
      'Kemewahan hidup',
      'A',
      'Nilai-Nilai Pancasila',
    ],
  ];

  const lines = [
    headers.join(','),
    ...sampleRows.map((row) => row.map(escapeCsvField).join(',')),
  ];
  return lines.join('\r\n');
}

/**
 * Generates a neat, Excel-ready comma-separated CSV template for inputting student data (Data Murid).
 */
export function generateStudentTemplateCsv(defaultGrade: string = 'Kelas 5A'): string {
  const headers = [
    'No',
    'NISN',
    'Nama_Lengkap',
    'Jenis_Kelamin',
    'Kelas',
    'Komputer_Klien',
  ];

  const sampleRows = [
    [1, '0089123451', 'Muhammad Rizky Pratama', 'L', defaultGrade, '192.168.1.121'],
    [2, '0089123452', 'Siti Aisyah Putri', 'P', defaultGrade, '192.168.1.122'],
    [3, '0089123453', 'La Ode Muh. Fajar', 'L', defaultGrade, '192.168.1.123'],
    [4, '0089123454', 'Wa Ode Nurul Hidayah', 'P', defaultGrade, '192.168.1.124'],
    [5, '0089123455', 'Andi Saputra Jaya', 'L', defaultGrade, '192.168.1.125'],
  ];

  const lines = [
    headers.join(','),
    ...sampleRows.map((row) => row.map(escapeCsvField).join(',')),
  ];
  return lines.join('\r\n');
}

/**
 * Generates structured TXT template string for manual question authoring + answer key.
 */
export function generateQuestionTemplateTxt(subject: string = 'Literasi & Numerasi'): string {
  return `# FORMAT TEMPLATE SOAL CBT SD NEGERI 4 LALEMBUU
# Mata Pelajaran: ${subject}
# Petunjuk: Tuliskan soal mengikuti format di bawah ini. Pisahkan antar soal dengan baris "---".
# Pastikan setiap soal memiliki PERTANYAAN, pilihan A, B, C, D, dan KUNCI (A/B/C/D).

NO: 1
STIMULUS: Hutan Mangrove di Pesisir Konawe Selatan memiliki peranan penting untuk mencegah abrasi pantai.
TOPIK: Ekosistem dan Lingkungan
PERTANYAAN: Apa manfaat utama penanaman hutan mangrove bagi wilayah pesisir?
A: Mencegah abrasi pantai dan melindungi biota laut
B: Mempercepat penguapan air laut
C: Menjadikan pantai kering
D: Menaikkan gelombang ombak
KUNCI: A
---
NO: 2
STIMULUS: Koperasi SD Negeri 4 Lalembuu membeli 5 dus pensil. Setiap dus berisi 12 batang pensil.
TOPIK: Operasi Hitung Bilangan
PERTANYAAN: Jika seluruh pensil dibagikan kepada 15 siswa sama banyak, berapa pensil yang diterima setiap siswa?
A: 3 batang pensil
B: 4 batang pensil
C: 5 batang pensil
D: 6 batang pensil
KUNCI: B
`;
}

/**
 * Helper to split a single CSV line respecting quotes.
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result.map((col) => col.replace(/^"|"$/g, '').trim());
}

/**
 * Detects delimiter (comma, semicolon, or tab) from a header or data line.
 */
function detectCsvDelimiter(line: string): string {
  const commaCount = (line.match(/,/g) || []).length;
  const semiCount = (line.match(/;/g) || []).length;
  const tabCount = (line.match(/\t/g) || []).length;
  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  if (semiCount > commaCount) return ';';
  return ',';
}

/**
 * Parses uploaded question file (.csv, .txt, or .json) into Question[] array.
 */
export function parseUploadedQuestions(
  content: string,
  defaultSubject: string = 'Literasi & Numerasi'
): {
  success: boolean;
  questions: Question[];
  message: string;
} {
  const trimmed = (content || '').replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    return {
      success: false,
      questions: [],
      message: 'File yang diunggah kosong. Pastikan file berisi daftar soal sesuai format.',
    };
  }

  // 1. Check if JSON format
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed) ? parsed : parsed.questions || [];
      if (Array.isArray(arr) && arr.length > 0) {
        const questions: Question[] = arr.map((item, idx) => {
          const rawKey = String(item.correctAnswer || item.kunci || 'A').trim().toUpperCase();
          const validKey = (['A', 'B', 'C', 'D'].includes(rawKey) ? rawKey : 'A') as 'A' | 'B' | 'C' | 'D';
          return {
            id: Date.now() + idx,
            number: idx + 1,
            stimulus: item.stimulus || item.bacaan || undefined,
            text: item.text || item.pertanyaan || `Soal ${idx + 1}`,
            options: item.options || [
              { key: 'A', text: String(item.opsiA || item.A || 'Opsi A') },
              { key: 'B', text: String(item.opsiB || item.B || 'Opsi B') },
              { key: 'C', text: String(item.opsiC || item.C || 'Opsi C') },
              { key: 'D', text: String(item.opsiD || item.D || 'Opsi D') },
            ],
            correctAnswer: validKey,
            subject: item.subject || defaultSubject,
            topic: item.topic || item.topik || 'Materi Kurikulum',
          };
        });
        return {
          success: true,
          questions,
          message: `Berhasil mengimpor ${questions.length} butir soal beserta kunci jawaban (format JSON).`,
        };
      }
    } catch {
      // Fall through to TXT/CSV parser
    }
  }

  // 2. Check if structured TXT format (contains PERTANYAAN: or KUNCI:)
  if (/PERTANYAAN\s*:/i.test(trimmed) && /KUNCI\s*:/i.test(trimmed)) {
    const blocks = trimmed
      .split(/\n\s*---+\s*\n/g)
      .map((b) => b.trim())
      .filter((b) => /PERTANYAAN\s*:/i.test(b));

    const questions: Question[] = [];
    blocks.forEach((block, idx) => {
      const lines = block
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));

      let stimulus = '';
      let topic = 'Materi Pokok Kurikulum';
      let text = '';
      let optA = '';
      let optB = '';
      let optC = '';
      let optD = '';
      let key: 'A' | 'B' | 'C' | 'D' = 'A';

      for (const line of lines) {
        if (/^STIMULUS\s*:/i.test(line)) {
          stimulus = line.replace(/^STIMULUS\s*:\s*/i, '').trim();
        } else if (/^TOPIK\s*:/i.test(line)) {
          topic = line.replace(/^TOPIK\s*:\s*/i, '').trim();
        } else if (/^PERTANYAAN\s*:/i.test(line)) {
          text = line.replace(/^PERTANYAAN\s*:\s*/i, '').trim();
        } else if (/^A\s*[.:]/i.test(line)) {
          optA = line.replace(/^A\s*[.:]\s*/i, '').trim();
        } else if (/^B\s*[.:]/i.test(line)) {
          optB = line.replace(/^B\s*[.:]\s*/i, '').trim();
        } else if (/^C\s*[.:]/i.test(line)) {
          optC = line.replace(/^C\s*[.:]\s*/i, '').trim();
        } else if (/^D\s*[.:]/i.test(line)) {
          optD = line.replace(/^D\s*[.:]\s*/i, '').trim();
        } else if (/^KUNCI(\s+JAWABAN)?\s*:/i.test(line)) {
          const rawK = line.replace(/^KUNCI(\s+JAWABAN)?\s*:\s*/i, '').trim().toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(rawK)) {
            key = rawK as 'A' | 'B' | 'C' | 'D';
          }
        }
      }

      if (text && optA && optB) {
        questions.push({
          id: Date.now() + idx,
          number: questions.length + 1,
          stimulus: stimulus || undefined,
          text,
          options: [
            { key: 'A', text: optA },
            { key: 'B', text: optB },
            { key: 'C', text: optC || '-' },
            { key: 'D', text: optD || '-' },
          ],
          correctAnswer: key,
          subject: defaultSubject,
          topic,
        });
      }
    });

    if (questions.length > 0) {
      return {
        success: true,
        questions,
        message: `Berhasil mengimpor ${questions.length} butir soal beserta kunci jawaban (format Template Teks).`,
      };
    }
  }

  // 3. Parse CSV format (comma, semicolon, or tab delimited; skip optional sep= directive)
  const rawLines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !/^sep\s*=/i.test(l));

  if (rawLines.length < 2) {
    return {
      success: false,
      questions: [],
      message: 'Format file tidak dikenali atau belum memiliki baris data soal. Silakan unduh format template terlebih dahulu.',
    };
  }

  const firstLine = rawLines[0];
  const delimiter = detectCsvDelimiter(firstLine);
  const startIdx = /pertanyaan|opsi_a|kunci/i.test(firstLine) ? 1 : 0;

  const questions: Question[] = [];
  for (let i = startIdx; i < rawLines.length; i++) {
    const cols = splitCsvLine(rawLines[i], delimiter);
    // Expected columns: No,Stimulus_Bacaan,Pertanyaan,Opsi_A,Opsi_B,Opsi_C,Opsi_D,Kunci_Jawaban,Topik
    if (cols.length >= 8) {
      const stimulus = cols[1];
      const questionText = cols[2];
      const optA = cols[3];
      const optB = cols[4];
      const optC = cols[5];
      const optD = cols[6];
      const rawKey = (cols[7] || 'A').trim().toUpperCase();
      const validKey = (['A', 'B', 'C', 'D'].includes(rawKey) ? rawKey : 'A') as 'A' | 'B' | 'C' | 'D';
      const topic = cols[8] || 'Materi Kurikulum';

      if (questionText) {
        questions.push({
          id: Date.now() + i,
          number: questions.length + 1,
          stimulus: stimulus ? stimulus : undefined,
          text: questionText,
          options: [
            { key: 'A', text: optA || 'Opsi A' },
            { key: 'B', text: optB || 'Opsi B' },
            { key: 'C', text: optC || 'Opsi C' },
            { key: 'D', text: optD || 'Opsi D' },
          ],
          correctAnswer: validKey,
          subject: defaultSubject,
          topic,
        });
      }
    }
  }

  if (questions.length === 0) {
    return {
      success: false,
      questions: [],
      message: 'Gagal membaca baris soal. Pastikan kolom CSV sesuai dengan format template yang diunduh (No,Stimulus_Bacaan,Pertanyaan,Opsi_A,Opsi_B,Opsi_C,Opsi_D,Kunci_Jawaban,Topik).',
    };
  }

  return {
    success: true,
    questions,
    message: `Berhasil mengunggah dan memvalidasi ${questions.length} butir soal beserta kunci jawaban!`,
  };
}

/**
 * Parses uploaded student CSV file into Student[] array.
 * Supports columns: No, NISN, Nama_Lengkap, Jenis_Kelamin, Kelas, Komputer_Klien
 * or 3+ columns: NISN, Nama_Lengkap, Kelas
 */
export function parseUploadedStudentsCsv(
  content: string,
  activeTestCode: string,
  questionCount: number = 15,
  durationMinutes: number = 45,
  existingCount: number = 0
): {
  success: boolean;
  students: Student[];
  message: string;
} {
  const trimmed = (content || '').replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    return {
      success: false,
      students: [],
      message: 'File CSV data murid kosong. Silakan unduh template CSV data murid terlebih dahulu.',
    };
  }

  const rawLines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !/^sep\s*=/i.test(l));

  if (rawLines.length === 0) {
    return {
      success: false,
      students: [],
      message: 'Tidak ada baris data murid yang ditemukan di dalam file.',
    };
  }

  const firstLine = rawLines[0];
  const delimiter = detectCsvDelimiter(firstLine);
  const hasHeader = /nisn|nama|kelas|kelamin/i.test(firstLine);
  const startIdx = hasHeader ? 1 : 0;

  const imported: Student[] = [];
  for (let i = startIdx; i < rawLines.length; i++) {
    const cols = splitCsvLine(rawLines[i], delimiter);
    if (cols.length < 2) continue;

    let nisn = '';
    let name = '';
    let gender: 'L' | 'P' = 'L';
    let grade = 'Kelas 5A';
    let ipAddress = '';

    // Check if column 0 is row number (No) and column 1 is NISN
    if (cols.length >= 4 && /^\d{1,4}$/.test(cols[0])) {
      nisn = cols[1];
      name = cols[2];
      const col3Upper = (cols[3] || '').toUpperCase();
      if (col3Upper === 'L' || col3Upper === 'P' || col3Upper.startsWith('LAKI') || col3Upper.startsWith('PEREMPUAN')) {
        gender = col3Upper.startsWith('P') ? 'P' : 'L';
        grade = cols[4] || 'Kelas 5A';
        ipAddress = cols[5] || '';
      } else {
        grade = cols[3] || 'Kelas 5A';
        ipAddress = cols[4] || '';
      }
    } else {
      nisn = cols[0];
      name = cols[1];
      grade = cols[2] || 'Kelas 5A';
      const col3Upper = (cols[3] || '').toUpperCase();
      if (col3Upper.startsWith('P')) gender = 'P';
      ipAddress = cols[4] || '';
    }

    const cleanName = (name || '').trim();
    const cleanNisn = (nisn || '').trim();
    if (!cleanName || !cleanNisn) continue;

    const seqNum = existingCount + imported.length + 1;
    imported.push({
      id: `std-csv-${Date.now()}-${i}`,
      nisn: cleanNisn,
      name: cleanName,
      gender,
      grade: grade.trim() || 'Kelas 5A',
      testCode: activeTestCode,
      status: 'idle',
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      answeredCount: 0,
      totalQuestions: questionCount,
      remainingSeconds: durationMinutes * 60,
      answers: {},
      flagged: {},
      ipAddress: ipAddress.trim() || `192.168.1.${100 + seqNum}`,
    });
  }

  if (imported.length === 0) {
    return {
      success: false,
      students: [],
      message: 'Gagal membaca baris data murid. Pastikan kolom CSV sesuai template: No, NISN, Nama_Lengkap, Jenis_Kelamin, Kelas, Komputer_Klien.',
    };
  }

  return {
    success: true,
    students: imported,
    message: `Berhasil mengimpor ${imported.length} data murid baru ke daftar peserta ujian CBT!`,
  };
}

/**
 * Verifies if a Google account email is registered and activated as a Teacher/Proktor.
 */
export function verifyActivatedTeacherEmail(
  inputEmail: string,
  teacherAccounts: TeacherAccount[]
): {
  isValid: boolean;
  teacher?: TeacherAccount;
  message: string;
} {
  const cleanEmail = (inputEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      isValid: false,
      message: 'Masukkan alamat email Akun Google guru yang valid (contoh: nama@gmail.com).',
    };
  }

  const found = teacherAccounts.find(
    (t) => t.email.trim().toLowerCase() === cleanEmail
  );

  if (!found) {
    return {
      isValid: false,
      message: `Email Google "${cleanEmail}" belum terdaftar sebagai Guru Mapel di SD Negeri 4 Lalembuu. Silakan aktifkan terlebih dahulu di menu Akun Guru & Demo.`,
    };
  }

  if (found.status !== 'active') {
    return {
      isValid: false,
      teacher: found,
      message: `Akun Google "${found.name}" (${found.email}) saat ini berstatus Non-Aktif. Hubungi Proktor/Admin untuk mengaktifkan akun.`,
    };
  }

  return {
    isValid: true,
    teacher: found,
    message: `Autentikasi Google berhasil! Selamat datang, ${found.name} (${found.subject}).`,
  };
}

/**
 * Generates an activated Demo Teacher account for testing Google Auth login.
 */
export function createDemoTeacherAccount(
  existingTeachers: TeacherAccount[],
  customName?: string,
  customSubject?: string,
  customGrade?: string
): TeacherAccount {
  const demoIndex = existingTeachers.filter((t) => t.isDemo).length + 1;
  const subjects = [
    'Literasi & Numerasi',
    'Numerasi Matematika',
    'IPAS',
    'Pendidikan Agama Islam',
    'Pendidikan Pancasila',
    'Literasi Membaca',
  ];
  const chosenSubject =
    customSubject || subjects[(demoIndex - 1) % subjects.length];
  const chosenGrade = customGrade || `Kelas ${((demoIndex + 3) % 3) + 4}`;
  const cleanName =
    customName && customName.trim().length > 0
      ? customName.trim()
      : `Guru Demo ${demoIndex}, S.Pd.`;

  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 12);

  return {
    id: `teacher-demo-${Date.now()}-${demoIndex}`,
    name: cleanName,
    email: `${slug || 'gurudemo'}${demoIndex}@gmail.com`,
    nip: `19900${demoIndex}202421100${demoIndex}`,
    subject: chosenSubject,
    grade: chosenGrade,
    role: 'guru_mapel',
    status: 'active',
    isDemo: true,
    activatedAt: new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()),
  };
}

/**
 * Generates a Demo Student account ready for immediate CBT simulation.
 */
export function createDemoStudentAccount(
  existingStudents: Student[],
  activeTestCode: string,
  questionCount: number = 15,
  durationMinutes: number = 45,
  customName?: string,
  customGrade?: string
): Student {
  const demoCount = existingStudents.filter((s) => s.isDemo).length + 1;
  const randomSuffix = Math.floor(100 + Math.random() * 899);
  const nisn = `0099${String(demoCount).padStart(3, '0')}${randomSuffix}`;
  const name =
    customName && customName.trim().length > 0
      ? customName.trim()
      : `Siswa Demo ${demoCount} (Simulasi CBT)`;

  return {
    id: `std-demo-${Date.now()}-${demoCount}`,
    nisn,
    name,
    gender: demoCount % 2 === 0 ? 'P' : 'L',
    grade: customGrade || 'Kelas 5A',
    testCode: activeTestCode,
    status: 'idle',
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    answeredCount: 0,
    totalQuestions: questionCount,
    remainingSeconds: durationMinutes * 60,
    answers: {},
    flagged: {},
    ipAddress: `192.168.1.${200 + demoCount}`,
    isDemo: true,
  };
}

