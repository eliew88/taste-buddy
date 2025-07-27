'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { X, DollarSign, Heart, AlertCircle, CheckCircle } from 'lucide-react';
import { useFeatureFlag } from '@/lib/feature-flags';
import PaymentForm from './payment-form';

// Utility functions for client-side calculations
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const calculatePlatformFee = (amount: number, feePercent: number = 5) => {
  const platformFeeAmount = amount * (feePercent / 100);
  const netAmount = amount - platformFeeAmount;
  return {
    tipAmount: amount,
    platformFeeAmount,
    netAmount,
  };
};

interface EnhancedTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipeId?: string;
  recipeTitle?: string;
}

const PRESET_AMOUNTS = [5, 10, 20];

export default function EnhancedTipModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipeId,
  recipeTitle
}: EnhancedTipModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canSendTips, setCanSendTips] = useState<boolean | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  
  const paymentsEnabled = useFeatureFlag('enablePayments');
  const enhancedPaymentsEnabled = useFeatureFlag('enhancedPayments');
  const anyPaymentsEnabled = paymentsEnabled || enhancedPaymentsEnabled;
  const stripePromise = getStripe();


  useEffect(() => {
    if (isOpen && anyPaymentsEnabled) {
      checkPaymentEligibility();
    }
  }, [isOpen, anyPaymentsEnabled]);

  const checkPaymentEligibility = async () => {
    try {
      const response = await fetch('/api/payment/status');
      const data = await response.json();
      if (data.success) {
        setCanSendTips(data.data.canSendTips);
        setIsGuest(data.data.isGuest || false);
      }
    } catch (err) {
      console.error('Failed to check payment eligibility:', err);
      setCanSendTips(false);
    }
  };

  const handlePresetClick = (preset: number) => {
    setSelectedPreset(preset);
    setAmount(preset.toString());
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setAmount(value);
      setSelectedPreset(null); // Clear preset when custom amount is entered
    }
  };

  const getAmountInCents = () => {
    const numAmount = parseFloat(amount);
    return isNaN(numAmount) ? 0 : Math.round(numAmount * 100);
  };

  const getFeeBreakdown = () => {
    const amountInCents = getAmountInCents();
    if (amountInCents === 0) return null;
    
    const breakdown = calculatePlatformFee(amountInCents / 100);
    return {
      tip: formatCurrency(breakdown.tipAmount),
      fee: formatCurrency(breakdown.platformFeeAmount),
      chef: formatCurrency(breakdown.netAmount)
    };
  };

  const createPaymentIntent = async () => {
    const amountInCents = getAmountInCents();
    if (amountInCents < 100) {
      setError('Minimum tip amount is $1.00');
      return;
    }

    if (amountInCents > 10000) {
      setError('Maximum tip amount is $100.00');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create payment intent
      const response = await fetch('/api/payment/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          recipeId: recipeId || null,
          amount: amountInCents / 100, // Convert back to dollars for API
          message: message || `Thanks for the amazing ${recipeTitle || 'recipe'}!`,
          isAnonymous,
          guestEmail: isGuest ? guestEmail : undefined
        })
      });

      const data = await response.json();

      if (data.success && data.data.clientSecret) {
        setClientSecret(data.data.clientSecret);
        setShowPaymentForm(true);
      } else {
        setError(data.error || 'Failed to create payment intent');
      }
    } catch (err) {
      setError('Failed to process tip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      onClose();
      // Reset form
      setAmount('');
      setSelectedPreset(null);
      setMessage('');
      setIsAnonymous(false);
      setSuccess(false);
      setShowPaymentForm(false);
      setClientSecret(null);
      setGuestEmail('');
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    setShowPaymentForm(false);
    setClientSecret(null);
  };

  const handleBack = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
    setError(null);
  };

  if (!isOpen) return null;

  const feeBreakdown = getFeeBreakdown();

  // Stripe Elements configuration
  const stripeOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#16a34a', // Green-600
        colorBackground: '#ffffff',
        colorText: '#374151',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      }
    }
  } : undefined;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          {!anyPaymentsEnabled ? (
            // Feature disabled state
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tipping Feature Disabled
              </h3>
              <p className="text-gray-600">
                The tipping feature is currently disabled. Please check back later.
              </p>
            </div>
          ) : success ? (
            // Success state
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tip Sent Successfully!
              </h3>
              <p className="text-gray-600">
                Your appreciation has been sent to {recipientName}.
              </p>
            </div>
          ) : showPaymentForm && clientSecret && stripeOptions ? (
            // Payment form state
            <Elements stripe={stripePromise} options={stripeOptions}>
              <div className="space-y-4">
                {/* Header */}
                <div className="mb-6">
                  <button
                    onClick={handleBack}
                    className="text-sm text-gray-600 hover:text-gray-800 mb-2"
                  >
                    ← Back to tip details
                  </button>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Complete Payment
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span>Tip for {recipientName}</span>
                      <span className="font-semibold">{feeBreakdown?.tip}</span>
                    </div>
                  </div>
                </div>

                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  amount={getAmountInCents()}
                  recipientName={recipientName}
                />
              </div>
            </Elements>
          ) : (
            // Tip details form
            <>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Send a Tip
                </h2>
                <p className="text-gray-600">
                  Show your appreciation for {recipientName}
                  {recipeTitle && <span className="block text-sm">for "{recipeTitle}"</span>}
                </p>
              </div>

              {canSendTips === false && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      You can send tips using any payment method. No account setup required!
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Guest email for non-authenticated users */}
                {isGuest && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email for receipt (optional)
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Amount Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Amount
                  </label>
                  
                  {/* Preset Amounts */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {PRESET_AMOUNTS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                          selectedPreset === preset
                            ? 'bg-green-700 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="Custom amount"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Fee Breakdown */}
                {feeBreakdown && (
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Your tip</span>
                        <span className="font-medium">{feeBreakdown.tip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service fee (5%)</span>
                        <span className="text-gray-500">-{feeBreakdown.fee}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t">
                        <span className="font-medium">{recipientName} receives</span>
                        <span className="font-semibold text-green-700">{feeBreakdown.chef}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add a message (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Thanks for the amazing recipe!"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Anonymous Option */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Send anonymously</span>
                </label>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Continue to Payment Button */}
                <button
                  onClick={createPaymentIntent}
                  disabled={loading || !amount || getAmountInCents() < 100}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating payment...' : `Continue to Payment ${feeBreakdown ? feeBreakdown.tip : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}