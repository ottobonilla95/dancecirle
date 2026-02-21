import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that don't require onboarding (public pages that anyone can view)
const publicRoutes = [
  '/',
  '/api/auth',
  '/api/webhook',
  '/blog',
  '/privacy-policy',
  '/tos',
  '/dev',
  '/signin',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/callback',
  '/api/auth/session',
  '/api/auth/providers',
  '/api/auth/csrf',
  '/dancer',       // Public dancer profiles
  '/dance-style',  // Public dance style pages
  '/city',         // Public city pages
  '/cities',       // Public cities list
  '/country',      // Public country pages
  '/countries',    // Public countries list
  '/continent',    // Public continent pages
  '/dj',           // Public DJ pages
  '/release',      // Public music releases
  '/releases',     // Public releases list
  '/events',       // Public events
  '/organizer-events', // Public organizer events
  '/leaderboards', // Public leaderboards
  '/music',        // Public music pages
  '/stats',        // Public stats
  '/discover',     // Public discover page
  '/invite'        // Public invite page
]

// Routes that require authentication but allow incomplete profiles
const authRoutes = [
  '/onboarding',
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals FIRST (before any auth checks)
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

  // Check if this is a public route BEFORE calling getToken (expensive!)
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Allow username routes (/{username} pattern - single segment, no slashes)
  const pathSegments = pathname.split('/').filter(Boolean);
  const isUsernameRoute = pathSegments.length === 1;

  // ========================================
  // Language Detection (for i18n)
  // ========================================
  
  const cookieLang = request.cookies.get('NEXT_LOCALE')?.value;
  const headerLang = request.headers.get('accept-language');
  
  let locale = 'en';
  let token = null;
  
  // Only get token if NOT a public or username route (saves expensive DB calls!)
  if (!isPublicRoute && !isUsernameRoute) {
    token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Determine language (priority: user DB preference > cookie > header > default 'en')
    if (token?.preferredLanguage && ['en', 'es'].includes(token.preferredLanguage as string)) {
      locale = token.preferredLanguage as string;
    } else if (cookieLang && ['en', 'es'].includes(cookieLang)) {
      locale = cookieLang;
    } else if (headerLang?.includes('es')) {
      locale = 'es';
    }
  } else {
    // For public routes, just use cookie or header
    if (cookieLang && ['en', 'es'].includes(cookieLang)) {
      locale = cookieLang;
    } else if (headerLang?.includes('es')) {
      locale = 'es';
    }
  }

  // Add locale to request headers for server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);

  // ========================================
  // Authentication & Onboarding Logic
  // ========================================

  // Allow public routes (already checked above)
  if (isPublicRoute) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Allow username routes (already checked above)
  if (isUsernameRoute) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // If not authenticated, allow normal auth flow (will be handled by individual layouts)
  if (!token) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Allow auth-related routes for authenticated users
  if (authRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // If profile incomplete, redirect to onboarding
  if (token.isProfileComplete !== true) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // If profile complete but accessing onboarding, redirect to dashboard
  if (pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - api/webhook (webhook routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|api/webhook|_next/static|_next/image|favicon.ico).*)',
  ],
}
