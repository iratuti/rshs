import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Ticket } from '@/lib/models';

// GET /api/tickets/[ticketId] - Get single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    
    await connectToDatabase();
    const ticket = await Ticket.findOne({ ticket_id: ticketId }).lean();
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
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
    const { ticketId } = await params;
    const body = await request.json();
    
    await connectToDatabase();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };
    
    // Admin reply
    if (body.balasan_admin !== undefined) {
      updateData.balasan_admin = body.balasan_admin;
      updateData.status = 'ANSWERED';
    }
    
    // Status change
    if (body.status) {
      updateData.status = body.status;
    }
    
    const ticket = await Ticket.findOneAndUpdate(
      { ticket_id: ticketId },
      { $set: updateData },
      { new: true }
    ).lean();
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
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
    const { ticketId } = await params;
    
    await connectToDatabase();
    const result = await Ticket.findOneAndDelete({ ticket_id: ticketId });
    
    if (!result) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
