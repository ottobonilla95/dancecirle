"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

type Messages = typeof enMessages;
type Locale = 'en' | 'es';

interface I18nContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messagesByLocale: Record<Locale, Messages> = {
  en: enMessages,
  es: esMessages,
};

function getTranslation(messages: Messages, key: string): string {
  const keys = key.split('.');
  let value: any = messages;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return key;
  }

  return typeof value === 'string' ? value : key;
}

export function I18nProvider({ children, initialLocale = 'en' }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(messagesByLocale[initialLocale]);
  const pathname = usePathname();
  const router = useRouter();

  // Update state if initialLocale changes
  useEffect(() => {
    setLocaleState(initialLocale);
    setMessages(messagesByLocale[initialLocale]);
  }, [initialLocale]);

  const setLocale = async (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Set cookie for middleware detection on non-prefixed URLs
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;

    // Update state
    setLocaleState(newLocale);
    setMessages(messagesByLocale[newLocale]);

    // Update user preference in database if logged in
    try {
      await fetch('/api/user/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLocale }),
      });
    } catch (error) {
      console.error('Failed to update language preference:', error);
    }

    // Navigate to the same page with new locale prefix
    // Replace /en/... or /es/... with /newLocale/...
    const newPathname = pathname.replace(/^\/(en|es)/, `/${newLocale}`);
    router.push(newPathname);
    router.refresh();
  };

  const t = (key: string) => getTranslation(messages, key);

  return (
    <I18nContext.Provider value={{ locale, messages, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
