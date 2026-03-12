import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PromoCode } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

// GET all promo codes (admin only)
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Akses admin diperlukan' }, { status: 403 });
    }

    await connectToDatabase();

    const promoCodes = await PromoCode.find({})
      .sort({ created_at: -1 })
      .lean();

    const formattedCodes = promoCodes.map(code => ({
      ...code,
      _id: undefined,
      id: code._id?.toString(),
    }));

    return NextResponse.json(formattedCodes);
  } catch (error) {
    console.error('Get promo codes error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data promo codes' },
      { status: 500 }
    );
  }
}

// POST create new promo code (admin only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Akses admin diperlukan' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { code, discountPercentage, maxUses, expiresAt, description } = body;

    if (!code || !discountPercentage || !maxUses || !expiresAt) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    if (discountPercentage < 1 || discountPercentage > 100) {
      return NextResponse.json(
        { error: 'Diskon harus antara 1-100%' },
        { status: 400 }
      );
    }

    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return NextResponse.json(
        { error: 'Kode promo sudah ada' },
        { status: 400 }
      );
    }

    const newPromoCode = await PromoCode.create({
      code: code.toUpperCase(),
      discountPercentage,
      maxUses,
      currentUses: 0,
      expiresAt: new Date(expiresAt),
      isActive: true,
      description,
    });

    return NextResponse.json({
      success: true,
      promoCode: {
        code: newPromoCode.code,
        discountPercentage: newPromoCode.discountPercentage,
        maxUses: newPromoCode.maxUses,
        expiresAt: newPromoCode.expiresAt,
        description: newPromoCode.description,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create promo code error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat promo code' },
      { status: 500 }
    );
  }
}
