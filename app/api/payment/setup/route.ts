/**
 * Payment Setup API
 * 
 * Handles creating Stripe Connect accounts for users who want to receive tips
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createStripeConnectAccount, getPaymentStatus } from '@/lib/stripe-connect';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { country = 'US' } = await req.json();

    // Check if user already has a payment account
    const existingStatus = await getPaymentStatus(session.user.id);
    if (existingStatus.paymentAccount?.stripeAccountId) {
      return NextResponse.json(
        { success: false, error: 'Payment account already exists' },
        { status: 400 }
      );
    }

    // Create Stripe Connect account
    const { accountId, onboardingUrl } = await createStripeConnectAccount(
      session.user.id,
      session.user.email!,
      country
    );

    return NextResponse.json({
      success: true,
      data: {
        accountId,
        onboardingUrl,
      },
    });
  } catch (error) {
    console.error('Payment setup API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup payment account' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const paymentStatus = await getPaymentStatus(session.user.id);

    return NextResponse.json({
      success: true,
      data: paymentStatus,
    });
  } catch (error) {
    console.error('Payment status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}