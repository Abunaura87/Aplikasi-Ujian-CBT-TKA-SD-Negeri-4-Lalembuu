import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { TeacherAccount } from './types/cbt';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Dedicated Google Auth Provider for Firebase Authentication sign-in (Proktor & Guru Mapel)
export const authGoogleProvider = new GoogleAuthProvider();
authGoogleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Google Auth Provider with Drive scope for ANBK Google Drive Archive
export const googleProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => googleProvider.addScope(scope));
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory access token cache (never stored in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const signInWithFirebaseGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, authGoogleProvider);
  return result.user;
};

export const logoutFirebase = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleDriveSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Drive sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogleDrive = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Defensive payload sanitizer ensuring every TeacherAccount document written to Firestore
 * strictly conforms to firebase-blueprint.json & firestore.rules validation constraints.
 */
export function sanitizeTeacherForFirestore(
  teacher: TeacherAccount,
  ownerUid: string
): Record<string, string | boolean> {
  const safeId = (teacher.id || `teacher-${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);
  const safeName = (teacher.name || 'Guru Mapel').trim().slice(0, 120);
  const safeNip = (teacher.nip && teacher.nip.trim() ? teacher.nip.trim() : '-').slice(
    0,
    40
  );
  const safeEmail = (teacher.email || 'guru@sdn4lalembuu.sch.id')
    .trim()
    .toLowerCase()
    .slice(0, 160);
  const safeSubject = (teacher.subject || 'Literasi & Numerasi')
    .trim()
    .slice(0, 80);
  const safeGrade = (teacher.grade || 'Kelas 5').trim().slice(0, 40);
  const safeRole = teacher.role === 'proktor' ? 'proktor' : 'guru_mapel';
  const safeStatus = teacher.status === 'inactive' ? 'inactive' : 'active';
  const safeActivatedAt = (teacher.activatedAt || '27 Okt 2026')
    .trim()
    .slice(0, 60);
  const safeOwnerId = (ownerUid || 'system').trim().slice(0, 128);

  return {
    id: safeId.length >= 1 ? safeId : 'teacher-1',
    name: safeName.length >= 2 ? safeName : 'Guru SDN 4',
    nip: safeNip.length >= 1 ? safeNip : '-',
    email: safeEmail.length >= 5 ? safeEmail : 'guru@sdn4lalembuu.sch.id',
    subject: safeSubject.length >= 2 ? safeSubject : 'Umum',
    grade: safeGrade.length >= 2 ? safeGrade : 'Kelas 5',
    role: safeRole,
    status: safeStatus,
    isDemo: Boolean(teacher.isDemo),
    activatedAt: safeActivatedAt.length >= 1 ? safeActivatedAt : '27 Okt 2026',
    ownerId: safeOwnerId,
  };
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
};
export type { User };
