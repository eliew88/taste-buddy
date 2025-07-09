/**
 * Payment-related TypeScript types for TasteBuddy
 */

export interface PaymentAccount {
  id: string;
  userId: string;
  stripeAccountId?: string;
  accountStatus: 'pending' | 'active' | 'restricted' | 'inactive';
  onboardingComplete: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  acceptsTips: boolean;
  minimumTipAmount: number;
  platformFeePercent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentAccountData {
  userId: string;
  acceptsTips?: boolean;
  minimumTipAmount?: number;
}

export interface UpdatePaymentAccountData {
  stripeAccountId?: string;
  accountStatus?: 'pending' | 'active' | 'restricted' | 'inactive';
  onboardingComplete?: boolean;
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
  acceptsTips?: boolean;
  minimumTipAmount?: number;
  platformFeePercent?: number;
}

export interface TipPaymentData {
  complimentId: string;
  amount: number;
  currency?: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
}

export interface PaymentStatusResponse {
  canReceiveTips: boolean;
  canSendTips: boolean;
  minimumTipAmount?: number;
  accountStatus?: string;
  onboardingUrl?: string;
}

export interface StripeConnectAccount {
  id: string;
  object: string;
  business_profile?: {
    name?: string;
    url?: string;
  };
  capabilities?: {
    card_payments?: string;
    transfers?: string;
  };
  charges_enabled: boolean;
  country: string;
  created: number;
  default_currency: string;
  details_submitted: boolean;
  email?: string;
  payouts_enabled: boolean;
  requirements?: {
    currently_due: string[];
    disabled_reason?: string;
  };
  settings?: {
    payouts?: {
      schedule?: {
        delay_days: number;
        interval: string;
      };
    };
  };
  type: string;
}

export interface TipCalculation {
  tipAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  platformFeePercent: number;
}