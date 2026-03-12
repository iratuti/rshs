import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Ticket } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/tickets/[ticketId] - Get single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await params;

    await connectToDatabase();

    // Non-admin can only see own tickets
    const query: Record<string, string> = { ticket_id: ticketId };
    if (!authUser.isAdmin) {
      query.user_id = authUser.userId;
    }

    const ticket = await Ticket.findOne(query).lean();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ ...ticket, _id: undefined });
  } catch (error) {
    console.error('Get ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tickets/[ticketId] - Update ticket (admin reply, status change)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await params;
    const body = await request.json();

    await connectToDatabase();

    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    // Admin reply - only admin can reply
    if (body.balasan_admin !== undefined) {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Hanya admin yang dapat membalas tiket' }, { status: 403 });
      }
      updateData.balasan_admin = body.balasan_admin;
      updateData.status = 'ANSWERED';
    }

    // Status change - only admin can change status
    if (body.status) {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Hanya admin yang dapat mengubah status tiket' }, { status: 403 });
      }
      updateData.status = body.status;
    }

    // Admin can update any ticket, user can only update own
    const query: Record<string, string> = { ticket_id: ticketId };
    if (!authUser.isAdmin) {
      query.user_id = authUser.userId;
    }

    const ticket = await Ticket.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ ...ticket, _id: undefined });
  } catch (error) {
    console.error('Update ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tickets/[ticketId] - Delete ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await params;

    await connectToDatabase();

    // Admin can delete any ticket, user can only delete own
    const query: Record<string, string> = { ticket_id: ticketId };
    if (!authUser.isAdmin) {
      query.user_id = authUser.userId;
    }

    const result = await Ticket.findOneAndDelete(query);

    if (!result) {
      return NextResponse.json({ error: 'Ticket tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
