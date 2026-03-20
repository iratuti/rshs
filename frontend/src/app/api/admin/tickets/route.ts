import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Ticket } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/admin/tickets — Admin only: list ALL tickets
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
    const tickets = await Ticket.find({}).sort({ created_at: -1 }).lean();

    return NextResponse.json(
      tickets.map(t => {
        const { _id, ...rest } = t as Record<string, unknown>;
        return rest;
      })
    );
  } catch (error) {
    console.error('[Admin Tickets] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
