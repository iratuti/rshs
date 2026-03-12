import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Logbook } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

// GET /api/logbooks?month=2&year=2026
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    await connectToDatabase();

    const query: Record<string, unknown> = { user_id: authUser.userId };

    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`;
      query.tanggal_dinas = { $gte: startDate, $lte: endDate };
    }

    const logbooks = await Logbook.find(query).sort({ tanggal_dinas: -1 }).lean();
    return NextResponse.json(logbooks.map(l => ({ ...l, _id: undefined })));
  } catch (error) {
    console.error('Get logbooks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/logbooks
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    await connectToDatabase();

    const logbook = new Logbook({
      logbook_id: `logbook_${uuidv4()}`,
      user_id: authUser.userId,
      ...body,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await logbook.save();
    const result = logbook.toObject();
    return NextResponse.json({ ...result, _id: undefined });
  } catch (error) {
    console.error('Create logbook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
