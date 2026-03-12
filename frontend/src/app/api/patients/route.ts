import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Patient } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

// GET /api/patients
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const patients = await Patient.find({ user_id: authUser.userId }).sort({ nama_pasien: 1 }).lean();
    return NextResponse.json(patients.map(p => ({ ...p, _id: undefined })));
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/patients
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    await connectToDatabase();

    const patient = new Patient({
      patient_id: `patient_${uuidv4()}`,
      user_id: authUser.userId,
      ...body,
      created_at: new Date(),
    });

    await patient.save();
    const result = patient.toObject();
    return NextResponse.json({ ...result, _id: undefined });
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
