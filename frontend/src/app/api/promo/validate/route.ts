import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PromoCode } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
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
    
    // Check if promo is active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Kode promo sudah tidak aktif' },
        { status: 400 }
      );
    }
    
    // Check if promo has expired
    if (new Date(promoCode.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Kode promo sudah kadaluarsa' },
        { status: 400 }
      );
    }
    
    // Check if max uses exceeded
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
