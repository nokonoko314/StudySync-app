import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication, type User } from '@capacitor-firebase/authentication';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setLoading(false);
      return;
    }
    let mounted = true;
    FirebaseAuthentication.getCurrentUser()
      .then((r) => { if (mounted) setUser(r.user); })
      .catch(() => { /* Firebase not configured yet (no google-services.json) */ })
      .finally(() => { if (mounted) setLoading(false); });

    const listenerPromise = FirebaseAuthentication.addListener('authStateChange', (change) => {
      setUser(change.user ?? null);
    });
    return () => {
      mounted = false;
      listenerPromise.then((l) => l.remove()).catch(() => {});
    };
  }, []);

  const signIn = async () => {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Google連携はアプリ版でのみ利用できます');
    }
    await FirebaseAuthentication.signInWithGoogle();
  };

  const signOut = async () => {
    if (!Capacitor.isNativePlatform()) return;
    await FirebaseAuthentication.signOut();
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
