import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

// PUT /api/admin/users/[userId] — Admin update user subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!authUser.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId } = await params;
    const body = await request.json();

    const updateFields: Record<string, unknown> = {};
    if (body.status_langganan) updateFields.status_langganan = body.status_langganan;
    if (body.berlaku_sampai) updateFields.berlaku_sampai = body.berlaku_sampai;
    if (body.role) updateFields.role = body.role;

    await connectToDatabase();

    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { _id, ...rest } = user as Record<string, unknown>;
    return NextResponse.json(rest);
  } catch (error) {
    console.error('[Admin Update User] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
