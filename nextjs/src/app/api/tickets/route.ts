import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Ticket } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';

// GET /api/tickets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const userId = request.cookies.get('session')?.value?.replace('demo_', '').replace('@demo.com', '_demo_001') || 'demo_user_001';

    try {
      await connectToDatabase();
      const query = all ? {} : { user_id: userId };
      const tickets = await Ticket.find(query).sort({ created_at: -1 }).lean();
      return NextResponse.json(tickets.map(t => ({ ...t, _id: undefined })));
    } catch {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tickets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.cookies.get('session')?.value?.replace('demo_', '').replace('@demo.com', '_demo_001') || 'demo_user_001';

    const ticketData = {
      ticket_id: `ticket_${uuidv4()}`,
      user_id: userId,
      user_email: body.user_email || 'user@demo.com',
      user_name: body.user_name || 'Demo User',
      kategori: body.kategori,
      subjek: body.subjek,
      pesan_user: body.pesan_user,
      status: 'OPEN',
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      await connectToDatabase();
      const ticket = new Ticket(ticketData);
      await ticket.save();
      const result = ticket.toObject();
      return NextResponse.json({ ...result, _id: undefined });
    } catch {
      return NextResponse.json(ticketData);
    }
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
