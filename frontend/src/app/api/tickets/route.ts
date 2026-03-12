import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Ticket } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

// GET /api/tickets
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    await connectToDatabase();

    // Only admin can fetch all tickets
    const query = (all && authUser.isAdmin) ? {} : { user_id: authUser.userId };
    const tickets = await Ticket.find(query).sort({ created_at: -1 }).lean();
    return NextResponse.json(tickets.map(t => ({ ...t, _id: undefined })));
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tickets
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    await connectToDatabase();

    const ticket = new Ticket({
      ticket_id: `ticket_${uuidv4()}`,
      user_id: authUser.userId,
      user_email: authUser.email,
      user_name: authUser.name,
      kategori: body.kategori,
      subjek: body.subjek,
      pesan_user: body.pesan_user,
      status: 'OPEN',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await ticket.save();
    const result = ticket.toObject();
    return NextResponse.json({ ...result, _id: undefined });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
