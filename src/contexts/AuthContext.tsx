import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName })
      .select()
      .single();

    if (orgError) return { error: orgError.message };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        organization_id: org.id,
        role: 'admin',
        full_name: fullName,
        email: user.email ?? '',
      });

    if (profileError) return { error: profileError.message };

    setOrganization(org);
    await fetchProfileAndOrg(user.id);
    return { error: null };
  }

  async function signUp(email: string, password: string, fullName: string, orgName: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'Registration failed' };

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName })
      .select()
      .single();

    if (orgError) {
      await supabase.auth.signOut();
      return { error: orgError.message };
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        organization_id: org.id,
        role: 'admin',
        full_name: fullName,
        email,
      });

    if (profileError) {
      await supabase.auth.signOut();
      return { error: profileError.message };
    }

    setOrganization(org);
    await fetchProfileAndOrg(authData.user.id);
    return { error: null };
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
