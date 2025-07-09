/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for payment processing and account updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    const body = await req.text();
    const signature = headers().get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'capability.updated':
        await handleCapabilityUpdated(event.data.object as Stripe.Capability);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update compliment record with successful payment
    await prisma.compliment.updateMany({
      where: { paymentIntentId: paymentIntent.id },
      data: { 
        paymentStatus: 'succeeded',
        paidAt: new Date()
      }
    });

    console.log('Payment intent succeeded:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update compliment record with failed payment
    await prisma.compliment.updateMany({
      where: { paymentIntentId: paymentIntent.id },
      data: { 
        paymentStatus: 'failed'
      }
    });

    console.log('Payment intent failed:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    // Update payment account status based on Stripe account
    await prisma.paymentAccount.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        accountStatus: account.charges_enabled ? 'active' : 'pending',
        onboardingComplete: account.details_submitted,
        detailsSubmitted: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
      }
    });

    console.log('Account updated:', account.id);
  } catch (error) {
    console.error('Error handling account updated:', error);
  }
}

async function handleCapabilityUpdated(capability: Stripe.Capability) {
  try {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    
    // Update payment account when capabilities change
    const account = await stripe.accounts.retrieve(capability.account as string);
    
    await prisma.paymentAccount.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        accountStatus: account.charges_enabled ? 'active' : 'pending',
        payoutsEnabled: account.payouts_enabled,
      }
    });

    console.log('Capability updated:', capability.id);
  } catch (error) {
    console.error('Error handling capability updated:', error);
  }
}