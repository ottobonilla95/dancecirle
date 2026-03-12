'use client';

import NextLink from 'next/link';
import {
  usePathname as useNextPathname,
  useRouter as useNextRouter,
  useParams,
} from 'next/navigation';
import { forwardRef, ComponentProps } from 'react';

const LOCALES = ['en', 'es'];

/**
 * Get current locale from the URL pathname.
 */
function getLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/');
  if (segments.length >= 2 && LOCALES.includes(segments[1])) {
    return segments[1];
  }
  return 'en';
}

/**
 * Prefix an href with the current locale if not already prefixed.
 */
function prefixHref(href: string, locale: string): string {
  if (typeof href !== 'string') return href;

  // Already has locale prefix
  if (LOCALES.some((l) => href === `/${l}` || href.startsWith(`/${l}/`))) {
    return href;
  }

  // External or hash-only links
  if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
    return href;
  }

  // Ensure leading slash
  const path = href.startsWith('/') ? href : `/${href}`;
  return `/${locale}${path}`;
}

/**
 * Locale-aware Link component.
 * Automatically prefixes href with the current locale from the URL.
 */
export const Link = forwardRef<
  HTMLAnchorElement,
  ComponentProps<typeof NextLink>
>(function LocaleLink({ href, ...props }, ref) {
  const pathname = useNextPathname();
  const locale = getLocaleFromPathname(pathname);
  const prefixed = prefixHref(typeof href === 'string' ? href : (href as any).pathname || '', locale);

  return <NextLink ref={ref} href={prefixed} {...props} />;
});

/**
 * Locale-aware usePathname.
 * Returns the pathname WITHOUT the locale prefix.
 */
export function usePathname(): string {
  const pathname = useNextPathname();
  const locale = getLocaleFromPathname(pathname);
  if (pathname === `/${locale}`) return '/';
  if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  return pathname;
}

/**
 * Locale-aware useRouter.
 * push() and replace() automatically prefix paths with the current locale.
 */
export function useRouter() {
  const router = useNextRouter();
  const pathname = useNextPathname();
  const locale = getLocaleFromPathname(pathname);

  return {
    ...router,
    push(href: string, options?: any) {
      router.push(prefixHref(href, locale), options);
    },
    replace(href: string, options?: any) {
      router.replace(prefixHref(href, locale), options);
    },
  };
}
