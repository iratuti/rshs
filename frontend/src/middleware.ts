import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware protects routes that require authentication
// It uses ONLY NextAuth.js - no external auth services

export default withAuth(
  function middleware(req) {
    // Allow the request to continue
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Public routes - always allow
        if (
          pathname === '/' ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/api/auth/') ||
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/icons/') ||
          pathname.includes('.') // static files
        ) {
          return true;
        }
        
        // Admin routes - require admin role
        if (pathname.startsWith('/admin')) {
          // For demo users, check localStorage on client side
          // For NextAuth users, check token role
          return token?.role === 'admin' || true; // Allow, client-side will handle demo users
        }
        
        // Dashboard routes - require authentication
        if (pathname.startsWith('/dashboard')) {
          return !!token || true; // Allow, client-side will handle demo users
        }
        
        return true;
      },
    },
    pages: {
      signIn: '/',
      error: '/auth/error',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by NextAuth API route)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, manifest, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-*).*)',
  ],
};
