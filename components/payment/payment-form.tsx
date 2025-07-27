'use client';

import { useState, useEffect } from 'react';
import { 
  useStripe, 
  useElements, 
  PaymentElement,
  PaymentRequestButtonElement,
  PaymentRequestPaymentMethodEvent
} from '@stripe/react-stripe-js';
import { CreditCard, Smartphone, Loader2 } from 'lucide-react';

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  amount: number; // in cents
  recipientName: string;
}

export default function PaymentForm({
  onSuccess,
  onError,
  amount,
  recipientName
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);

  // Initialize Payment Request for Apple Pay/Google Pay
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: `Tip for ${recipientName}`,
        amount: amount,
      },
      requestPayerName: false,
      requestPayerEmail: false,
    });

    // Check if Apple Pay/Google Pay is available
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      } else {
        // If no express payment methods available, show card form immediately
        setShowCardForm(true);
      }
    });

    // Handle express payment method selection
    pr.on('paymentmethod', async (ev: PaymentRequestPaymentMethodEvent) => {
      try {
        setLoading(true);
        
        // Confirm payment with Stripe
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin, // Not used for programmatic confirmation
          },
          redirect: 'if_required'
        });

        if (error) {
          ev.complete('fail');
          onError(error.message || 'Payment failed');
        } else {
          ev.complete('success');
          onSuccess();
        }
      } catch (err) {
        ev.complete('fail');
        onError('Payment failed. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  }, [stripe, amount, recipientName, elements, onSuccess, onError]);

  const handleCardPayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system not ready. Please try again.');
      return;
    }

    try {
      setLoading(true);

      // Confirm payment using Payment Element
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, // Not used for programmatic confirmation
        },
        redirect: 'if_required'
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err) {
      onError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading payment options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Express Payment Methods (Apple Pay/Google Pay) */}
      {canMakePayment && paymentRequest && !loading && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Pay with</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    theme: 'dark',
                    height: '48px',
                    type: 'default',
                  },
                },
              }}
            />
          </div>

          {!showCardForm && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCardForm(true)}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay with card
              </button>
            </>
          )}
        </div>
      )}

      {/* Card Payment Form */}
      {(showCardForm || !canMakePayment) && (
        <form onSubmit={handleCardPayment} className="space-y-4">
          {canMakePayment && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Card payment
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <PaymentElement
              options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    name: '',
                    email: '',
                  }
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Complete Payment`
            )}
          </button>
        </form>
      )}

      {/* Security Note */}
      <div className="text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center space-x-1">
          <Smartphone className="w-3 h-3" />
          <span>Secured by Stripe</span>
        </div>
        <p className="mt-1">Your payment information is encrypted and secure</p>
      </div>
    </div>
  );
}