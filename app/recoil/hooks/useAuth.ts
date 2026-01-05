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

  // Hydrate auth state from server-provided user (call this from a component that has server data)
  const hydrateUser = useCallback((serverUser: User | null) => {
    setUser(serverUser);
    setIsAuthenticated(!!serverUser);
    setAuthLoading(false);
  }, [setUser, setIsAuthenticated, setAuthLoading]);

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

  // Listen for auth state changes (sign in/out events) - but don't fetch on mount
  useEffect(() => {
    let subscription: any;

    const setupAuthListener = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      // Only listen for auth state changes, don't fetch current user
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
    };

    setupAuthListener();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [setIsAuthenticated, setUser, setSession]);

  return {
    user,
    userProfile,
    session,
    isAuthenticated,
    authLoading,
    isPremium,
    isAdmin,
    displayName,
    hydrateUser,
    login,
    logout,
    updateProfile,
  };
}