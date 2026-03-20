import NextAuth, { NextAuthOptions, Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

// Super Admin email - this email gets ADMIN role automatically
const SUPER_ADMIN_EMAIL = 'theomahrizal@gmail.com';

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
    async signIn({ user }) {
      // Persist user to database on every Google sign-in
      try {
        await connectToDatabase();
        const email = user.email;
        if (!email) return true;

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
          // Create new user
          const isAdmin = email === SUPER_ADMIN_EMAIL;
          const isVip = email === VIP_LIFETIME_EMAIL;
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + (isVip || isAdmin ? 365 : 7));

          await User.create({
            user_id: user.id || `google_${email.split('@')[0]}_${Date.now().toString(36)}`,
            name: user.name || email.split('@')[0],
            email,
            picture: user.image || '',
            ruangan_rs: isAdmin ? 'Admin Office' : null,
            role: isAdmin ? 'ADMIN' : 'USER',
            status_langganan: (isVip || isAdmin) ? 'ACTIVE' : 'TRIAL',
            berlaku_sampai: trialEnd.toISOString(),
            created_at: new Date().toISOString(),
          });
          console.log(`[NextAuth] New user created: ${email}`);
        } else {
          // Update last login info
          await User.updateOne(
            { email },
            { $set: { name: user.name || existingUser.name, picture: user.image || existingUser.picture, last_login: new Date().toISOString() } }
          );
        }
      } catch (error) {
        console.error('[NextAuth] Error persisting user:', error);
        // Don't block sign-in if DB fails
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // On initial sign in, set defaults
      if (account && user) {
        token.role = 'user';
        token.isPremium = false;
        token.plan = 'free';

        // VIP lifetime email
        if (token.email === VIP_LIFETIME_EMAIL) {
          token.isPremium = true;
          token.plan = 'lifetime';
        }
      }

      // ALWAYS enforce super admin role on every token refresh (safety net)
      if (token.email === SUPER_ADMIN_EMAIL) {
        token.role = 'admin';
        token.isPremium = true;
        token.plan = 'lifetime';
      }

      // ALWAYS enforce VIP lifetime on every token refresh
      if (token.email === VIP_LIFETIME_EMAIL) {
        token.isPremium = true;
        token.plan = 'lifetime';
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role || 'user';
        session.user.id = token.sub;
        session.user.isPremium = token.isPremium || false;
        session.user.plan = token.plan || 'free';
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
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
