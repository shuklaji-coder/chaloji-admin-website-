import { createContext, useContext, useState, type ReactNode } from 'react';



interface AuthContextType {

  user: { email: string } | null;

  loading: boolean;

  login: (email: string, password: string) => Promise<void>;

  logout: () => Promise<void>;

}



const AuthContext = createContext<AuthContextType>(null!);



// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@chalojii.in';
const ADMIN_PASSWORD = 'admin123';



export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<{ email: string } | null>(null);

  const [loading, setLoading] = useState(false);



  const login = async (email: string, password: string) => {

    setLoading(true);

    console.log('[Auth] Login attempt:', email, password);
    console.log('[Auth] Expected:', ADMIN_EMAIL, ADMIN_PASSWORD);

    try {

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {

        console.log('[Auth] Login successful');
        setUser({ email: ADMIN_EMAIL });

      } else {

        console.log('[Auth] Invalid credentials');
        throw new Error('Invalid email or password');

      }

    } finally {

      setLoading(false);

    }

  };



  const logout = async () => {

    setUser(null);

  };



  return (

    <AuthContext.Provider value={{ user, loading, login, logout }}>

      {children}

    </AuthContext.Provider>

  );

}



export function useAuth() {

  return useContext(AuthContext);

}

