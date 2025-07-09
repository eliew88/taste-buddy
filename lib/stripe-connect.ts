/**
 * Stripe Connect Helper Functions
 * 
 * These functions handle the Stripe Connect integration for TasteBuddy's
 * marketplace functionality, allowing chefs to receive tips.
 */

import { stripe, STRIPE_CONNECT_CONFIG } from './stripe';
import { prisma } from './db';
import type { PaymentAccount } from '@/types/payment';

/**
 * Create a new Stripe Connect Express account for a user
 */
export async function createStripeConnectAccount(
  userId: string,
  email: string,
  country: string = 'US'
): Promise<{ accountId: string; onboardingUrl: string }> {
  try {
    console.log('createStripeConnectAccount called with:', { userId, email, country });
    
    if (!stripe) {
      console.error('Stripe is not configured - stripe instance is null');
      throw new Error('Stripe is not configured');
    }
    
    console.log('Stripe instance exists, creating account...');
    
    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: STRIPE_CONNECT_CONFIG.accountType,
      country,
      email,
      capabilities: STRIPE_CONNECT_CONFIG.capabilities,
      business_type: STRIPE_CONNECT_CONFIG.businessType,
      settings: STRIPE_CONNECT_CONFIG.settings,
    });

    console.log('Stripe account created:', { accountId: account.id });

    // Create or update PaymentAccount in database
    console.log('Creating PaymentAccount in database...');
    await prisma.paymentAccount.upsert({
      where: { userId },
      update: {
        stripeAccountId: account.id,
        accountStatus: 'pending',
      },
      create: {
        userId,
        stripeAccountId: account.id,
        accountStatus: 'pending',
      },
    });

    console.log('PaymentAccount created in database');

    // Create account link for onboarding
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    console.log('Creating account link with baseUrl:', baseUrl);
    
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/profile/payment-setup?refresh=true`,
      return_url: `${baseUrl}/profile/payment-setup?success=true`,
      type: 'account_onboarding',
    });

    console.log('Account link created:', accountLink.url);

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    
    // Log more detailed error information
    if (error && typeof error === 'object') {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error.type,
        code: error.code,
        param: error.param,
        statusCode: error.statusCode
      });
    }
    
    // Pass through the original error message for better debugging
    throw new Error(`Failed to create payment account: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get account link for existing Stripe Connect account
 */
