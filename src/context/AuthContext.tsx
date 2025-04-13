import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = '@auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load session from AsyncStorage first
    const loadStoredSession = async () => {
      try {
        const storedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          setSession(parsedSession);
          setUser(parsedSession.user);
        }
      } catch (error) {
        console.error('Error loading stored session:', error);
      }
    };

    // Then get current session from Supabase
    const initSession = async () => {
      try {
        await loadStoredSession();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
          setSession(session);
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem(SESSION_KEY);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Attempting signup with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'steppet://auth/callback',
          data: {
            // Additional user metadata if needed
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return { error };
      }

      // Automatically sign in after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        return { error: signInError };
      }

      console.log('Signup and auto-login successful:', data);
      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }

      if (data.session) {
        // Save auth session
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
        
        // Fetch user profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return { error: profileError };
        }

        // Save user data to AsyncStorage
        const userData = {
          id: profileData.id,
          username: profileData.username,
          createdAt: profileData.created_at,
          lastActive: profileData.last_active,
          subscription: {
            tier: 'free',
            startDate: new Date().toISOString(),
            endDate: null,
            isActive: true,
            autoRenew: false
          },
          isRegistered: true
        };
        
        await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear all user-related data
      const keysToRemove = [
        SESSION_KEY,
        '@user_data',
        '@pet_data',
        '@onboarding_complete',
        '@registration_status',
        '@paywall_active'
      ];
      
      await Promise.all(keysToRemove.map(key => AsyncStorage.removeItem(key)));
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 