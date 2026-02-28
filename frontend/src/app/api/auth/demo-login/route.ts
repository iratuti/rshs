import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';

// Demo users credentials
const DEMO_USERS = {
  'admin@demo.com': {
    password: 'password',
    user: {
      user_id: 'demo_admin_001',
      email: 'admin@demo.com',
      name: 'Demo Admin',
      role: 'ADMIN',
      ruangan_rs: 'Admin Office',
      status_langganan: 'ACTIVE',
      berlaku_sampai: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  },
  'user@demo.com': {
    password: 'password',
    user: {
      user_id: 'demo_user_001',
      email: 'user@demo.com',
      name: 'Demo User',
      role: 'USER',
      ruangan_rs: 'Ruang Melati',
      status_langganan: 'TRIAL',
      berlaku_sampai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Check demo credentials
    const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS];
    if (demoUser && demoUser.password === password) {
      // Try to connect to DB and upsert user
      try {
        await connectToDatabase();
        await User.findOneAndUpdate(
          { email },
          { ...demoUser.user, updated_at: new Date() },
          { upsert: true, new: true }
        );
      } catch {
        // DB connection failed, continue with demo user anyway
      }

      const response = NextResponse.json({
        user: demoUser.user,
        session_token: `demo_session_${uuidv4()}`
      });

      // Set session cookie
      response.cookies.set('session', `demo_${email}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
