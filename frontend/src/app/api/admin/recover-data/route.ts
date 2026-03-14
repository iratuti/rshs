import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Logbook, Patient, Ticket } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

const SUPER_ADMIN_EMAIL = 'theomahrizal@gmail.com';
const VIP_LIFETIME_EMAIL = 'iratuti66@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Akses admin diperlukan' }, { status: 403 });
    }

    const body = await request.json();
    const { source_user_ids, target_email } = body;

    if (!source_user_ids?.length || !target_email) {
      return NextResponse.json(
        { error: 'source_user_ids (list) and target_email (string) required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find or create the target user
    let targetUser = await User.findOne({ email: target_email }).lean();
    let targetUserId: string;

    if (targetUser) {
      targetUserId = (targetUser as Record<string, unknown>).user_id as string;
    } else {
      targetUserId = `user_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      const isVip = target_email === VIP_LIFETIME_EMAIL;
      const isAdmin = target_email === SUPER_ADMIN_EMAIL;
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + (isVip ? 365 : 7));

      await User.create({
        user_id: targetUserId,
        name: target_email.split('@')[0],
        email: target_email,
        picture: '',
        ruangan_rs: isAdmin ? 'Admin Office' : null,
        role: isAdmin ? 'ADMIN' : 'USER',
        status_langganan: (isVip || isAdmin) ? 'ACTIVE' : 'TRIAL',
        berlaku_sampai: trialEnd.toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // Migrate logbooks
    const logbookResult = await Logbook.updateMany(
      { user_id: { $in: source_user_ids } },
      { $set: { user_id: targetUserId } }
    );

    // Migrate patients
    const patientResult = await Patient.updateMany(
      { user_id: { $in: source_user_ids } },
      { $set: { user_id: targetUserId } }
    );

    // Migrate tickets
    const ticketResult = await Ticket.updateMany(
      { user_id: { $in: source_user_ids } },
      { $set: { user_id: targetUserId, user_email: target_email } }
    );

    return NextResponse.json({
      success: true,
      logbooks_migrated: logbookResult.modifiedCount,
      patients_migrated: patientResult.modifiedCount,
      tickets_migrated: ticketResult.modifiedCount,
      target_user_id: targetUserId,
      target_email,
      source_ids_processed: source_user_ids,
    });
  } catch (error) {
    console.error('Recovery error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
