import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/users (Admin only)
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Akses admin diperlukan' }, { status: 403 });
    }

    await connectToDatabase();
    const users = await User.find({}).sort({ created_at: -1 }).lean();
    return NextResponse.json(users.map(u => ({ ...u, _id: undefined })));
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
