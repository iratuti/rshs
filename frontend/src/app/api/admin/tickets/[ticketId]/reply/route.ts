import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Ticket } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

// PUT /api/admin/tickets/[ticketId]/reply — Admin reply to ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!authUser.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { ticketId } = await params;
    const body = await request.json();

    await connectToDatabase();

    const ticket = await Ticket.findOneAndUpdate(
      { ticket_id: ticketId },
      {
        $set: {
          balasan_admin: body.balasan_admin,
          status: 'RESOLVED',
          updated_at: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    const { _id, ...rest } = ticket as Record<string, unknown>;
    return NextResponse.json(rest);
  } catch (error) {
    console.error('[Admin Reply] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
