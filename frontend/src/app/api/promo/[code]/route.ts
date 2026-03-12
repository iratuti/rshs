import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PromoCode } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

// PUT update promo code (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Akses admin diperlukan' }, { status: 403 });
    }

    await connectToDatabase();
    const { code } = await params;

    const body = await request.json();
    const { discountPercentage, maxUses, expiresAt, isActive, description } = body;

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code tidak ditemukan' },
        { status: 404 }
      );
    }

    if (discountPercentage !== undefined) promoCode.discountPercentage = discountPercentage;
    if (maxUses !== undefined) promoCode.maxUses = maxUses;
    if (expiresAt !== undefined) promoCode.expiresAt = new Date(expiresAt);
    if (isActive !== undefined) promoCode.isActive = isActive;
    if (description !== undefined) promoCode.description = description;
    promoCode.updated_at = new Date();

    await promoCode.save();

    return NextResponse.json({
      success: true,
      promoCode: {
        code: promoCode.code,
        discountPercentage: promoCode.discountPercentage,
        maxUses: promoCode.maxUses,
        currentUses: promoCode.currentUses,
        expiresAt: promoCode.expiresAt,
        isActive: promoCode.isActive,
        description: promoCode.description,
      }
    });
  } catch (error) {
    console.error('Update promo code error:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate promo code' },
      { status: 500 }
    );
  }
}

// DELETE promo code (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Akses admin diperlukan' }, { status: 403 });
    }

    await connectToDatabase();
    const { code } = await params;

    const result = await PromoCode.deleteOne({ code: code.toUpperCase() });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Promo code tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete promo code error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus promo code' },
      { status: 500 }
    );
  }
}
