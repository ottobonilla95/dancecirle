import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const LOCALES = ['en', 'es']
const DEFAULT_LOCALE = 'en'

// Routes that don't require onboarding (public pages that anyone can view)
const publicRoutes = [
  '/',
  '/privacy-policy',
  '/tos',
  '/dev',
  '/signin',
  '/dancer',
  '/dance-style',
  '/city',
  '/cities',
  '/country',
  '/countries',
  '/continent',
  '/dj',
  '/release',
  '/releases',
  '/events',
  '/organizer-events',
  '/leaderboards',
  '/music',
  '/stats',
  '/discover',
  '/invite'
]

// Routes that require authentication but allow incomplete profiles
const authRoutes = [
  '/onboarding',
]

// API routes that allow incomplete profiles
const authApiRoutes = [
  '/api/user/profile',
  '/api/user/check-username',
  '/api/user/delete-account',
  '/api/imagekit-auth',
  '/api/upload-profile-pic',
  '/api/dance-styles',
  '/api/cities',
  '/api/countries',
  '/api/continents'
]

/**
 * Detect the preferred locale from the request.
 * Priority: NEXT_LOCALE cookie > accept-language header > default
 */
function detectLocale(request: NextRequest, token?: any): string {
  // User DB preference (only available for authenticated users)
  if (token?.preferredLanguage && LOCALES.includes(token.preferredLanguage as string)) {
    return token.preferredLanguage as string
  }

  // Cookie preference
  const cookieLang = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLang && LOCALES.includes(cookieLang)) {
    return cookieLang
  }

  // Accept-language header
  const headerLang = request.headers.get('accept-language')
  if (headerLang?.includes('es')) {
    return 'es'
  }

  return DEFAULT_LOCALE
}

/**
 * Strip locale prefix from pathname to get the "real" path.
 * e.g., /en/dashboard -> /dashboard, /es/cities -> /cities
 */
function stripLocale(pathname: string): { locale: string | null; path: string } {
  const segments = pathname.split('/')
  // segments[0] is empty string (leading slash), segments[1] might be locale
  if (segments.length >= 2 && LOCALES.includes(segments[1])) {
    return {
      locale: segments[1],
      path: '/' + segments.slice(2).join('/') || '/',
    }
  }
  return { locale: null, path: pathname }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ========================================
  // Skip static files and Next.js internals
  // ========================================
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/apple-icon.png') ||
    pathname.startsWith('/icon.png') ||
    pathname.startsWith('/opengraph-image.png') ||
    pathname.startsWith('/twitter-image.png')
  ) {
    return NextResponse.next()
  }

  // ========================================
  // Skip API routes (not locale-prefixed)
  // ========================================
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ========================================
  // Locale Detection & Redirect
  // ========================================
  const { locale: urlLocale, path: strippedPath } = stripLocale(pathname)

  // If URL has no locale prefix, redirect to locale-prefixed version
  if (!urlLocale) {
    // For non-prefixed URLs, detect locale without expensive token fetch
    const locale = detectLocale(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(url, 301)
  }

  // URL has a valid locale prefix — set x-locale header for server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', urlLocale)

  // ========================================
  // Route Matching (using stripped path, without locale prefix)
  // ========================================
  const isPublicRoute = publicRoutes.some(
    route => strippedPath === route || strippedPath.startsWith(route + '/')
  )

  // Username routes: /{locale}/{username} — single segment after locale
  const pathSegments = strippedPath.split('/').filter(Boolean)
  const isUsernameRoute = pathSegments.length === 1

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Allow username routes
  if (isUsernameRoute) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ========================================
  // Authentication & Onboarding Logic
  // ========================================
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // Update locale detection with token (user DB preference)
  if (token?.preferredLanguage && LOCALES.includes(token.preferredLanguage as string)) {
    requestHeaders.set('x-locale', token.preferredLanguage as string)
  }

  // If not authenticated, allow normal auth flow
  if (!token) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Allow auth-related routes for authenticated users
  if (authRoutes.some(route => strippedPath === route || strippedPath.startsWith(route + '/'))) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // If profile incomplete, redirect to onboarding
  if (token.isProfileComplete !== true) {
    return NextResponse.redirect(new URL(`/${urlLocale}/onboarding`, request.url))
  }

  // If profile complete but accessing onboarding, redirect to dashboard
  if (strippedPath === '/onboarding') {
    return NextResponse.redirect(new URL(`/${urlLocale}/dashboard`, request.url))
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/((?!api/auth|api/webhook|_next/static|_next/image|favicon.ico).*)',
  ],
}
