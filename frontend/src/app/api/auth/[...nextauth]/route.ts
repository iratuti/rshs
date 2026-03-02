import NextAuth, { NextAuthOptions, Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

// Super Admin email - this email gets ADMIN role automatically
const SUPER_ADMIN_EMAIL = 'theomarhizal@gmail.com';

// VIP Lifetime email - this email gets premium lifetime access automatically
const VIP_LIFETIME_EMAIL = 'iratuti66@gmail.com';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'admin' | 'user';
      isPremium: boolean;
      plan: 'free' | 'monthly' | 'yearly' | 'lifetime';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'admin' | 'user';
    isPremium?: boolean;
    plan?: 'free' | 'monthly' | 'yearly' | 'lifetime';
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign in, add role and premium status based on email
      if (account && user) {
        // CRITICAL: Check if this is the super admin email
        if (token.email === SUPER_ADMIN_EMAIL) {
          token.role = 'admin';
          token.isPremium = true;
          token.plan = 'lifetime';
        } 
        // CRITICAL: Check if this is the VIP lifetime email
        else if (token.email === VIP_LIFETIME_EMAIL) {
          token.role = 'user';
          token.isPremium = true;
          token.plan = 'lifetime';
        } 
        else {
          token.role = 'user';
          token.isPremium = false;
          token.plan = 'free';
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Pass role and premium status from token to session
      if (session.user) {
        session.user.role = token.role || 'user';
        session.user.id = token.sub;
        session.user.isPremium = token.isPremium || false;
        session.user.plan = token.plan || 'free';
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Allow sign in
      return true;
    },
    async redirect({ url, baseUrl }) {
      // After sign in, redirect based on role
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl + '/dashboard';
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
