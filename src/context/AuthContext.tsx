import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, SubscriptionTier } from '../types/userTypes';

// Export the type
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

// Export the context object
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      console.log(`[AuthContext] onAuthStateChange triggered. Event: ${_event}, Session: ${!!session}`);
      if (session) {
        console.log('[AuthContext] Saving session to AsyncStorage');
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        console.log('[AuthContext] Removing session from AsyncStorage');
        await AsyncStorage.removeItem(SESSION_KEY);
      }
      console.log('[AuthContext] Setting session state');
      setSession(session);
      console.log('[AuthContext] Setting user state');
      setUser(session?.user ?? null);
      console.log('[AuthContext] Setting loading state to false');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    console.log('[AuthContext] signUp started');
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
      console.log('[AuthContext] signUp successful, setting loading false');
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] signUp error:', error);
      console.log('[AuthContext] signUp error, setting loading false');
      setLoading(false);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    console.log('[AuthContext] signIn started');
    try {
      console.log('[AuthContext] Calling signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log(`[AuthContext] signInWithPassword result. Error: ${!!error}, Session: ${!!data.session}`);
      
      if (error) {
        setLoading(false);
        return { error };
      }

      if (data.session) {
        // Save auth session
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
        console.log('[AuthContext] Session saved after sign in');
        
        // Fetch user profile from Supabase
        console.log('[AuthContext] Fetching profile after sign in...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileError) {
          console.error('[AuthContext] Error fetching user profile:', profileError);
          setLoading(false);
          return { error: profileError };
        }
        console.log('[AuthContext] Profile fetched successfully');

        // Create user data object
        const userData: UserData = {
          id: profileData.id,
          username: profileData.username,
          createdAt: profileData.created_at,
          lastActive: profileData.last_active,
          subscription: {
            tier: 'free' as SubscriptionTier,
            startDate: new Date().toISOString(),
            endDate: null,
            isActive: true,
            autoRenew: false
          },
          isRegistered: true
        };
        
        // Save user data to AsyncStorage
        console.log('[AuthContext] Saving user data to AsyncStorage...');
        await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
        console.log('[AuthContext] User data saved to AsyncStorage');

        // *** Also save registration status directly to AsyncStorage ***
        const registrationStatus = { isRegistered: true, lastCheck: new Date().toISOString() };
        console.log(`[AuthContext] Saving registrationStatus to AsyncStorage: ${JSON.stringify(registrationStatus)}`);
        await AsyncStorage.setItem('@registration_status', JSON.stringify(registrationStatus));
      }
      
      console.log('[AuthContext] signIn successful, setting loading false');
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] signIn error:', error);
      console.log('[AuthContext] signIn error, setting loading false');
      setLoading(false);
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