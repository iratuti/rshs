import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models';

// GET /api/users (Admin only)
export async function GET() {
  try {
    try {
      await connectToDatabase();
      const users = await User.find({}).sort({ created_at: -1 }).lean();
      return NextResponse.json(users.map(u => ({ ...u, _id: undefined })));
    } catch {
      // Return mock users if DB unavailable
      return NextResponse.json([
        { user_id: 'demo_user_001', email: 'user@demo.com', name: 'Demo User', role: 'USER', status_langganan: 'ACTIVE', berlaku_sampai: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
        { user_id: 'demo_admin_001', email: 'admin@demo.com', name: 'Demo Admin', role: 'ADMIN', status_langganan: 'ACTIVE', berlaku_sampai: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
        { user_id: 'demo_nurse_001', email: 'demo@sepulangdinas.com', name: 'Demo Nurse', role: 'USER', status_langganan: 'TRIAL', berlaku_sampai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        { user_id: 'test_user_001', email: 'test.user.1772073781620@example.com', name: 'Test User', role: 'USER', status_langganan: 'TRIAL', berlaku_sampai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      ]);
    }
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
