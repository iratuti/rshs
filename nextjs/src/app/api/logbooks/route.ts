import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Logbook } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';

// GET /api/logbooks?month=2&year=2026
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const userId = request.cookies.get('session')?.value?.replace('demo_', '').replace('@demo.com', '_demo_001') || 'demo_user_001';

    // Try to connect to DB
    try {
      await connectToDatabase();
      
      const query: Record<string, unknown> = { user_id: userId };
      
      if (month && year) {
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = `${year}-${month.padStart(2, '0')}-31`;
        query.tanggal_dinas = { $gte: startDate, $lte: endDate };
      }

      const logbooks = await Logbook.find(query).sort({ tanggal_dinas: -1 }).lean();
      return NextResponse.json(logbooks.map(l => ({ ...l, _id: undefined })));
    } catch {
      // Return empty array if DB unavailable
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Get logbooks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/logbooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.cookies.get('session')?.value?.replace('demo_', '').replace('@demo.com', '_demo_001') || 'demo_user_001';

    try {
      await connectToDatabase();

      const logbook = new Logbook({
        logbook_id: `logbook_${uuidv4()}`,
        user_id: userId,
        ...body,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await logbook.save();
      const result = logbook.toObject();
      return NextResponse.json({ ...result, _id: undefined });
    } catch {
      // Return mock response if DB unavailable
      return NextResponse.json({
        logbook_id: `logbook_${uuidv4()}`,
        user_id: userId,
        ...body,
        daftar_tindakan: body.daftar_tindakan || [],
      });
    }
  } catch (error) {
    console.error('Create logbook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
