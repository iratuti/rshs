import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Ticket } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

// DELETE /api/admin/tickets/[ticketId] — Delete ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!authUser.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { ticketId } = await params;

    await connectToDatabase();
    const result = await Ticket.findOneAndDelete({ ticket_id: ticketId });

    if (!result) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Delete Ticket] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
