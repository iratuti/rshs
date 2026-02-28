import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Patient } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';

// GET /api/patients
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('session')?.value?.replace('demo_', '').replace('@demo.com', '_demo_001') || 'demo_user_001';

    try {
      await connectToDatabase();
      const patients = await Patient.find({ user_id: userId }).sort({ nama_pasien: 1 }).lean();
      return NextResponse.json(patients.map(p => ({ ...p, _id: undefined })));
    } catch {
      // Return mock patients if DB unavailable
      return NextResponse.json([
        { patient_id: 'patient_001', user_id: userId, nama_pasien: 'Tn. Alyasa', no_rm: '2176988', no_billing: 'BL001', diagnosa: 'CHF' },
        { patient_id: 'patient_002', user_id: userId, nama_pasien: 'Ny. Siti', no_rm: '2176989', no_billing: 'BL002', diagnosa: 'DM Type 2' },
        { patient_id: 'patient_003', user_id: userId, nama_pasien: 'Tn. Ahmad', no_rm: '2176990', no_billing: 'BL003', diagnosa: 'Pneumonia' },
      ]);
    }
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/patients
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.cookies.get('session')?.value?.replace('demo_', '').replace('@demo.com', '_demo_001') || 'demo_user_001';

    const patientData = {
      patient_id: `patient_${uuidv4()}`,
      user_id: userId,
      ...body,
      created_at: new Date(),
    };

    try {
      await connectToDatabase();
      const patient = new Patient(patientData);
      await patient.save();
      const result = patient.toObject();
      return NextResponse.json({ ...result, _id: undefined });
    } catch {
      return NextResponse.json(patientData);
    }
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
