import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PromoCode } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Kode promo wajib diisi' },
        { status: 400 }
      );
    }

    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase()
    }).lean();

    if (!promoCode) {
      return NextResponse.json(
        { valid: false, error: 'Kode promo tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!promoCode.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Kode promo sudah tidak aktif' },
        { status: 400 }
      );
    }

    if (new Date(promoCode.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Kode promo sudah kadaluarsa' },
        { status: 400 }
      );
    }

    if (promoCode.currentUses >= promoCode.maxUses) {
      return NextResponse.json(
        { valid: false, error: 'Kode promo sudah mencapai batas penggunaan' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      discountPercentage: promoCode.discountPercentage,
      description: promoCode.description || `Diskon ${promoCode.discountPercentage}%`,
    });
  } catch (error) {
    console.error('Promo validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Gagal memvalidasi kode promo' },
      { status: 500 }
    );
  }
}