export async function getStripeAccountLink(
  accountId: string,
  type: 'account_onboarding' | 'account_update' = 'account_onboarding'
): Promise<string> {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/profile/payment-setup?refresh=true`,
      return_url: `${baseUrl}/profile/payment-setup?success=true`,
      type,
    });

    return accountLink.url;
  } catch (error) {
    console.error('Error creating account link:', error);
    throw new Error('Failed to create account link');
  }
}

/**
 * Retrieve and sync Stripe Connect account information
 */
export async function syncStripeConnectAccount(userId: string): Promise<PaymentAccount | null> {
  try {
    const paymentAccount = await prisma.paymentAccount.findUnique({
      where: { userId },
    });

    if (!paymentAccount?.stripeAccountId) {
      return null;
    }

    // Skip sync for mock accounts (development)
    if (paymentAccount.stripeAccountId.startsWith('acct_mock_')) {
      console.log('Skipping sync for mock account:', paymentAccount.stripeAccountId);
      return paymentAccount;
    }

    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    
    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(paymentAccount.stripeAccountId);

    // Update database with latest info
    const updatedAccount = await prisma.paymentAccount.update({
      where: { userId },
      data: {
        accountStatus: account.charges_enabled ? 'active' : 'pending',
        onboardingComplete: account.details_submitted,
        detailsSubmitted: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
      },
    });

    return updatedAccount;
  } catch (error) {
    console.error('Error syncing Stripe Connect account:', error);
    throw new Error('Failed to sync payment account');
  }
}

/**
 * Check if user can receive tips
 */
export async function canReceiveTips(userId: string): Promise<boolean> {
  try {
    const paymentAccount = await prisma.paymentAccount.findUnique({
      where: { userId },
    });

    return !!(
      paymentAccount?.accountStatus === 'active' &&
      paymentAccount?.onboardingComplete &&
      paymentAccount?.payoutsEnabled &&
      paymentAccount?.acceptsTips
    );
  } catch (error) {
    console.error('Error checking tip eligibility:', error);
    return false;
  }
}

/**
 * Check if user can send tips
 */
export async function canSendTips(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // For now, any authenticated user can send tips
    // Later we might add requirements like verified email, etc.
    return !!user;
  } catch (error) {
    console.error('Error checking tip sending eligibility:', error);
    return false;
  }
}

/**
 * Get payment status for a user
 */
export async function getPaymentStatus(userId: string): Promise<{
  canReceiveTips: boolean;
  canSendTips: boolean;
  paymentAccount?: PaymentAccount;
  onboardingUrl?: string;
}> {
  try {
    const [canReceive, canSend] = await Promise.all([
      canReceiveTips(userId),
      canSendTips(userId),
    ]);

    const paymentAccount = await prisma.paymentAccount.findUnique({
      where: { userId },
    });

    let onboardingUrl: string | undefined;

    // If user has account but needs to complete onboarding (skip for mock accounts)
    if (paymentAccount?.stripeAccountId && !paymentAccount.onboardingComplete && !paymentAccount.stripeAccountId.startsWith('acct_mock_')) {
      try {
        onboardingUrl = await getStripeAccountLink(paymentAccount.stripeAccountId);
      } catch (error) {
        console.warn('Failed to get onboarding URL:', error);
      }
    }

    return {
      canReceiveTips: canReceive,
      canSendTips: canSend,
      paymentAccount: paymentAccount || undefined,
      onboardingUrl,
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    return {
      canReceiveTips: false,
      canSendTips: false,
    };
  }
}

/**
 * Process a tip through Stripe Connect
 */
export async function processStripeConnectTip({
  senderId,
  recipientId,
  amount,
  message,
  recipeId,
  isAnonymous
}: {
  senderId: string;
  recipientId: string;
  amount: number;
  message?: string;
  recipeId?: string;
  isAnonymous?: boolean;
}): Promise<{
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  complimentId?: string;
  error?: string;
}> {
  try {
    console.log('processStripeConnectTip called with:', { senderId, recipientId, amount });
    
    // Get recipient's payment account
    const recipientAccount = await prisma.paymentAccount.findUnique({
      where: { userId: recipientId },
    });

    console.log('Recipient account lookup:', { recipientId, account: recipientAccount });

    if (!recipientAccount?.stripeAccountId) {
      console.error('Recipient account not found or no Stripe account ID');
      return { success: false, error: 'Recipient cannot receive tips' };
    }

    // Handle mock accounts for development
    if (recipientAccount.stripeAccountId.startsWith('acct_mock_')) {
      console.log('Processing mock tip for development...');
      
      // Create compliment record without actual payment
      const compliment = await prisma.compliment.create({
        data: {
          fromUserId: senderId,
          toUserId: recipientId,
          recipeId: recipeId || null,
          type: 'tip',
          message: message || 'Thanks for the amazing recipe!',
          tipAmount: amount,
          paymentIntentId: `pi_mock_${Date.now()}`,
          paymentStatus: 'succeeded',
          paidAt: new Date(),
          isAnonymous: isAnonymous || false,
        },
      });

      return {
        success: true,
        paymentIntentId: `pi_mock_${Date.now()}`,
        clientSecret: 'mock_client_secret',
        complimentId: compliment.id,
      };
    }

    // Calculate platform fee
    const platformFeeAmount = Math.round(amount * 100 * (recipientAccount.platformFeePercent.toNumber() / 100));
    const netAmount = Math.round(amount * 100) - platformFeeAmount;

    console.log('Fee calculation:', { amount, platformFeeAmount, netAmount, feePercent: recipientAccount.platformFeePercent.toNumber() });

    if (!stripe) {
      console.error('Stripe is not configured');
      return { success: false, error: 'Payment processing is not configured' };
    }
    
    console.log('Creating Stripe payment intent...');
    
    // Create payment intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: recipientAccount.stripeAccountId,
      },
      metadata: {
        senderId,
        recipientId,
        recipeId: recipeId || '',
        type: 'tip',
        isAnonymous: isAnonymous ? 'true' : 'false',
      },
    });

    console.log('Payment intent created:', { id: paymentIntent.id, status: paymentIntent.status });

    // Create compliment record in database
    const compliment = await prisma.compliment.create({
      data: {
        fromUserId: senderId,
        toUserId: recipientId,
        recipeId: recipeId || null,
        type: 'tip',
        message: message || 'Thanks for the amazing recipe!',
        tipAmount: amount,
        paymentIntentId: paymentIntent.id,
        isAnonymous: isAnonymous || false,
      },
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      complimentId: compliment.id,
    };
  } catch (error) {
    console.error('Error processing tip:', error);
    
    // Check if it's a Stripe error
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      console.error('Stripe error details:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param
      });
      
      // Return more specific error message
      if (stripeError.code === 'account_invalid') {
        return { success: false, error: 'Recipient payment account is not set up properly' };
      }
      if (stripeError.code === 'transfer_group_invalid') {
        return { success: false, error: 'Invalid transfer configuration' };
      }
    }
    
    return { success: false, error: 'Failed to process tip' };
  }
}