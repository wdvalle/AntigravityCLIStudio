import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SupportedLocale, TranslationSchema } from './types';
import { ptBR } from './locales/pt-BR';
import { en } from './locales/en';
import { es } from './locales/es';

const dictionaries: Record<SupportedLocale, TranslationSchema> = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
};

export const SUPPORTED_LOCALES: { id: SupportedLocale; label: string; flag: string }[] = [
  { id: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { id: 'en', label: 'English (US)', flag: '🇺🇸' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
];

/**
 * Detects the system OS locale using Electron's native getLocale() or navigator.language
 */
export function detectSystemLocale(): SupportedLocale {
  try {
    const rawLocale =
      (window as any).electronSystemLocale ||
      navigator.language ||
      (Array.isArray(navigator.languages) ? navigator.languages[0] : 'en') ||
      'en';

    const clean = rawLocale.toLowerCase();
    if (clean.startsWith('pt')) return 'pt-BR';
    if (clean.startsWith('es')) return 'es';
    return 'en';
  } catch {
    return 'en';
  }
}

interface I18nContextType {
  locale: SupportedLocale;
  isAuto: boolean;
  setLocale: (loc: SupportedLocale | 'auto') => void;
  t: <T extends string>(path: string, fallback?: string) => string;
  strings: TranslationSchema;
  supportedLocales: typeof SUPPORTED_LOCALES;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if user set an explicit language override or auto
  const [pref, setPref] = useState<string>(() => {
    return localStorage.getItem('agy_preferred_locale') || 'auto';
  });

  const [systemLocale, setSystemLocale] = useState<SupportedLocale>(() => detectSystemLocale());

  // In Electron, query the native OS locale via IPC on mount
  useEffect(() => {
    if (window.electronAPI?.getLocale) {
      window.electronAPI.getLocale().then((loc) => {
        if (loc) {
          (window as any).electronSystemLocale = loc;
          const clean = loc.toLowerCase();
          if (clean.startsWith('pt')) setSystemLocale('pt-BR');
          else if (clean.startsWith('es')) setSystemLocale('es');
          else setSystemLocale('en');
        }
      }).catch(() => {});
    }
  }, []);

  const effectiveLocale: SupportedLocale = useMemo(() => {
    if (pref === 'pt-BR' || pref === 'en' || pref === 'es') {
      return pref;
    }
    return systemLocale;
  }, [pref, systemLocale]);

  const setLocale = (newPref: SupportedLocale | 'auto') => {
    setPref(newPref);
    if (newPref === 'auto') {
      localStorage.removeItem('agy_preferred_locale');
    } else {
      localStorage.setItem('agy_preferred_locale', newPref);
    }
  };

  const strings = useMemo(() => {
    return dictionaries[effectiveLocale] || dictionaries.en;
  }, [effectiveLocale]);

  // Safe nested translation lookup (e.g. t('sidebar.newConversation'))
  const t = (path: string, fallback?: string): string => {
    const parts = path.split('.');
    let cur: any = strings;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) {
        cur = cur[p];
      } else {
        // Fallback to English dictionary if key is missing in active locale
        let fbCur: any = dictionaries.en;
        for (const fp of parts) {
          if (fbCur && typeof fbCur === 'object' && fp in fbCur) {
            fbCur = fbCur[fp];
          } else {
            fbCur = undefined;
            break;
          }
        }
        return fbCur !== undefined ? String(fbCur) : (fallback || path);
      }
    }
    return typeof cur === 'string' ? cur : (fallback || path);
  };

  const value = {
    locale: effectiveLocale,
    isAuto: pref === 'auto',
    setLocale,
    t,
    strings,
    supportedLocales: SUPPORTED_LOCALES,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
