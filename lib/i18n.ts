import { headers as getHeaders } from 'next/headers';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

type Messages = typeof enMessages;
export type Locale = 'en' | 'es';

const messages: Record<Locale, Messages> = {
  en: enMessages,
  es: esMessages,
};

export async function getLocale(): Promise<Locale> {
  try {
    // Get locale from x-locale header set by middleware
    const headers = await getHeaders();
    const locale = headers.get('x-locale');

    if (locale && ['en', 'es'].includes(locale)) {
      return locale as Locale;
    }

    return 'en';
  } catch (error) {
    return 'en';
  }
}

export async function getMessages(locale?: Locale): Promise<Messages> {
  const currentLocale = locale || await getLocale();
  return messages[currentLocale] || messages.en;
}

// Helper function to get nested translation
export function getTranslation(messages: Messages, key: string): string {
  const keys = key.split('.');
  let value: any = messages;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return key;
  }

  return typeof value === 'string' ? value : key;
}

// String interpolation: replaces {var} placeholders with values
export function tReplace(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replaceAll(`{${key}}`, String(val)),
    template
  );
}

// Shorthand translation function for server components
export async function t(key: string, locale?: Locale): Promise<string> {
  const msgs = await getMessages(locale);
  return getTranslation(msgs, key);
}
