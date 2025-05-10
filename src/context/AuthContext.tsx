import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, SubscriptionTier } from '../types/userTypes';
import analytics from '@react-native-firebase/analytics';
import Purchases from 'react-native-purchases';

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
    setLoading(true);
    try {
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
        return { error };
      }

      // Automatically sign in after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return { error: signInError };
      }

      // Log sign_up event after successful auto-login
      try {
        await analytics().logEvent('sign_up');
      } catch (analyticsError) {
        console.error('[Analytics] Error logging sign_up event:', analyticsError);
      }

      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] signUp error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setLoading(false);
        return { error };
      }

      if (data.session) {
        // Save auth session
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
        
        // Fetch user profile from Supabase (Still useful for checking existence/data)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username') // Only fetch what might be needed immediately, UserContext will fetch full profile
          .eq('id', data.session.user.id)
          .single();
          
        if (profileError) {
          // Don't necessarily fail the whole login, UserContext can try again
        } else {
           // We fetched it, but we won't update UserContext from here anymore.
        }
        
        // Still useful to ensure registration status is marked true in storage on login
        const registrationStatus = { isRegistered: true, lastCheck: new Date().toISOString() };
        await AsyncStorage.setItem('@registration_status', JSON.stringify(registrationStatus));
        
        // *** Identify user with RevenueCat ***
        const userId = data.session.user.id;
        try {
          await Purchases.logIn(userId);
        } catch (rcError) {
          console.error('[AuthContext] RevenueCat Purchases.logIn error:', rcError);
          // Decide if this should be a critical error or just logged
        }
        // *** End RevenueCat Identification ***

        // Log login event after successful sign in and data processing
        try {
          await analytics().logEvent('login');
        } catch (analyticsError) {
          console.error('[Analytics] Error logging login event:', analyticsError);
        }
      }
      
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] signIn error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Log sign_out event before clearing data
      try {
        await analytics().logEvent('sign_out');
      } catch (analyticsError) {
        console.error('[Analytics] Error logging sign_out event:', analyticsError);
      }

      // *** Log out of RevenueCat ***
      try {
        await Purchases.logOut();
      } catch (rcError) {
        console.error('[AuthContext] RevenueCat Purchases.logOut error:', rcError);
        // Decide if this should be a critical error or just logged
      }
      // *** End RevenueCat Logout ***

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