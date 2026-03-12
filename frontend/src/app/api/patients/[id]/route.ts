import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Patient } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

// PUT /api/patients/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    // Only allow updating own patients
    const query: Record<string, string> = { patient_id: id };
    if (!authUser.isAdmin) {
      query.user_id = authUser.userId;
    }

    const patient = await Patient.findOneAndUpdate(
      query,
      { ...body, updated_at: new Date() },
      { new: true }
    ).lean();

    if (!patient) {
      return NextResponse.json({ error: 'Pasien tidak ditemukan atau bukan milik Anda' }, { status: 404 });
    }

    return NextResponse.json({ ...patient, _id: undefined });
  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/patients/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    // Only allow deleting own patients
    const query: Record<string, string> = { patient_id: id };
    if (!authUser.isAdmin) {
      query.user_id = authUser.userId;
    }

    const result = await Patient.findOneAndDelete(query);
    if (!result) {
      return NextResponse.json({ error: 'Pasien tidak ditemukan atau bukan milik Anda' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
