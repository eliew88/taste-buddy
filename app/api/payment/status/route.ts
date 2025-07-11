/**
 * Payment Status API
 * 
 * Syncs and returns current payment account status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { syncStripeConnectAccount, getPaymentStatus } from '@/lib/stripe-connect';
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If payments are disabled, return that tips are not available
    if (!isFeatureEnabled('enablePayments')) {
      return NextResponse.json({
        success: true,
        data: {
          paymentAccount: null,
          canSendTips: false,
          canReceiveTips: false,
          paymentsEnabled: false
        }
      });
    }

    // Sync with Stripe and get latest status (skip for mock accounts)
    try {
      await syncStripeConnectAccount(session.user.id);
    } catch (error) {
      console.warn('Failed to sync account, continuing with database status:', error);
    }
    const paymentStatus = await getPaymentStatus(session.user.id);

    return NextResponse.json({
      success: true,
      data: paymentStatus,
    });
  } catch (error) {
    console.error('Payment status sync API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync payment status' },
      { status: 500 }
    );
  }
}