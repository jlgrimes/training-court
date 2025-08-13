'use client';

import { AtomEffect } from 'recoil';

// Generic local storage effect
export const localStorageEffect = <T>(key: string): AtomEffect<T> => ({ setSelf, onSet }) => {
  // Load from localStorage on initialization
  if (typeof window !== 'undefined') {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
      try {
        setSelf(JSON.parse(savedValue));
      } catch (error) {
        console.error(`Error parsing localStorage key "${key}":`, error);
      }
    }
  }

  // Subscribe to state changes and save to localStorage
  onSet((newValue, _, isReset) => {
    if (typeof window !== 'undefined') {
      if (isReset) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    }
  });
};

// Session storage effect for temporary data
export const sessionStorageEffect = <T>(key: string): AtomEffect<T> => ({ setSelf, onSet }) => {
  if (typeof window !== 'undefined') {
    const savedValue = sessionStorage.getItem(key);
    if (savedValue != null) {
      try {
        setSelf(JSON.parse(savedValue));
      } catch (error) {
        console.error(`Error parsing sessionStorage key "${key}":`, error);
      }
    }
  }

  onSet((newValue, _, isReset) => {
    if (typeof window !== 'undefined') {
      if (isReset) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(newValue));
      }
    }
  });
};

// Supabase sync effect for database persistence
export const supabaseEffect = <T>(
  tableName: string,
  userId: string | null
): AtomEffect<T[]> => ({ setSelf, onSet, trigger }) => {
  // Only sync if user is authenticated
  if (!userId) return;

  if (trigger === 'get') {
    // Fetch initial data from Supabase
    const fetchData = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user', userId);
      
      if (data && !error) {
        setSelf(data as T[]);
      }
    };
    
    fetchData();
  }

  // Subscribe to changes
  onSet(async (newValue) => {
    if (!userId) return;
    
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    
    // This is a simplified example - in practice, you'd want to handle
    // individual CRUD operations more carefully
    const { error } = await supabase
      .from(tableName)
      .upsert(newValue as any)
      .eq('user', userId);
    
    if (error) {
      console.error(`Error syncing ${tableName}:`, error);
    }
  });
};

// URL sync effect for query parameters
export const urlSyncEffect = <T>(paramName: string): AtomEffect<T> => ({ setSelf, onSet }) => {
  if (typeof window !== 'undefined') {
    // Read from URL on load
    const searchParams = new URLSearchParams(window.location.search);
    const value = searchParams.get(paramName);
    if (value) {
      try {
        setSelf(JSON.parse(value));
      } catch {
        setSelf(value as T);
      }
    }
  }

  // Update URL when state changes
  onSet((newValue) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newValue != null) {
        url.searchParams.set(paramName, typeof newValue === 'string' ? newValue : JSON.stringify(newValue));
      } else {
        url.searchParams.delete(paramName);
      }
      window.history.replaceState({}, '', url.toString());
    }
  });
};

// Debounced persistence effect
export const debouncedPersistenceEffect = <T>(
  key: string,
  delay: number = 1000
): AtomEffect<T> => ({ setSelf, onSet }) => {
  let timeoutId: NodeJS.Timeout;

  // Load initial value
  if (typeof window !== 'undefined') {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
      try {
        setSelf(JSON.parse(savedValue));
      } catch (error) {
        console.error(`Error parsing localStorage key "${key}":`, error);
      }
    }
  }

  // Debounced save
  onSet((newValue, _, isReset) => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        if (isReset) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(newValue));
        }
      }
    }, delay);
  });
};