'use client';

import React from 'react';
import { renderHook } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { useUserData } from '@/hooks/user-data/useUserData';
import { userDataAtom, userDataLoadingAtom, UserData } from '@/app/recoil/atoms/user';

// Mock user data
const mockUserData: UserData = {
  id: 'test-user-123',
  avatar: 'avatar.png',
  created_at: new Date().toISOString(),
  live_screen_name: 'TestPlayer',
  preferred_games: ['pokemon-tcg'],
};

// Wrapper with initial state
const createWrapper = (userData: UserData | null, loading: boolean = false) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecoilRoot
        initializeState={({ set }) => {
          set(userDataAtom, userData);
          set(userDataLoadingAtom, loading);
        }}
      >
        {children}
      </RecoilRoot>
    );
  };
};

// Default wrapper (empty state)
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RecoilRoot>{children}</RecoilRoot>
);

describe('useUserData', () => {
  describe('when Recoil state is empty', () => {
    it('should return undefined data when no user data is stored', () => {
      const { result } = renderHook(() => useUserData('test-user-123'), { wrapper });

      expect(result.current.data).toBeUndefined();
    });

    it('should return loading true by default', () => {
      const { result } = renderHook(() => useUserData('test-user-123'), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return null error', () => {
      const { result } = renderHook(() => useUserData('test-user-123'), { wrapper });

      expect(result.current.error).toBeNull();
    });
  });

  describe('when Recoil state has user data', () => {
    it('should return user data when userId matches', () => {
      const { result } = renderHook(() => useUserData('test-user-123'), {
        wrapper: createWrapper(mockUserData, false),
      });

      expect(result.current.data).toEqual(mockUserData);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return undefined when userId does not match', () => {
      const { result } = renderHook(() => useUserData('different-user'), {
        wrapper: createWrapper(mockUserData, false),
      });

      expect(result.current.data).toBeUndefined();
    });

    it('should return undefined when userId is undefined', () => {
      const { result } = renderHook(() => useUserData(undefined), {
        wrapper: createWrapper(mockUserData, false),
      });

      expect(result.current.data).toBeUndefined();
    });
  });

  describe('loading state', () => {
    it('should reflect loading state from Recoil', () => {
      const { result } = renderHook(() => useUserData('test-user-123'), {
        wrapper: createWrapper(null, true),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should be false when not loading', () => {
      const { result } = renderHook(() => useUserData('test-user-123'), {
        wrapper: createWrapper(mockUserData, false),
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('live_screen_name access', () => {
    it('should provide access to live_screen_name', () => {
      const { result } = renderHook(() => useUserData('test-user-123'), {
        wrapper: createWrapper(mockUserData, false),
      });

      expect(result.current.data?.live_screen_name).toBe('TestPlayer');
    });

    it('should handle null live_screen_name', () => {
      const userWithNullScreenName: UserData = {
        ...mockUserData,
        live_screen_name: null,
      };

      const { result } = renderHook(() => useUserData('test-user-123'), {
        wrapper: createWrapper(userWithNullScreenName, false),
      });

      expect(result.current.data?.live_screen_name).toBeNull();
    });
  });
});
