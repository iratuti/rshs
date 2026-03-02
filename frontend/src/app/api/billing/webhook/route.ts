import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Transaction, User } from '@/lib/models';
import crypto from 'crypto';

// Verify Midtrans signature
function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string
): boolean {
  const signatureString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computedSignature = crypto
    .createHash('sha512')
    .update(signatureString)
    .digest('hex');
  
  return computedSignature === signatureKey;
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const notification = await request.json();
    
    console.log('Midtrans webhook received:', notification.order_id, notification.transaction_status);
    
    // Verify signature
    const isValid = verifySignature(
      notification.order_id,
      notification.status_code,
      notification.gross_amount,
      process.env.MIDTRANS_SERVER_KEY || '',
      notification.signature_key
    );
    
    if (!isValid) {
      console.warn('Invalid Midtrans signature for order:', notification.order_id);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Find transaction
    const transaction = await Transaction.findOne({ order_id: notification.order_id });
    
    if (!transaction) {
      console.warn('Transaction not found:', notification.order_id);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Update transaction status based on Midtrans notification
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    
    let newStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' = 'PENDING';
    
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        newStatus = 'SUCCESS';
        
        // Activate user subscription
        const subscriptionDays = transaction.subscription_type === 'yearly' ? 365 : 30;
        const berlakuSampai = new Date();
        berlakuSampai.setDate(berlakuSampai.getDate() + subscriptionDays);
        
        await User.updateOne(
          { user_id: transaction.user_id },
          {
            $set: {
              status_langganan: 'ACTIVE',
              berlaku_sampai: berlakuSampai,
              updated_at: new Date(),
            }
          }
        );
        
        console.log(`Subscription activated for user: ${transaction.user_id}`);
      } else {
        newStatus = 'FAILED';
      }
    } else if (transactionStatus === 'pending') {
      newStatus = 'PENDING';
    } else if (['deny', 'cancel', 'failure'].includes(transactionStatus)) {
      newStatus = 'FAILED';
    } else if (transactionStatus === 'expire') {
      newStatus = 'EXPIRED';
    }
    
    // Update transaction
    await Transaction.updateOne(
      { order_id: notification.order_id },
      {
        $set: {
          status: newStatus,
          payment_type: notification.payment_type,
          updated_at: new Date(),
        }
      }
    );
    
    console.log(`Transaction ${notification.order_id} updated to ${newStatus}`);
    
    return NextResponse.json({ success: true, status: newStatus });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
