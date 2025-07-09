/**
 * Tip Processing API
 * 
 * Handles processing tips through Stripe Connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { processStripeConnectTip } from '@/lib/stripe-connect';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { 
      recipientId, 
      amount, 
      message, 
      recipeId,
      isAnonymous = false 
    } = await req.json();

    // Validate input
    if (!recipientId || !amount || amount < 1 || amount > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid tip amount' },
        { status: 400 }
      );
    }

    // Check if user is trying to tip themselves
    if (session.user.id === recipientId) {
      return NextResponse.json(
        { success: false, error: 'Cannot tip yourself' },
        { status: 400 }
      );
    }

    // Check if recipient can receive tips
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      include: {
        paymentAccount: true
      }
    });

    console.log('Recipient lookup:', { recipientId, recipient: recipient ? { id: recipient.id, name: recipient.name, paymentAccount: recipient.paymentAccount } : null });

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'Recipient not found' },
        { status: 400 }
      );
    }

    if (!recipient.paymentAccount) {
      return NextResponse.json(
        { success: false, error: 'Recipient has not set up payments yet' },
        { status: 400 }
      );
    }

    if (!recipient.paymentAccount.stripeAccountId) {
      return NextResponse.json(
        { success: false, error: 'Recipient payment account not configured' },
        { status: 400 }
      );
    }

    if (!recipient.paymentAccount.acceptsTips) {
      return NextResponse.json(
        { success: false, error: 'Recipient has disabled tips' },
        { status: 400 }
      );
    }

    // Process the tip through Stripe Connect
    const result = await processStripeConnectTip({
      senderId: session.user.id,
      recipientId,
      amount,
      message,
      recipeId,
      isAnonymous
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          paymentIntentId: result.paymentIntentId,
          clientSecret: result.clientSecret,
          complimentId: result.complimentId
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Tip processing API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process tip' },
      { status: 500 }
    );
  }
}