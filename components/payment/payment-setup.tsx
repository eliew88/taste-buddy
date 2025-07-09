'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  CreditCard, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading';

interface PaymentStatus {
  canReceiveTips: boolean;
  canSendTips: boolean;
  paymentAccount?: {
    accountStatus: string;
    onboardingComplete: boolean;
    payoutsEnabled: boolean;
    acceptsTips: boolean;
  };
  onboardingUrl?: string;
}

export default function PaymentSetup() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment status on mount
  useEffect(() => {
    fetchPaymentStatus();
  }, []);

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment/status');
      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus(data.data);
      } else {
        setError(data.error || 'Failed to load payment status');
      }
    } catch (err) {
      setError('Failed to load payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPayments = async () => {
    try {
      setSetupLoading(true);
      setError(null);
      
      const response = await fetch('/api/payment/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: 'US' })
      });
      
      const data = await response.json();
      
      if (data.success && data.data.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = data.data.onboardingUrl;
      } else {
        setError(data.error || 'Failed to setup payment account');
      }
    } catch (err) {
      setError('Failed to setup payment account');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleContinueOnboarding = async () => {
    try {
      setSetupLoading(true);
      setError(null);
      
      // Generate a fresh onboarding URL
      const response = await fetch('/api/payment/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: 'US' })
      });
      
      const data = await response.json();
      
      if (data.success && data.data.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = data.data.onboardingUrl;
      } else {
        setError(data.error || 'Failed to generate onboarding link');
      }
    } catch (err) {
      setError('Failed to continue onboarding');
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (!paymentStatus?.paymentAccount) return <CreditCard className="w-6 h-6 text-gray-400" />;
    
    switch (paymentStatus.paymentAccount.accountStatus) {
      case 'active':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (!paymentStatus?.paymentAccount) return 'Not Set Up';
    
    switch (paymentStatus.paymentAccount.accountStatus) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Setup Incomplete';
      default:
        return 'Restricted';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Payment Settings</h2>
        {getStatusIcon()}
      </div>

      <div className="space-y-4">
        {/* Status Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Account Status</span>
            <span className={`text-sm font-semibold ${
              paymentStatus?.paymentAccount?.accountStatus === 'active' 
                ? 'text-green-600' 
                : 'text-yellow-600'
            }`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Can receive tips</span>
              <span className={paymentStatus?.canReceiveTips ? 'text-green-600' : 'text-gray-400'}>
                {paymentStatus?.canReceiveTips ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Can send tips</span>
              <span className={paymentStatus?.canSendTips ? 'text-green-600' : 'text-gray-400'}>
                {paymentStatus?.canSendTips ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!paymentStatus?.paymentAccount ? (
          // No account - show setup button
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                <DollarSign className="w-5 h-5 inline mr-2" />
                Start Receiving Tips
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Set up your payment account to receive tips from appreciative food lovers. 
                It only takes a few minutes!
              </p>
              <LoadingButton
                loading={setupLoading}
                onClick={handleSetupPayments}
                className="w-full bg-green-700 text-white hover:bg-green-800"
              >
                Set Up Payments
              </LoadingButton>
            </div>
          </div>
        ) : paymentStatus.paymentAccount.accountStatus === 'pending' ? (
          // Account exists but setup incomplete
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                <Clock className="w-5 h-5 inline mr-2" />
                Complete Your Setup
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                You've started setting up payments but haven't finished. 
                Complete your account setup to start receiving tips.
              </p>
              <LoadingButton
                loading={setupLoading}
                onClick={handleContinueOnboarding}
                className="w-full bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Continue Setup
                <ExternalLink className="w-4 h-4 ml-2" />
              </LoadingButton>
            </div>
          </div>
        ) : paymentStatus.paymentAccount.accountStatus === 'active' ? (
          // Account active
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                <CheckCircle className="w-5 h-5 inline mr-2" />
                Ready to Receive Tips!
              </h3>
              <p className="text-sm text-gray-600">
                Your payment account is active. You can now receive tips from users who 
                appreciate your culinary creations.
              </p>
            </div>
            
            {/* Tip Settings */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Tip Settings</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={paymentStatus.paymentAccount.acceptsTips}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    disabled
                  />
                  <span className="ml-2 text-sm text-gray-700">Accept tips</span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          // Account restricted
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              Account Restricted
            </h3>
            <p className="text-sm text-gray-600">
              Your payment account has been restricted. Please contact support for assistance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}