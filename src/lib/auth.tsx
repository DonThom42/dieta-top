import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { emailLink, supabase } from './supabase';
import type { Profile } from './types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  profileError: string | null;
  loading: boolean;
  needsPassword: boolean;
  finishPassword: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth fora do AuthProvider');
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(emailLink.type === 'invite' || emailLink.type === 'recovery');

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setNeedsPassword(true);
      if (!s) { setProfile(null); setLoading(false); }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session?.user.id;

  const loadProfile = useCallback(async () => {
    if (!uid) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setProfileError(error ? error.message : data ? null : 'Perfil não encontrado. Peça ao administrador para conferir o seu cadastro.');
    setLoading(false);
  }, [uid]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  return (
    <Ctx.Provider
      value={{
        session, profile, profileError, loading, needsPassword,
        finishPassword: () => setNeedsPassword(false),
        refreshProfile: loadProfile,
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
