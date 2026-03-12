import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cookies } from 'next/headers';

const SUPER_ADMIN_EMAIL = 'theomarhizal@gmail.com';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isAdmin: boolean;
}

/**
 * Get the authenticated user from NextAuth session or demo cookie.
 * Returns null if no valid session exists.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  // 1. Check NextAuth session first
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const isAdmin = session.user.role === 'admin' || session.user.email === SUPER_ADMIN_EMAIL;
    return {
      userId: session.user.id || session.user.email,
      email: session.user.email,
      name: session.user.name || '',
      role: isAdmin ? 'admin' : 'user',
      isAdmin,
    };
  }

  // 2. Fallback to demo cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (sessionCookie) {
    const isAdmin = sessionCookie.includes('admin');
    const email = sessionCookie.replace('demo_', '');
    const userId = email.replace('@demo.com', '_demo_001');
    return {
      userId: isAdmin ? 'demo_admin_001' : 'demo_user_001',
      email: email,
      name: isAdmin ? 'Demo Admin' : 'Demo User',
      role: isAdmin ? 'admin' : 'user',
      isAdmin,
    };
  }

  return null;
}

/**
 * Require authentication. Returns AuthUser or throws a Response.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized - Silakan login terlebih dahulu' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}

/**
 * Require admin role. Returns AuthUser or throws a Response.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!user.isAdmin) {
    throw new Response(JSON.stringify({ error: 'Forbidden - Akses admin diperlukan' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}
