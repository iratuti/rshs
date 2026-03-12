import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Transaction, PromoCode } from '@/lib/models';
import { getAuthUser } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

// Pricing configuration
const PRICING = {
  monthly: 25000,  // Rp 25,000
  yearly: 250000,  // Rp 250,000 (save 2 months)
};

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      subscriptionType = 'monthly',
      promoCode,
    } = body;

    // Validate subscription type
    if (!['monthly', 'yearly'].includes(subscriptionType)) {
      return NextResponse.json(
        { error: 'Tipe langganan tidak valid' },
        { status: 400 }
      );
    }

    // Calculate pricing
    let originalAmount = PRICING[subscriptionType as keyof typeof PRICING];
    let discountAmount = 0;
    let discountPercentage = 0;

    // Validate and apply promo code if provided
    if (promoCode) {
      const promo = await PromoCode.findOne({
        code: promoCode.toUpperCase(),
        isActive: true,
      });

      if (promo) {
        const now = new Date();
        if (promo.expiresAt > now && promo.currentUses < promo.maxUses) {
          discountPercentage = promo.discountPercentage;
          discountAmount = Math.floor(originalAmount * (discountPercentage / 100));

          // Increment usage count
          await PromoCode.updateOne(
            { code: promoCode.toUpperCase() },
            { $inc: { currentUses: 1 }, $set: { updated_at: new Date() } }
          );
        }
      }
    }

    const finalAmount = originalAmount - discountAmount;

    // Generate unique order ID
    const orderId = `SD-${subscriptionType.toUpperCase()}-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const transactionId = uuidv4();

    // Initialize Midtrans Snap
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const midtransClient = require('midtrans-client');
    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    // Build transaction parameters - use session user, not body
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalAmount,
      },
      item_details: [
        {
          id: subscriptionType,
          name: subscriptionType === 'monthly' ? 'Langganan Bulanan' : 'Langganan Tahunan',
          price: originalAmount,
          quantity: 1,
        },
        ...(discountAmount > 0 ? [{
          id: 'discount',
          name: `Diskon Promo (${discountPercentage}%)`,
          price: -discountAmount,
          quantity: 1,
        }] : []),
      ],
      customer_details: {
        email: authUser.email,
        first_name: authUser.name,
      },
      credit_card: {
        secure: true,
      },
    };

    // Create Midtrans transaction token
    const midtransToken = await snap.createTransactionToken(parameter);

    // Save transaction to database - use session user
    await Transaction.create({
      transaction_id: transactionId,
      order_id: orderId,
      user_id: authUser.userId,
      user_email: authUser.email,
      amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      promo_code: promoCode?.toUpperCase() || null,
      status: 'PENDING',
      midtrans_token: midtransToken,
      subscription_type: subscriptionType,
    });

    return NextResponse.json({
      success: true,
      token: midtransToken,
      orderId,
      transactionId,
      amount: originalAmount,
      discountAmount,
      finalAmount,
      subscriptionType,
    });
  } catch (error: unknown) {
    console.error('Create transaction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Gagal membuat transaksi', details: errorMessage },
      { status: 500 }
    );
  }
}
