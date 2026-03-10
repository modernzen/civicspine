import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile, Organization } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  organization: Organization | null;
  loading: boolean;
  needsSetup: boolean;
  signUp: (email: string, password: string, fullName: string, orgName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  completeSetup: (fullName: string, orgName: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const isSettingUp = useRef(false);

  async function fetchProfileAndOrg(userId: string): Promise<boolean> {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
      setNeedsSetup(false);
      if (profileData.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .maybeSingle();
        setOrganization(orgData);
      }
      return true;
    }
    setNeedsSetup(true);
    return false;
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfileAndOrg(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (isSettingUp.current) return;
      if (s?.user) {
        (async () => {
          await fetchProfileAndOrg(s.user.id);
        })();
      } else {
        setProfile(null);
        setOrganization(null);
        setNeedsSetup(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function completeSetup(fullName: string, orgName: string) {
    if (!user) return { error: 'Not authenticated' };
    isSettingUp.current = true;
    try {
      const { data, error } = await supabase.rpc('create_org_and_profile', {
        org_name: orgName,
        user_full_name: fullName,
        user_email: user.email ?? '',
      });

      if (error) return { error: error.message };

      setOrganization(data);
      await fetchProfileAndOrg(user.id);
      return { error: null };
    } finally {
      isSettingUp.current = false;
    }
  }

  async function signUp(email: string, password: string, fullName: string, orgName: string) {
    isSettingUp.current = true;
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) return { error: authError.message };
      if (!authData.user) return { error: 'Registration failed' };

      const { data, error } = await supabase.rpc('create_org_and_profile', {
        org_name: orgName,
        user_full_name: fullName,
        user_email: email,
      });

      if (error) {
        await supabase.auth.signOut();
        return { error: error.message };
      }

      setOrganization(data);
      await fetchProfileAndOrg(authData.user.id);
      return { error: null };
    } finally {
      isSettingUp.current = false;
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfileAndOrg(user.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setOrganization(null);
    setNeedsSetup(false);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, organization, loading, needsSetup, signUp, signIn, signOut, completeSetup, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
