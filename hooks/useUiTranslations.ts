'use client';

import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { userPreferencesAtom } from '@/app/recoil/atoms/preferences';
import { normalizeLocale, uiString, type UIKey, type UILocale } from '@/lib/i18n/ui';

export const useUiTranslations = () => {
  const preferences = useRecoilValue(userPreferencesAtom);
  const locale = useMemo<UILocale>(() => normalizeLocale(preferences.language), [preferences.language]);

  const t = useMemo(() => {
    return (key: UIKey, vars?: Record<string, string | number>) => uiString(locale, key, vars);
  }, [locale]);

  return { locale, t };
};

