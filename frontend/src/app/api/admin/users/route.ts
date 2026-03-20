import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/admin/users — Admin only: list ALL users
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const users = await User.find({}).sort({ created_at: -1 }).lean();

    return NextResponse.json(
      users.map(u => {
        const { _id, ...rest } = u as Record<string, unknown>;
        return rest;
      })
    );
  } catch (error) {
    console.error('[Admin Users] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
