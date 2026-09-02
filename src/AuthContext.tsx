import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export const ADMIN_EMAILS = [
  'shuklarohan388@gmail.com',
  'admin@chalojii.in',
  'chaloji.admin@gmail.com',
];

export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

interface AuthContextType {
  user: { email: string } | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

const FRIENDLY_ERRORS: Record<string, string> = {
  'auth/popup-closed-by-user': 'Sign-in window was closed before finishing.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/popup-blocked':
    'Popup blocked by browser. Please allow popups for this site.',
  'auth/unauthorized-domain':
    'This domain is not authorized for sign-in. Add it in Firebase Console.',
  'auth/operation-not-allowed':
    'Google sign-in is not enabled in Firebase Console.',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      setUser(firebaseUser ? { email: firebaseUser.email ?? '' } : null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email?.toLowerCase() ?? '';
      if (!isAllowedAdminEmail(email)) {
        await signOut(auth);
        throw new Error(
          'Access denied. Only authorized admin accounts can sign in.'
        );
      }
    } catch (err: any) {
      throw new Error(
        FRIENDLY_ERRORS[err?.code] || err?.message || 'Google sign-in failed'
      );
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
