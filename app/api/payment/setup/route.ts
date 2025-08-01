/**
 * Payment Setup API
 * 
 * Handles creating Stripe Connect accounts for users who want to receive tips
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createStripeConnectAccount, getPaymentStatus, getStripeAccountLink } from '@/lib/stripe-connect';
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function POST(req: NextRequest) {
  try {
    console.log('Payment setup API called');
    
    // Check if payments are enabled
    if (!isFeatureEnabled('enablePayments')) {
      console.log('Payments are disabled');
      return NextResponse.json(
        { success: false, error: 'Payment processing is currently disabled' },
        { status: 403 }
      );
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', { userId: session.user.id, email: session.user.email });

    const { country = 'US' } = await req.json();
    console.log('Country:', country);

    // Check if user already has a payment account
    console.log('Checking existing payment status...');
    const existingStatus = await getPaymentStatus(session.user.id);
    console.log('Existing payment status:', existingStatus);
    
    if (existingStatus.paymentAccount?.stripeAccountId) {
      console.log('Payment account already exists:', existingStatus.paymentAccount.stripeAccountId);
      
      // If account exists but onboarding is incomplete, generate new onboarding URL
      if (!existingStatus.paymentAccount.onboardingComplete) {
        console.log('Generating new onboarding URL for existing account...');
        try {
          const onboardingUrl = await getStripeAccountLink(existingStatus.paymentAccount.stripeAccountId);
          return NextResponse.json({
            success: true,
            data: {
              accountId: existingStatus.paymentAccount.stripeAccountId,
              onboardingUrl,
            },
          });
        } catch (error) {
          console.error('Failed to generate onboarding URL:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to generate onboarding link' },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Payment account already exists and is complete' },
        { status: 400 }
      );
    }

    // Create Stripe Connect account
    console.log('Creating Stripe Connect account...');
    const { accountId, onboardingUrl } = await createStripeConnectAccount(
      session.user.id,
      session.user.email!,
      country
    );

    console.log('Stripe Connect account created successfully:', { accountId, onboardingUrl });

    return NextResponse.json({
      success: true,
      data: {
        accountId,
        onboardingUrl,
      },
    });
  } catch (error) {
    console.error('Payment setup API error:', error);
    
    // Type-safe error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    }
    
    // Return more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to setup payment account';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
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