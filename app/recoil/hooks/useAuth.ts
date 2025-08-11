'use client';

import { useRecoilState, useRecoilValue } from 'recoil';
import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import {
  userAtom,
  userProfileAtom,
  sessionAtom,
  isAuthenticatedAtom,
  authLoadingAtom,
} from '../atoms/user';
import {
  isPremiumUserSelector,
  isAdminUserSelector,
  userDisplayNameSelector,
} from '../selectors/user';

export function useAuth() {
  const [user, setUser] = useRecoilState(userAtom);
  const [userProfile, setUserProfile] = useRecoilState(userProfileAtom);
  const [session, setSession] = useRecoilState(sessionAtom);
  const [isAuthenticated, setIsAuthenticated] = useRecoilState(isAuthenticatedAtom);
  const [authLoading, setAuthLoading] = useRecoilState(authLoadingAtom);
  
  const isPremium = useRecoilValue(isPremiumUserSelector);
  const isAdmin = useRecoilValue(isAdminUserSelector);
  const displayName = useRecoilValue(userDisplayNameSelector);
  
  const router = useRouter();

  const login = useCallback((user: User, sessionToken: string) => {
    setUser(user);
    setSession(sessionToken);
    setIsAuthenticated(true);
    setAuthLoading(false);
  }, [setUser, setSession, setIsAuthenticated, setAuthLoading]);

  const logout = useCallback(async () => {
    setUser(null);
    setUserProfile(null);
    setSession(null);
    setIsAuthenticated(false);
    router.push('/login');
  }, [setUser, setUserProfile, setSession, setIsAuthenticated, router]);

  const updateProfile = useCallback((updates: Partial<typeof userProfile>) => {
    setUserProfile(prev => prev ? { ...prev, ...updates } : null);
  }, [setUserProfile]);

  const checkAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
      } else {
        setUser(user);
        setIsAuthenticated(true);
        
        // Also listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setUser(session.user);
            setSession(session.access_token);
            setIsAuthenticated(true);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
            setIsAuthenticated(false);
          }
        });
        
        // Clean up subscription on unmount
        return () => subscription.unsubscribe();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }, [setAuthLoading, setIsAuthenticated, setUser, setSession]);

  useEffect(() => {
    let subscription: any;
    
    const initAuth = async () => {
      setAuthLoading(true);
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        
        // Check current user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
        } else {
          setUser(user);
          setIsAuthenticated(true);
        }
        
        // Listen for auth state changes
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setUser(session.user);
            setSession(session.access_token);
            setIsAuthenticated(true);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
            setIsAuthenticated(false);
          }
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };
    
    initAuth();
    
    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [setAuthLoading, setIsAuthenticated, setUser, setSession]);

  return {
    user,
    userProfile,
    session,
    isAuthenticated,
    authLoading,
    isPremium,
    isAdmin,
    displayName,
    login,
    logout,
    updateProfile,
    checkAuth,
  };
}