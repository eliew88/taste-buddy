/**
 * Stripe Configuration for TasteBuddy
 * 
 * This file configures Stripe for both server-side and client-side usage.
 * Server-side: Stripe Connect for marketplace functionality
 * Client-side: Stripe Elements for payment forms
 */

import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    })
  : null;

// Client-side Stripe instance
let stripePromise: Promise<import('@stripe/stripe-js').Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      : Promise.resolve(null);
  }
  return stripePromise;
};

/**
 * Stripe Connect Configuration
 */
export const STRIPE_CONNECT_CONFIG = {
  // Express accounts are perfect for marketplaces
  // Users can start receiving payments quickly with minimal setup
  accountType: 'express' as const,
  
  // Countries where we support payments (expand as needed)
  supportedCountries: ['US', 'CA', 'GB', 'AU'] as const,
  
  // Capabilities we need for our marketplace
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  
  // Business type for most chef users
  businessType: 'individual' as const,
  
  // Settings for account creation
  settings: {
    payouts: {
      schedule: {
        interval: 'weekly' as const,
        weekly_anchor: 'friday' as const, // Payouts on Fridays
      },
    },
  },
} as const;

/**
 * Platform Fee Configuration
 */
export const PLATFORM_FEE_CONFIG = {
  // Default platform fee percentage (can be overridden per account)
  defaultFeePercent: 5.0,
  
  // Minimum fee amount in cents
  minimumFeeAmount: 50, // $0.50
  
  // Maximum fee amount in cents (optional cap)
  maximumFeeAmount: 500, // $5.00
} as const;

/**
 * Payment Configuration
 */
export const PAYMENT_CONFIG = {
  // Minimum tip amount in cents
  minimumTipAmount: 100, // $1.00
  
  // Maximum tip amount in cents
  maximumTipAmount: 10000, // $100.00
  
  // Supported currencies
  supportedCurrencies: ['usd'] as const,
  
  // Default currency
  defaultCurrency: 'usd' as const,
} as const;

/**
 * Webhook Configuration
 */
export const WEBHOOK_CONFIG = {
  // Events we want to listen for
  events: [
    'account.updated',
    'account.application.deauthorized',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'transfer.created',
    'transfer.updated',
  ] as const,
} as const;

/**
 * Helper function to calculate platform fees
 */
export function calculatePlatformFee(
  amount: number,
  feePercent: number = PLATFORM_FEE_CONFIG.defaultFeePercent
): {
  tipAmount: number;
  platformFeeAmount: number;
  netAmount: number;
} {
  const tipAmount = Math.round(amount * 100); // Convert to cents
  const feeAmount = Math.round(tipAmount * (feePercent / 100));
  
  // Apply fee limits
  const platformFeeAmount = Math.min(
    Math.max(feeAmount, PLATFORM_FEE_CONFIG.minimumFeeAmount),
    PLATFORM_FEE_CONFIG.maximumFeeAmount
  );
  
  const netAmount = tipAmount - platformFeeAmount;
  
  return {
    tipAmount,
    platformFeeAmount,
    netAmount,
  };
}

/**
 * Helper function to format currency amounts
 */
export function formatCurrency(amountInCents: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amountInCents / 100);
}