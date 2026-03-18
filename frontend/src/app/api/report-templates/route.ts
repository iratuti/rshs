import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ReportTemplate } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';
import { DEFAULT_EKINERJA_TEMPLATES, DEFAULT_EREMUNERASI_TEMPLATES } from '@/lib/report-templates';

// GET /api/report-templates — returns user's templates or defaults
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const config = await ReportTemplate.findOne({ user_id: authUser.userId }).lean();

    return NextResponse.json({
      ekinerja_templates: config?.ekinerja_templates?.length ? config.ekinerja_templates : DEFAULT_EKINERJA_TEMPLATES,
      eremunerasi_templates: config?.eremunerasi_templates?.length ? config.eremunerasi_templates : DEFAULT_EREMUNERASI_TEMPLATES,
      is_custom: !!config,
    });
  } catch (error) {
    console.error('Get report templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/report-templates — save user's templates
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ekinerja_templates, eremunerasi_templates } = body;

    await connectToDatabase();

    await ReportTemplate.findOneAndUpdate(
      { user_id: authUser.userId },
      {
        user_id: authUser.userId,
        ekinerja_templates: ekinerja_templates || [],
        eremunerasi_templates: eremunerasi_templates || [],
        updated_at: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save report templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/report-templates — reset to defaults
export async function DELETE() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await ReportTemplate.deleteOne({ user_id: authUser.userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset report templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
