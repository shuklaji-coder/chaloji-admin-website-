import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: { email: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

const FRIENDLY_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Invalid email or password',
  'auth/user-not-found': 'Invalid email or password',
  'auth/wrong-password': 'Invalid email or password',
  'auth/too-many-requests':
    'Too many attempts. Please try again later.',
  'auth/user-disabled': 'This account has been disabled.',
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

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      throw new Error(
        FRIENDLY_ERRORS[err?.code] || err?.message || 'Login failed'
      );
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
