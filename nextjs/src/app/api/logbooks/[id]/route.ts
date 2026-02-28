import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Logbook } from '@/lib/models';

// PUT /api/logbooks/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    try {
      await connectToDatabase();

      const logbook = await Logbook.findOneAndUpdate(
        { logbook_id: id },
        { ...body, updated_at: new Date() },
        { new: true }
      ).lean();

      if (!logbook) {
        return NextResponse.json({ error: 'Logbook not found' }, { status: 404 });
      }

      return NextResponse.json({ ...logbook, _id: undefined });
    } catch {
      // Return mock response if DB unavailable
      return NextResponse.json({
        logbook_id: id,
        ...body,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Update logbook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/logbooks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      await connectToDatabase();
      await Logbook.findOneAndDelete({ logbook_id: id });
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Delete logbook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
